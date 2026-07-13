import {createEditorAdapter} from './editor-adapter.js';
import {hashText, validateReplacements, catalogDiagnosticRanges, resourceAnchorKey} from './catalog-guards.js';
import {buildLineIndex,lineNumberAt,mergeIntervals,overlapsIntervals,catalogFingerprints,cacheResourceCounts} from './catalog-helpers.js';
import {measurePerf} from './performance.js';
;(function () {
  const ATTACH_BASE = 'https://img.nga.178.com/attachments';
  const UNCATEGORIZED = '未分类';
  const SYSTEM_UNCATEGORIZED_KEY = '__system_uncategorized__';
  const SORT_STORAGE_KEY = 'resourceSortMode';
  const SORT_MODES = new Set(['default', 'name-asc', 'name-desc']);

  const sourceHost = document.getElementById('source');
  let editor;
  const sourceEditor = document.querySelector('.source-editor');
  const preview = document.getElementById('preview');
  const status = document.getElementById('status');
  const previewStatus = document.getElementById('previewStatus');
  const pathInfo = document.getElementById('pathInfo');
  const loadSampleButton = document.getElementById('loadSample');
  const renderButton = document.getElementById('render');
  const loginNgaButton = document.getElementById('loginNga');
  const postUrlInput = document.getElementById('postUrl');
  const loadPostButton = document.getElementById('loadPost');
  const savePostButton = document.getElementById('savePost');
  const postStatus = document.getElementById('postStatus');
  const resourceList = document.getElementById('resourceList');
  const resourceCount = document.getElementById('resourceCount');
  const resourceSort = document.getElementById('resourceSort');
  const resourceHoverPreview = document.getElementById('resourceHoverPreview');
  const appShell = document.querySelector('.app-shell');
  const mainResizer = document.querySelector('.main-resizer');
  const workbenchPane = document.querySelector('.workbench-pane');
  const workbenchSeparator = document.querySelector('.workbench-separator');

  let paths = null;
  let currentCatalog = null;
  let currentPostContext = null;
  let resourceSortMode = readSortMode();
  const directoryOpenState = new Map();
  const BB_TAGS = new Set(('b i u s del collapse quote code url img flash audio video color size font align list li table tr td th style fixsize span div ' +
    'h hr br crypt random dice pid tid uid mention attach album emoticon left center right justify comment').split(/\s+/));
  const STYLE_ATTRIBUTES = new Set(('color background font align width height line-height border-radius left right top bottom rotate ' +
    'filter-drop-shadow dybg display position margin padding opacity transform z-index').split(/\s+/));
  let catalogTimer = 0;
  let previewTimer = 0;
  let updateVersion = 0;
  let selectedResourceId = '';
  let suppressScheduledChange = false;
  let catalogFingerprintsCurrent = null;
  let previewFingerprint = '';
  let previewStaging = null;

  function cancelPendingUpdates() {
    updateVersion += 1;
    clearTimeout(catalogTimer); clearTimeout(previewTimer);
    catalogTimer = 0; previewTimer = 0;
  }

  function setSourceValue(value) {
    suppressScheduledChange = true;
    editor.setText(value == null ? '' : String(value));
    suppressScheduledChange = false;
  }

  function scheduleLiveUpdates(update) {
    if (suppressScheduledChange) { suppressScheduledChange = false; return; }
    const version = ++updateVersion;
    const text = update?.state?.doc?.toString?.() ?? editor.getText();
    clearTimeout(catalogTimer); clearTimeout(previewTimer);
    setStatus('正在更新资源与预览…');
    catalogTimer = setTimeout(function () { if (version === updateVersion) updateResourceList(text); }, 120);
    previewTimer = setTimeout(function () { if (version === updateVersion) render(false, {version, text}); }, 400);
  }

  function syncResourceFromSelection(selection) {
    if (!currentCatalog) return;
    const candidates = currentCatalog.resources.filter(function (r) { return selection.from === selection.to ? selection.from >= r.range.start && selection.from <= r.range.end : selection.from < r.range.end && selection.to > r.range.start; }).sort(function(a,b){return (a.range.end-a.range.start)-(b.range.end-b.range.start)});
    const id = candidates[0] && candidates[0].stableId;
    if (!id || id === selectedResourceId) return; selectedResourceId=id;
    resourceList.querySelectorAll('.is-active').forEach(function(el){el.classList.remove('is-active')});
    const card=resourceList.querySelector('[data-resource-id="'+cssEscape(id)+'"]'); if(card){card.classList.add('is-active'); let p=card.parentElement.closest('details'); while(p){p.open=true;p=p.parentElement.closest('details')}}
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
    previewStatus.textContent = message;
    previewStatus.classList.toggle('is-error', Boolean(isError));
  }

  async function init() {
    initMainResize();
    initWorkbenchResize();
    initResourceHoverPreview();
    initResourceEditing();
    initResourceSorting();
    editor = createEditorAdapter(sourceHost, { onChange: scheduleLiveUpdates, onSelectionChange: syncResourceFromSelection, onModEnter: render });
    await refreshAuthStatus();
    paths = await window.bbcodePreview.getPaths();
    window.__NGA_REMOTE_ATTACH_BASE = ATTACH_BASE;
    if (window.commonui) {
      window.commonui.getAttachBase = function () { return ATTACH_BASE; };
    }
    pathInfo.textContent = '未自动加载示例 | images: ' + ATTACH_BASE;
    updateResourceList('');
    setStatus('准备就绪');
  }

  async function refreshAuthStatus() {
    try {
      const result = await window.bbcodePreview.authStatus();
      postStatus.textContent = result.loggedIn ? 'NGA 已登录' : 'NGA 未登录';
    } catch (error) {
      postStatus.textContent = '登录状态检查失败：' + error.message;
    }
  }

  async function openLogin() {
    setStatus('正在打开 NGA 登录窗口...');
    try {
      const loggedIn = await window.bbcodePreview.openLogin();
      postStatus.textContent = loggedIn ? 'NGA 已登录' : '未检测到登录态';
      setStatus(loggedIn ? '登录成功' : '登录窗口已关闭，未检测到登录态', !loggedIn);
    } catch (error) {
      setStatus('登录失败：' + error.message, true);
    }
  }

  async function loadPostFromUrl() {
    const postUrl = postUrlInput.value.trim();
    if (!postUrl) {
      setStatus('请输入帖子链接', true);
      return;
    }
    setStatus('正在导入帖子...');
    try {
      const result = await window.bbcodePreview.loadPost(postUrl);
      currentPostContext = result.context;
      setSourceValue(currentPostContext.content || '');
      postStatus.textContent = '已导入 tid=' + currentPostContext.tid + ', pid=' + currentPostContext.pid;
      setStatus('已导入帖子：' + (currentPostContext.subject || '(无标题)'));
      renderImmediately();
    } catch (error) {
      setStatus('导入帖子失败：' + error.message, true);
    }
  }

  async function saveCurrentPost() {
    if (!currentPostContext) {
      setStatus('请先导入帖子', true);
      return;
    }
    if (!confirm('确认发布当前 BBCode 到已导入的帖子？')) return;
    setStatus('正在发布修改...');
    try {
      const result = await window.bbcodePreview.savePost(editor.getText());
      setStatus(result.message || '发布成功');
      postStatus.textContent = '发布成功 tid=' + currentPostContext.tid;
    } catch (error) {
      setStatus('发布失败：' + error.message, true);
    }
  }

  async function loadSample() {
    try {
      setSourceValue(await window.bbcodePreview.readSample());
      setStatus('已加载示例 BBCode');
      renderImmediately();
    } catch (error) {
      setStatus('加载示例失败：' + error.message, true);
    }
  }

  function renderImmediately(viewState) {
    cancelPendingUpdates();
    render(true, { force: true, version: updateVersion, text: editor.getText() });
    restoreResourceViewState(viewState);
  }

  function render(rebuildCatalog, scheduled) {
    const txt = scheduled?.text ?? editor.getText();
    const version = scheduled?.version ?? updateVersion;
    if (version !== updateVersion) return;
    if (rebuildCatalog !== false) updateResourceList(txt);
    const fingerprint = hashText(txt);
    if (!scheduled?.force && fingerprint === previewFingerprint) { setStatus('资源已更新，预览内容未变化'); return; }
    try {
      if (!previewStaging) { previewStaging=document.createElement('div'); previewStaging.className='ubbcode preview-content preview-staging'; previewStaging.hidden=true; previewStaging.setAttribute('aria-hidden','true'); preview.parentNode.appendChild(previewStaging); }
      previewStaging.replaceChildren();
      renderWithOriginalParser(txt, previewStaging);
      if (version !== updateVersion) { previewStaging.replaceChildren(); return; }
      preview.replaceChildren(...Array.from(previewStaging.childNodes)); previewFingerprint=fingerprint;
      const hints=currentCatalog?.errors.length; setStatus(hints?'预览已更新，资源提示 '+hints+' 项':'已使用 NGA 原解析器渲染',Boolean(hints));
    } catch(error) { previewStaging?.replaceChildren(); const node=document.createElement('div');node.className='render-error';node.textContent=error.stack||error.message;preview.replaceChildren(node);setStatus('NGA 原解析器失败：'+error.message,true); }
  }
  function renderWithOriginalParser(txt, target) {
    if (!window.ubbcode || typeof window.ubbcode.bbsCode !== 'function') throw new Error('ubbcode.bbsCode 不可用');
    if (window.__NGA_PATCH_UBBCODE_ATTACH) window.__NGA_PATCH_UBBCODE_ATTACH();
    const args={c:target,txt:txt.replace(/\r?\n/g,'<br/>'),opt:4|1|16|32768,noImg:0,fId:0,inTopImg:[0,0],isSig:0,isLesser:true,maxWidthO:document.getElementById('previewHost')};
    measurePerf('nga.bbsCode',()=>window.ubbcode.bbsCode(args),{length:txt.length});
  }

  function initMainResize() {
    if (!appShell || !mainResizer) return;
    let dragging = false;

    mainResizer.addEventListener('mousedown', function (event) {
      dragging = true;
      document.body.classList.add('resizing-main');
      event.preventDefault();
    });

    window.addEventListener('mousemove', function (event) {
      if (!dragging) return;
      const rect = appShell.getBoundingClientRect();
      const top = Math.min(Math.max(event.clientY - rect.top, 220), rect.height - 220);
      appShell.style.gridTemplateRows = top + 'px 8px minmax(220px, 1fr)';
    });

    window.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('resizing-main');
    });
  }

  function initWorkbenchResize() {
    if (!workbenchPane || !workbenchSeparator) return;
    const gutterWidth = 8;
    const editorMinWidth = 320;
    const resourceMinWidth = 360;
    const desktopMedia = window.matchMedia('(min-width: 1001px)');
    let pointerId = null;
    let editorRatio = 0.58;

    function clampEditorWidth(width, availableWidth) {
      const maxWidth = Math.max(editorMinWidth, availableWidth - resourceMinWidth);
      return Math.min(Math.max(width, editorMinWidth), maxWidth);
    }

    function applyRatio() {
      if (!desktopMedia.matches) {
        cleanupDrag();
        workbenchPane.style.removeProperty('grid-template-columns');
        return;
      }
      const availableWidth = Math.max(0, workbenchPane.getBoundingClientRect().width - gutterWidth);
      const editorWidth = clampEditorWidth(availableWidth * editorRatio, availableWidth);
      workbenchPane.style.gridTemplateColumns = editorWidth + 'px ' + gutterWidth + 'px minmax(' + resourceMinWidth + 'px, 1fr)';
    }

    function cleanupDrag(event) {
      if (event?.pointerId != null && pointerId !== null && event.pointerId !== pointerId) return;
      pointerId = null;
      document.body.classList.remove('resizing-workbench');
    }

    workbenchSeparator.addEventListener('pointerdown', function (event) {
      if (!desktopMedia.matches || (event.button !== undefined && event.button !== 0)) return;
      pointerId = event.pointerId;
      workbenchSeparator.setPointerCapture(pointerId);
      document.body.classList.add('resizing-workbench');
      event.preventDefault();
    });

    workbenchSeparator.addEventListener('pointermove', function (event) {
      if (event.pointerId !== pointerId || !desktopMedia.matches) return;
      const rect = workbenchPane.getBoundingClientRect();
      const availableWidth = Math.max(0, rect.width - gutterWidth);
      const editorWidth = clampEditorWidth(event.clientX - rect.left, availableWidth);
      editorRatio = availableWidth ? editorWidth / availableWidth : editorRatio;
      workbenchPane.style.gridTemplateColumns = editorWidth + 'px ' + gutterWidth + 'px minmax(' + resourceMinWidth + 'px, 1fr)';
    });

    workbenchSeparator.addEventListener('pointerup', cleanupDrag);
    workbenchSeparator.addEventListener('pointercancel', cleanupDrag);
    workbenchSeparator.addEventListener('lostpointercapture', cleanupDrag);
    window.addEventListener('blur', cleanupDrag);
    window.addEventListener('resize', applyRatio);
    desktopMedia.addEventListener('change', applyRatio);
    applyRatio();
  }

  function initResourceHoverPreview() {
    if (!resourceList || !resourceHoverPreview) return;
    const previewImage = resourceHoverPreview.querySelector('img');
    let activeLink = null;

    function hidePreview() {
      activeLink = null;
      resourceHoverPreview.classList.remove('is-visible');
      previewImage.removeAttribute('src');
    }

    previewImage.addEventListener('load', function () {
      if (!activeLink || !previewImage.naturalWidth || !previewImage.naturalHeight) return;
      resourceHoverPreview.classList.add('is-visible');
      positionResourceHoverPreview(activeLink);
    });

    previewImage.addEventListener('error', hidePreview);

    resourceList.addEventListener('mouseover', function (event) {
      const link = event.target.closest('.resource-thumb-link');
      if (!link || !resourceList.contains(link) || link === activeLink) return;
      activeLink = link;
      resourceHoverPreview.classList.remove('is-visible');
      previewImage.src = link.dataset.previewUrl || '';
    });

    resourceList.addEventListener('mousemove', function (event) {
      const link = event.target.closest('.resource-thumb-link');
      if (!link || !resourceList.contains(link) || !resourceHoverPreview.classList.contains('is-visible')) return;
      positionResourceHoverPreview(link);
    });

    resourceList.addEventListener('mouseout', function (event) {
      const link = event.target.closest('.resource-thumb-link');
      if (!link || link.contains(event.relatedTarget)) return;
      hidePreview();
    });

    window.addEventListener('resize', hidePreview);
  }

  function positionResourceHoverPreview(anchor) {
    const gap = 12;
    const margin = 12;
    const resourceRect = resourceList.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const previewRect = resourceHoverPreview.getBoundingClientRect();
    const width = previewRect.width;
    const height = previewRect.height;
    const leftSpace = resourceRect.left - margin - gap;
    const rightSpace = window.innerWidth - resourceRect.right - margin - gap;
    let left;

    if (leftSpace >= width || leftSpace >= rightSpace) {
      left = resourceRect.left - width - gap;
    } else {
      left = resourceRect.right + gap;
    }

    if (left < margin) left = margin;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;

    let top = anchorRect.top + (anchorRect.height / 2) - (height / 2);
    if (top < margin) top = margin;
    if (top + height > window.innerHeight - margin) top = window.innerHeight - height - margin;

    resourceHoverPreview.style.left = left + 'px';
    resourceHoverPreview.style.top = top + 'px';
  }

  function initResourceEditing() {
    resourceList.addEventListener('click', function (event) {
      const action = event.target.closest('[data-resource-action]');
      if (action && resourceList.contains(action)) {
        event.stopPropagation();
        const start = Number(action.dataset.start);
        const end = Number(action.dataset.end);
        if (Number.isFinite(start) && Number.isFinite(end)) {
          applyReplacements([{ start, end, value: action.dataset.value || '', expected: action.dataset.expected }], captureResourceViewState(action));
        }
        return;
      }
      if (event.target.closest('[data-edit-kind]')) event.stopPropagation();
    });

    resourceList.addEventListener('keydown', function (event) {
      if (event.target.closest('[data-edit-kind]') && event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
        event.target.blur();
      }
    });

    resourceList.addEventListener('change', function (event) {
      const control = event.target.closest('[data-edit-kind]');
      if (!control || !resourceList.contains(control)) return;
      applyResourceEdit(control);
    });
  }

  function applyResourceEdit(control) {
    const kind = control.dataset.editKind;
    let nextValue = control.value || '';
    if (kind === 'comment-name-bulk') {
      const tokenIds = (control.dataset.tokenIds || '').split(',').filter(Boolean);
      const replacements = tokenIds.map(function (id) {
        const token = currentCatalog && currentCatalog.tokensById[id];
        return token ? { start: token.nameRange.start, end: token.nameRange.end, value: nextValue, expected: token.name } : null;
      }).filter(Boolean);
      applyReplacements(replacements, captureResourceViewState(control));
      return;
    }

    if (kind === 'color') {
      const alphaControl = control.parentNode && control.parentNode.querySelector('[data-color-alpha]');
      const alpha = alphaControl ? alphaControl.value : (control.dataset.alpha || '');
      nextValue = nextValue + normalizeAlpha(alpha);
    }

    const start = Number(control.dataset.start);
    const end = Number(control.dataset.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    applyReplacements([{ start, end, value: nextValue, expected: control.dataset.expected }], captureResourceViewState(control));
  }

  function captureResourceViewState(control) {
    const anchor = control ? control.closest('[data-resource-key]') : null;
    const listRect = resourceList.getBoundingClientRect();
    const anchorRect = anchor ? anchor.getBoundingClientRect() : null;
    return {
      scrollTop: resourceList.scrollTop,
      focusKey: control ? control.dataset.focusKey || '' : '',
      anchorKey: anchor ? anchor.dataset.resourceKey || '' : '',
      anchorOffset: anchorRect ? anchorRect.top - listRect.top : null,
      selectionStart: control && typeof control.selectionStart === 'number' ? control.selectionStart : null,
      selectionEnd: control && typeof control.selectionEnd === 'number' ? control.selectionEnd : null
    };
  }

  function restoreResourceViewState(state) {
    if (!state) return;
    function restore() {
      resourceList.scrollTop = state.scrollTop || 0;
      if (state.anchorKey && state.anchorOffset !== null) {
        const anchor = resourceList.querySelector('[data-resource-key="' + cssEscape(state.anchorKey) + '"]');
        if (anchor) {
          const listRect = resourceList.getBoundingClientRect();
          const anchorRect = anchor.getBoundingClientRect();
          resourceList.scrollTop += anchorRect.top - listRect.top - state.anchorOffset;
        }
      }
      if (state.focusKey) restoreFocusControl(state);

    }
    requestAnimationFrame(restore);
  }

  function restoreFocusControl(state) {
    const selector = '[data-focus-key="' + cssEscape(state.focusKey) + '"]';
    const control = resourceList.querySelector(selector);
    if (!control) return;
    control.focus({ preventScroll: true });
    if (state.selectionStart !== null && typeof control.setSelectionRange === 'function') {
      const max = control.value ? control.value.length : 0;
      control.setSelectionRange(Math.min(state.selectionStart, max), Math.min(state.selectionEnd, max));
    }
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    const slash = String.fromCharCode(92);
    return String(value).split('').map(function (char) {
      return /[a-zA-Z0-9_-]/.test(char) ? char : slash + char.charCodeAt(0).toString(16) + ' ';
    }).join('');
  }

  function applyReplacements(replacements, viewState) {
    const txt = editor.getText();
    const checked = validateReplacements(txt, currentCatalog && currentCatalog.generation, replacements);
    if (!checked.ok) {
      if (checked.reason === 'overlap') { setStatus('资源修改范围重叠，已取消', true); return; }
      if (checked.reason === 'empty') return;
      updateResourceList(txt); setStatus('资源已过期，已重新解析；请重试修改', true); return;
    }
    const valid = checked.replacements;
    suppressScheduledChange = true;
    editor.dispatchChanges(valid.map(function(item){return {start:item.start,end:item.end,value:item.value}}));
    suppressScheduledChange = false;
    renderImmediately(viewState);
  }

  function readSortMode() {
    const value = localStorage.getItem(SORT_STORAGE_KEY);
    return SORT_MODES.has(value) ? value : 'default';
  }

  function initResourceSorting() {
    resourceSort.value = resourceSortMode;
    resourceSort.addEventListener('change', function () {
      const next = resourceSort.value;
      resourceSortMode = SORT_MODES.has(next) ? next : 'default';
      localStorage.setItem(SORT_STORAGE_KEY, resourceSortMode);
      const viewState = captureResourceViewState(null);
      rebuildResourceTree();
      restoreResourceViewState(viewState);
    });
    resourceList.addEventListener('toggle', function (event) {
      const details = event.target.closest && event.target.closest('.catalog-dir[data-directory-key]');
      if (details) directoryOpenState.set(details.dataset.directoryKey, details.open);
    }, true);
  }

  function rebuildResourceTree() {
    if (!currentCatalog) return;
    const tree=measurePerf('catalog.tree',()=>buildResourceTree(currentCatalog),{resources:currentCatalog.resources.length});
    const html=renderCatalogSummary(currentCatalog)+renderTreeNode(tree,0); measurePerf('catalog.innerHTML',()=>{resourceList.innerHTML=html},{resources:currentCatalog.resources.length}); if(selectedResourceId){resourceList.querySelector('[data-resource-id="'+cssEscape(selectedResourceId)+'"]')?.classList.add('is-active')}
  }

  function updateResourceList(bbcode) {
    const next=measurePerf('catalog.parse',()=>parseResourceCatalog(bbcode||''),{length:(bbcode||'').length});
    const nextFp=measurePerf('catalog.fingerprint',()=>catalogFingerprints(next),{resources:next.resources.length});
    const previousFp=catalogFingerprintsCurrent; currentCatalog=next; catalogFingerprintsCurrent=nextFp;
    editor.setDecorations(catalogDiagnosticRanges(next.errors,(bbcode||'').length)); resourceCount.textContent=String(next.resources.length);
    if(previousFp&&previousFp.content===nextFp.content){if(previousFp.line!==nextFp.line)updateCatalogLines(next);return}
    if(!next.resources.length&&!next.errors.length){resourceList.innerHTML='<div class="resource-empty">未发现资源</div>';return}
    measurePerf('catalog.renderHTML',()=>rebuildResourceTree(),{resources:next.resources.length});
  }
  function updateCatalogLines(catalog){
    const byId=new Map(catalog.resources.map(r=>[r.stableId,r]));
    resourceList.querySelectorAll('[data-locate-id]').forEach(button=>{const item=byId.get(button.dataset.locateId);if(item)button.textContent='L'+(item.line||'')});
    const byError=new Map(catalog.errors.map(e=>[e.id,e])); resourceList.querySelectorAll('[data-locate-error]').forEach(button=>{const e=byError.get(button.dataset.locateError);if(e)button.textContent='第 '+e.line+' 行：'+e.message});
  }

  function parseResourceCatalog(bbcode) {
    const resources = [];
    const errors = [];
    const tokensById = Object.create(null);
    const consumed = [];
    const prefixStack = [];
    const suffixStack = [];
    const lineStarts=buildLineIndex(bbcode);
    const lines = splitLinesWithOffsets(bbcode).map((x,index)=>({...x,line:index+1}));
    const imageDefaults = [];
    let tokenSeq = 0;
    let resourceSeq = 0;

    lines.forEach(function (lineInfo) {
      const events = [];
      const line = lineInfo.text;
      const commentRegex = /(\[comment\s+\/\/\s*)([^\]]*)(\])/gi;
      let match;

      while ((match = commentRegex.exec(line))) {
        const token = parseCommentToken(match, lineInfo.offset, tokenSeq++, lineInfo.line);
        tokensById[token.id] = token;
        if (token.mode === 'imageDefault') imageDefaults.push(token);
        events.push({ kind: 'comment', index: match.index, token });
      }

      collectDybgEvents(line, lineInfo, events, bbcode);
      collectUrlEvents(line, lineInfo, events, bbcode);
      collectImgEvents(line, lineInfo, events, bbcode);
      events.sort(function (a, b) {
        if (a.index !== b.index) return a.index - b.index;
        return a.kind === 'comment' ? -1 : 1;
      });

      let currentNameToken = null;
      events.forEach(function (event) {
        if (event.kind === 'comment') {
          const token = event.token;
          if (token.mode === 'imageDefault') {
            return;
          } else if (token.mode === 'prefixOpen') {
            prefixStack.push(token);
          } else if (token.mode === 'prefixClose') {
            closeStack(prefixStack, token, '前缀目录', errors);
          } else if (token.mode === 'suffixOpen') {
            suffixStack.push(token);
          } else if (token.mode === 'suffixClose') {
            closeStack(suffixStack, token, '后缀目录', errors);
          } else if (token.feature === 'text') {
            currentNameToken = token;
            const item = extractTextResource(bbcode, line, lineInfo, token, prefixStack, suffixStack, resourceSeq++);
            resources.push(item);
            consumed.push(item.range);
          } else if (token.feature === 'attr') {
            currentNameToken = token;
            const item = extractAttributeResource(line, lineInfo, token, prefixStack, suffixStack, resourceSeq++);
            resources.push(item);
            if (item.range) consumed.push(item.range);
          } else {
            currentNameToken = token;
          }
          return;
        }

        if (event.kind === 'dybg') {
          const item = createImageResource(event, currentNameToken, prefixStack, suffixStack, resourceSeq++);
          resources.push(item);
          consumed.push(item.range);
        } else if (event.kind === 'img') {
          const item = createSimpleResource('image', 'img', event, currentNameToken, prefixStack, suffixStack, resourceSeq++);
          resources.push(item);
          consumed.push(item.range);
        } else if (event.kind === 'url') {
          const item = createSimpleResource('url', 'url', event, currentNameToken, prefixStack, suffixStack, resourceSeq++);
          resources.push(item);
          consumed.push(item.range);
        }
      });
    });

    prefixStack.slice().reverse().forEach(function (token) {
      errors.push(makeError('前缀目录未闭合：' + token.name, token));
    });
    suffixStack.slice().reverse().forEach(function (token) {
      errors.push(makeError('后缀目录未闭合：' + token.name, token));
    });

    collectUncategorized(bbcode, consumed, resources, resourceSeq, lineStarts);
    applyImageDefaults(imageDefaults, resources, errors);
    const generation = hashText(bbcode); const stableCounts=Object.create(null); resources.forEach(function(item){const base=stableResourceId(item,bbcode);const occurrence=stableCounts[base]||0;stableCounts[base]=occurrence+1;item.stableId=base+':'+occurrence}); return { resources, errors, tokensById, generation, snapshot: bbcode };
  }

  function stableResourceId(item, text) { const core=text.slice(item.range.start,item.range.end); return item.type+':'+item.sourceKind+':'+hashText(core)+':'+hashText(item.name||''); }

  function splitLinesWithOffsets(text) {
    const result = [];
    const regex = /.*(?:\r?\n|$)/g;
    let match;
    while ((match = regex.exec(text))) {
      if (!match[0] && match.index === text.length) break;
      const raw = match[0];
      result.push({ text: raw.replace(/\r?\n$/, ''), offset: match.index });
    }
    return result;
  }

  function parseCommentToken(match, lineOffset, seq, lineNumber) {
    const raw = match[2];
    const rawStart = lineOffset + match.index + match[1].length;
    const leading = raw.match(/^\s*/)[0].length;
    const trailing = raw.match(/\s*$/)[0].length;
    const trimmed = raw.slice(leading, raw.length - trailing);
    const trimmedStart = rawStart + leading;
    let mode = 'name';
    let markerStart = '';
    let markerEnd = '';
    let feature = '';
    let nameStartRel = 0;
    let nameEndRel = trimmed.length;

    const imageDefaultMatch = /^#([^!\]=]+)!\u56fe\u7247\s*=\s*(.*)$/.exec(trimmed);
    let defaultValue = '';
    if (imageDefaultMatch) {
      mode = 'imageDefault';
      nameStartRel = trimmed.indexOf(imageDefaultMatch[1]);
      nameEndRel = nameStartRel + imageDefaultMatch[1].length;
      defaultValue = imageDefaultMatch[2];
    } else if (trimmed.startsWith('++')) {
      mode = 'prefixOpen';
      markerStart = '++';
      nameStartRel = 2;
    } else if (trimmed.startsWith('--')) {
      mode = 'prefixClose';
      markerStart = '--';
      nameStartRel = 2;
    } else if (trimmed.endsWith('++')) {
      mode = 'suffixOpen';
      markerEnd = '++';
      nameEndRel = trimmed.length - 2;
    } else if (trimmed.endsWith('--')) {
      mode = 'suffixClose';
      markerEnd = '--';
      nameEndRel = trimmed.length - 2;
    }

    const featureIndex = trimmed.indexOf('!', nameStartRel);
    if (featureIndex !== -1 && featureIndex < nameEndRel) {
      const featureName = trimmed.slice(featureIndex + 1, nameEndRel).trim();
      if (featureName === '文本') feature = 'text';
      if (featureName === '属性') feature = 'attr';
      if (feature) nameEndRel = featureIndex;
    }

    while (nameStartRel < nameEndRel && /\s/.test(trimmed[nameStartRel])) nameStartRel += 1;
    while (nameEndRel > nameStartRel && /\s/.test(trimmed[nameEndRel - 1])) nameEndRel -= 1;

    const name = trimmed.slice(nameStartRel, nameEndRel);
    return {
      id: 'c' + seq,
      mode,
      markerStart,
      markerEnd,
      feature,
      name,
      defaultValue,
      raw,
      line: lineNumber,
      range: { start: lineOffset + match.index, end: lineOffset + match.index + match[0].length },
      nameRange: { start: trimmedStart + nameStartRel, end: trimmedStart + nameEndRel }
    };
  }

  function closeStack(stack, closeToken, label, errors) {
    if (!stack.length) {
      errors.push(makeError(label + '关闭没有对应开始：' + closeToken.name, closeToken));
      return;
    }
    const top = stack[stack.length - 1];
    if (top.name === closeToken.name) {
      stack.pop();
      pairTokens(top, closeToken);
      return;
    }
    const foundIndex = stack.map(function (token) { return token.name; }).lastIndexOf(closeToken.name);
    if (foundIndex === -1) {
      errors.push(makeError(label + '关闭名称不匹配：' + closeToken.name + '，当前为 ' + top.name, closeToken));
      return;
    }
    errors.push(makeError(label + '交叉关闭：' + closeToken.name + '，当前为 ' + top.name, closeToken));
    const openToken = stack.splice(foundIndex, 1)[0];
    pairTokens(openToken, closeToken);
  }

  function pairTokens(openToken, closeToken) {
    openToken.pairedTokenId = closeToken.id;
    closeToken.pairedTokenId = openToken.id;
  }

  function collectDybgEvents(line, lineInfo, events, bbcode) {
    const regex = /dybg\s+([^;\]]*);([^;\]]*);([^;\]]*);([^;\]]*);([^;\]]*);([^\]\s]*)/gi;
    let match;
    while ((match = regex.exec(line))) {
      const fields = [];
      let searchAt = match.index + match[0].indexOf(match[1]);
      for (let i = 1; i <= 6; i += 1) {
        const value = match[i];
        const relStart = line.indexOf(value, searchAt);
        const relEnd = relStart + value.length;
        fields.push({ value, range: { start: lineInfo.offset + relStart, end: lineInfo.offset + relEnd } });
        searchAt = relEnd + 1;
      }
      events.push({
        kind: 'dybg',
        index: match.index,
        range: { start: lineInfo.offset + match.index, end: lineInfo.offset + match.index + match[0].length },
        fields,
        line: lineInfo.line
      });
    }
  }

  function collectUrlEvents(line, lineInfo, events, bbcode) {
    const regex = /\[url=([^\]]*)\]/gi;
    let match;
    while ((match = regex.exec(line))) {
      const valueStart = lineInfo.offset + match.index + 5;
      events.push({
        kind: 'url',
        index: match.index,
        value: match[1],
        valueRange: { start: valueStart, end: valueStart + match[1].length },
        range: { start: lineInfo.offset + match.index, end: lineInfo.offset + match.index + match[0].length },
        line: lineInfo.line
      });
    }
  }

  function collectImgEvents(line, lineInfo, events, bbcode) {
    const regex = /\[img[^\]]*\]([\s\S]*?)\[\/img\]/gi;
    let match;
    while ((match = regex.exec(line))) {
      const openEnd = match[0].indexOf(']') + 1;
      const valueStart = lineInfo.offset + match.index + openEnd;
      events.push({
        kind: 'img',
        index: match.index,
        value: match[1],
        valueRange: { start: valueStart, end: valueStart + match[1].length },
        range: { start: lineInfo.offset + match.index, end: lineInfo.offset + match.index + match[0].length },
        line: lineInfo.line
      });
    }
  }

  function extractTextResource(bbcode, line, lineInfo, token, prefixStack, suffixStack, seq) {
    const localTokenStart = token.range.start - lineInfo.offset;
    const localStart = token.range.end - lineInfo.offset;
    const openStyles = collectOpenStyleTags(line.slice(0, localTokenStart), lineInfo.offset);
    const valueStart = token.range.end;
    const valueEndLocal = findTextContainerEnd(line, localStart, openStyles.length);
    const valueEnd = valueEndLocal === -1 ? valueStart : lineInfo.offset + valueEndLocal;
    const item = createBaseResource('text', '\u6587\u672c', token, prefixStack, suffixStack, seq);
    item.value = bbcode.slice(valueStart, valueEnd);
    item.valueRange = { start: valueStart, end: valueEnd };
    item.range = { start: token.range.start, end: valueEnd };
    item.textStyles = extractTextStyleFields(openStyles);
    if (valueEndLocal === -1) item.errors.push('\u672a\u627e\u5230\u5305\u88f9\u6587\u672c\u7684 style \u95ed\u5408\u6807\u7b7e');
    return item;
  }

  function collectOpenStyleTags(prefix, lineOffset) {
    const stack = [];
    const regex = /\[(\/?)style(?:\s+([^\]]*))?\]/gi;
    let match;
    while ((match = regex.exec(prefix))) {
      if (match[1]) stack.pop();
      else stack.push({ content: match[2] || '', contentStart: lineOffset + match.index + match[0].indexOf(match[2] || '') });
    }
    return stack;
  }

  function findTextContainerEnd(line, localStart, initialDepth) {
    if (!initialDepth) return -1;
    const regex = /\[(\/?)style(?:\s+[^\]]*)?\]/gi;
    regex.lastIndex = localStart;
    let depth = initialDepth;
    let match;
    while ((match = regex.exec(line))) {
      if (match[1]) {
        depth -= 1;
        if (depth < initialDepth) return match.index;
      } else {
        depth += 1;
      }
    }
    return -1;
  }

  function extractTextStyleFields(openStyles) {
    const fields = [];
    openStyles.forEach(function (style) {
      const tokens = tokenizeTagContent(style.content, style.contentStart);
      for (let index = 0; index < tokens.length; index += 1) {
        const key = tokens[index].value.toLowerCase();
        const value = tokens[index + 1];
        if (key === 'color' && value && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value.value)) {
          fields.push({ key: 'color', label: '\u6587\u5b57\u989c\u8272', value: value.value, range: value.range, kind: 'text-color' });
          index += 1;
        } else if (key === 'font' && value && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.value) && Number(value.value) > 0) {
          fields.push({ key: 'font', label: '\u5b57\u53f7 (em)', value: value.value, range: value.range, kind: 'number' });
          index += 1;
        }
      }
    });
    return fields;
  }

  function extractAttributeResource(line, lineInfo, token, prefixStack, suffixStack, seq) {
    const localStart = token.range.end - lineInfo.offset;
    const rest = line.slice(localStart);
    const match = /\[(?!\/)(?!comment\b)([^\]]*)\]/i.exec(rest);
    const item = createBaseResource('attr', '属性', token, prefixStack, suffixStack, seq);
    if (!match) {
      item.value = '';
      item.valueRange = { start: token.range.end, end: token.range.end };
      item.range = { start: token.range.start, end: token.range.end };
      item.errors.push('未找到 !属性 后面的属性标签');
      return item;
    }

    const tagStart = token.range.end + match.index;
    const contentStart = tagStart + 1;
    const contentEnd = contentStart + match[1].length;
    const parts = match[1].trim().split(/\s+/);
    item.tagName = parts.shift() || '';
    item.value = match[1];
    item.valueRange = { start: contentStart, end: contentEnd };
    item.range = { start: tagStart, end: tagStart + match[0].length };
    item.fields = parseKnownAttributes(match[1], contentStart);
    item.attributes = item.fields.map(field=>({key:field.key,value:field.value,label:field.label,range:field.range}));
    item.colors = findColorRanges(match[1], contentStart);
    return item;
  }

  function parseAttributes(content, contentStart) {
    const fields = parseKnownAttributes(content, contentStart);
    return fields.map(function (field) {
      return { key: field.key, value: field.value, label: field.label, range: field.range };
    });
  }

  function parseKnownAttributes(content, contentStart) {
    const tokens = tokenizeTagContent(content, contentStart);
    if (!tokens.length) return [];
    const tagName = tokens[0].value.toLowerCase();
    const fields = [];
    let index = 1;

    function addField(key, label, token, kind) {
      if (!token) return;
      fields.push({ key, label, value: token.value, range: token.range, kind: kind || 'text' });
    }

    function addSequence(key, labels, kind) {
      labels.forEach(function (label) {
        addField(key, label, tokens[index++], kind);
      });
    }

    while (index < tokens.length) {
      const keyToken = tokens[index++];
      const key = keyToken.value.toLowerCase();
      if (tagName === 'fixsize') {
        if (key === 'width') addSequence(key, ['宽度下限', '宽度上限']);
        else if (key === 'height') addSequence(key, ['高度']);
        else if (key === 'background') addSequence(key, ['外背景色', '内背景色'], 'color');
        else addField(key, keyToken.value, tokens[index++]);
        continue;
      }

      if (key === 'filter-drop-shadow') {
        const valueToken = tokens[index++];
        if (valueToken) {
          const parts = valueToken.value.split(';');
          let cursor = valueToken.range.start;
          const color = /#[0-9a-f]{6}(?:[0-9a-f]{2})?/i.exec(parts[0] || '');
          if (color) {
            const start = valueToken.range.start + color.index;
            fields.push({ key, label: '阴影颜色', value: color[0], range: { start, end: start + color[0].length }, kind: 'color' });
          }
          ['阴影X', '阴影Y', '阴影模糊'].forEach(function (label, labelIndex) {
            const partIndex = labelIndex + 1;
            if (parts[partIndex] == null) return;
            cursor = valueToken.range.start + parts.slice(0, partIndex).join(';').length + 1;
            const part = parts[partIndex];
            fields.push({ key, label, value: part, range: { start: cursor, end: cursor + part.length }, kind: 'text' });
          });
        }
      } else if (key === 'dybg') {
        const valueToken = tokens[index++];
        if (valueToken) {
          const parts = valueToken.value.split(';');
          const labels = ['缩放', '位置X', '位置Y', '活动量X', '活动量Y', '图片链接'];
          let cursor = valueToken.range.start;
          parts.forEach(function (part, partIndex) {
            fields.push({ key, label: labels[partIndex] || ('dybg-' + partIndex), value: part, range: { start: cursor, end: cursor + part.length }, kind: partIndex === 5 ? 'url' : 'text' });
            cursor += part.length + 1;
          });
        }
      } else if (key === 'background' || key === 'color') {
        addField(key, key === 'background' ? '背景色' : '文字颜色', tokens[index++], 'color');
      } else if (key === 'width' || key === 'height' || key === 'border-radius' || key === 'line-height' || key === 'left' || key === 'right' || key === 'top' || key === 'bottom' || key === 'rotate' || key === 'font' || key === 'align') {
        addField(key, keyToken.value, tokens[index++]);
      } else {
        addField(key, keyToken.value, tokens[index++]);
      }
    }
    return fields;
  }

  function tokenizeTagContent(content, contentStart) {
    const tokens = [];
    const regex = /\S+/g;
    let match;
    while ((match = regex.exec(content))) {
      tokens.push({ value: match[0], range: { start: contentStart + match.index, end: contentStart + match.index + match[0].length } });
    }
    return tokens;
  }

  function findColorRanges(content, contentStart) {
    const colors = [];
    const regex = /#([0-9a-f]{6})([0-9a-f]{2})?/gi;
    let match;
    while ((match = regex.exec(content))) {
      colors.push({
        value: '#' + match[1],
        alpha: match[2] || '',
        range: { start: contentStart + match.index, end: contentStart + match.index + match[0].length }
      });
    }
    return colors;
  }

  function createImageResource(event, nameToken, prefixStack, suffixStack, seq) {
    const item = createBaseResource('image', 'dybg', nameToken, prefixStack, suffixStack, seq);
    item.params = [
      { label: '缩放', field: event.fields[0] },
      { label: '位置X', field: event.fields[1] },
      { label: '位置Y', field: event.fields[2] },
      { label: '活动量X', field: event.fields[3] },
      { label: '活动量Y', field: event.fields[4] }
    ];
    item.url = event.fields[5].value;
    item.urlRange = event.fields[5].range;
    item.value = item.url;
    item.range = event.range;
    item.line = event.line;
    return item;
  }

  function createSimpleResource(type, sourceKind, event, nameToken, prefixStack, suffixStack, seq) {
    const item = createBaseResource(type, sourceKind, nameToken, prefixStack, suffixStack, seq);
    item.value = event.value;
    item.url = event.value;
    item.valueRange = event.valueRange;
    item.urlRange = event.valueRange;
    item.range = event.range;
    item.line = event.line;
    return item;
  }

  function createBaseResource(type, sourceKind, nameToken, prefixStack, suffixStack, seq) {
    const segmentTokens = [];
    const prefixParts = prefixStack.map(function (token) {
      segmentTokens.push(token.id);
      return token.name;
    });
    const suffixTokens = suffixStack.slice().reverse();
    const suffixParts = suffixTokens.map(function (token) {
      segmentTokens.push(token.id);
      return token.name;
    });
    const hasName = Boolean(nameToken && nameToken.name);
    const name = hasName ? nameToken.name : UNCATEGORIZED;
    const parts = hasName ? prefixParts.concat([name], suffixParts) : [UNCATEGORIZED];
    const pathTokenIds = hasName ? prefixStack.map(function (token) { return token.id; }).concat([nameToken.id], suffixTokens.map(function (token) { return token.id; })) : [];
    return {
      id: 'r' + seq,
      type,
      sourceKind,
      name,
      nameTokenId: nameToken ? nameToken.id : '',
      pathParts: parts,
      pathTokenIds,
      pathKeys: hasName ? pathTokenIds.map(function (id, index) { return id || ('name:' + parts[index]); }) : [SYSTEM_UNCATEGORIZED_KEY],
      path: '\\' + parts.join('\\'),
      line: nameToken ? nameToken.line : 0,
      errors: []
    };
  }

  function collectUncategorized(bbcode, consumed, resources, resourceSeq, lineStarts) {
    const ranges = mergeIntervals(consumed);
    const addIfFree = function (type, sourceKind, start, end, value, valueStart, valueEnd) {
      if (overlapsIntervals(ranges,start,end)) return;
      const item = {
        id: 'r' + resourceSeq++,
        type,
        sourceKind,
        name: UNCATEGORIZED,
        pathParts: [UNCATEGORIZED],
        pathTokenIds: [],
        pathKeys: [SYSTEM_UNCATEGORIZED_KEY],
        path: '\\' + UNCATEGORIZED,
        line: lineNumberAt(lineStarts,start),
        value,
        url: value,
        valueRange: { start: valueStart, end: valueEnd },
        urlRange: { start: valueStart, end: valueEnd },
        range: { start, end },
        errors: []
      };
      resources.push(item);
      ranges.splice(0,ranges.length,...mergeIntervals(ranges.concat(item.range)));
    };

    let match;
    const dybgTag = /dybg\s+([^;\]]*);([^;\]]*);([^;\]]*);([^;\]]*);([^;\]]*);([^\]\s]*)/gi;
    while ((match = dybgTag.exec(bbcode))) {
      const fields = [];
      let searchAt = match.index + match[0].indexOf(match[1]);
      for (let i = 1; i <= 6; i += 1) {
        const value = match[i];
        const relStart = bbcode.indexOf(value, searchAt);
        const relEnd = relStart + value.length;
        fields.push({ value, range: { start: relStart, end: relEnd } });
        searchAt = relEnd + 1;
      }
      if (!overlapsIntervals(ranges,match.index,match.index+match[0].length)) {
        const item = {
          id: 'r' + resourceSeq++,
          type: 'image',
          sourceKind: 'dybg',
          name: UNCATEGORIZED,
          pathParts: [UNCATEGORIZED],
          pathTokenIds: [],
          pathKeys: [SYSTEM_UNCATEGORIZED_KEY],
          path: '\\' + UNCATEGORIZED,
          line: lineNumberAt(lineStarts,match.index),
          params: [
            { label: '缩放', field: fields[0] },
            { label: '位置X', field: fields[1] },
            { label: '位置Y', field: fields[2] },
            { label: '活动量X', field: fields[3] },
            { label: '活动量Y', field: fields[4] }
          ],
          url: fields[5].value,
          urlRange: fields[5].range,
          value: fields[5].value,
          range: { start: match.index, end: match.index + match[0].length },
          errors: []
        };
        resources.push(item);
        ranges.splice(0,ranges.length,...mergeIntervals(ranges.concat(item.range)));
      }
    }

    const imgTag = /\[img[^\]]*\]([\s\S]*?)\[\/img\]/gi;
    while ((match = imgTag.exec(bbcode))) {
      const openEnd = match[0].indexOf(']') + 1;
      addIfFree('image', 'img', match.index, match.index + match[0].length, match[1], match.index + openEnd, match.index + openEnd + match[1].length);
    }

    const urlTag = /\[url=([^\]]*)\]/gi;
    while ((match = urlTag.exec(bbcode))) {
      addIfFree('url', 'url', match.index, match.index + match[0].length, match[1], match.index + 5, match.index + 5 + match[1].length);
    }
  }

  function applyImageDefaults(declarations, resources, errors) {
    const byName = Object.create(null);
    declarations.forEach(function (declaration) {
      if (!byName[declaration.name]) byName[declaration.name] = [];
      byName[declaration.name].push(declaration);
    });
    const resourcesByName=Object.create(null); resources.forEach(function(item){if(item.type!=='image')return;const name=item.pathParts[item.pathParts.length-1];(resourcesByName[name]||(resourcesByName[name]=[])).push(item)});
    Object.keys(byName).forEach(function (name) {
      const matches = byName[name];
      if (matches.length > 1) {
        matches.forEach(function (token) { errors.push(makeError('\u91cd\u590d\u7684\u56fe\u7247\u9ed8\u8ba4\u58f0\u660e\uff1a' + name, token)); });
        return;
      }
      (resourcesByName[name]||[]).forEach(function(item){item.defaultUrl=matches[0].defaultValue});
    });
  }

  function makeError(message, token) {
    return {
      id: 'e' + token.id,
      message,
      line: token.line,
      pathParts: [UNCATEGORIZED],
      path: '\\' + UNCATEGORIZED,
      from: (token.fullRange || token.nameRange || token.range).start,
      to: (token.fullRange || token.nameRange || token.range).end,
      severity: 'error'
    };
  }

  function buildResourceTree(catalog) {
    const root = { key: '', name: '', children: [], childMap: Object.create(null), resources: [], tokenIds: new Set(), errors: [], sourceOrder: -1 };
    catalog.resources.forEach(function (item, resourceIndex) {
      let node = root;
      item.pathParts.forEach(function (part, index) {
        const isSystemUncategorized = item.pathKeys && item.pathKeys[index] === SYSTEM_UNCATEGORIZED_KEY;
        const segmentKey = isSystemUncategorized ? SYSTEM_UNCATEGORIZED_KEY : ('name:' + part);
        const fullKey = (node.key ? node.key + '/' : '') + segmentKey;
        if (!node.childMap[segmentKey]) {
          const child = { key: fullKey, name: part, children: [], childMap: Object.create(null), resources: [], tokenIds: new Set(), errors: [], sourceOrder: resourceIndex, isSystemUncategorized: fullKey === SYSTEM_UNCATEGORIZED_KEY };
          node.childMap[segmentKey] = child;
          node.children.push(child);
        }
        node = node.childMap[segmentKey];
        const tokenId = item.pathTokenIds[index];
        if (tokenId) {
          node.tokenIds.add(tokenId);
          const token = catalog.tokensById[tokenId];
          if (token && token.pairedTokenId) node.tokenIds.add(token.pairedTokenId);
        }
      });
      node.resources.push(item);
    });
    catalog.errors.forEach(function (error) { root.errors.push(error); });
    cacheResourceCounts(root); return root;
  }

  function renderCatalogSummary(catalog) {
    const errorHtml = catalog.errors.length
      ? '<div class="resource-errors">' + catalog.errors.map(function (error) {
        const locate = Number.isInteger(error.from) && Number.isInteger(error.to) && error.from < error.to ? ' data-locate-error="' + escapeHtml(error.id) + '"' : '';
        return '<button type="button" class="resource-error"' + locate + '>第 ' + escapeHtml(error.line) + ' 行：' + escapeHtml(error.message) + '</button>';
      }).join('') + '</div>'
      : '';
    return '<div class="catalog-summary">资源 ' + catalog.resources.length + ' 项，提示 ' + catalog.errors.length + ' 项</div>' + errorHtml;
  }

  function renderTreeNode(node, depth) {
    const children = node.children.slice().sort(compareDirectories);
    const childHtml = children.map(function (child) {
      const tokenIds = Array.from(child.tokenIds);
      const systemLabel = child.isSystemUncategorized ? '<span class="dir-system-mark">（系统）</span>' : '';
      const rename = tokenIds.length
        ? '<input class="dir-name-input" data-edit-kind="comment-name-bulk" data-focus-key="dir:' + escapeHtml(tokenIds.join(',')) + '" data-token-ids="' + escapeHtml(tokenIds.join(',')) + '" value="' + escapeHtml(child.name) + '" title="修改关联 comment 名称">'
        : '<span class="dir-name-static">' + escapeHtml(child.name) + systemLabel + '</span>';
      const isOpen = directoryOpenState.has(child.key) ? directoryOpenState.get(child.key) : !child.isSystemUncategorized;
      return '<details class="catalog-dir' + (child.isSystemUncategorized ? ' catalog-dir-system' : '') + '" data-directory-key="' + escapeHtml(child.key) + '"' + (isOpen ? ' open' : '') + ' style="--depth:' + depth + '"><summary>' + rename + '<span class="dir-count">' + child.resourceCount + '</span></summary>' + renderTreeNode(child, depth + 1) + '</details>';
    }).join('');
    const resources = node.resources.slice();
    if (resourceSortMode !== 'default') resources.sort(compareResources);
    return '<div class="catalog-node">' + childHtml + resources.map(renderResourceItem).join('') + '</div>';
  }

  function compareDirectories(a, b) {
    if (a.isSystemUncategorized !== b.isSystemUncategorized) return a.isSystemUncategorized ? 1 : -1;
    const compared = naturalCompare(a.name, b.name);
    if (resourceSortMode === 'name-desc') return -compared || a.sourceOrder - b.sourceOrder;
    return compared || a.sourceOrder - b.sourceOrder;
  }

  function compareResources(a, b) {
    const compared = naturalCompare(a.name, b.name);
    return (resourceSortMode === 'name-desc' ? -compared : compared) || Number(a.id.slice(1)) - Number(b.id.slice(1));
  }

  function renderResourceItem(item) {
    const typeLabel = item.type === 'image' ? '图片' : item.type === 'url' ? 'URL' : item.type === 'text' ? '文本' : '属性';
    const warnings = item.errors && item.errors.length ? '<div class="resource-item-errors">' + item.errors.map(escapeHtml).join('<br>') + '</div>' : '';
    return '<article class="catalog-resource resource-kind-' + escapeHtml(item.type) + '" data-resource-key="' + escapeHtml(resourceAnchorKey(item)) + '" data-resource-id="' + escapeHtml(item.stableId) + '">' +
      '<header><span class="resource-type resource-type-' + escapeHtml(item.type) + '">' + typeLabel + '</span>' +
      '<span class="resource-source">' + escapeHtml(item.sourceKind) + '</span>' +
      '<button type="button" class="resource-line resource-locate" data-locate-id="' + escapeHtml(item.stableId) + '">L' + escapeHtml(item.line || '') + '</button></header>' +
      '<div class="resource-path" title="' + escapeHtml(item.path) + '">' + escapeHtml(item.path) + '</div>' +
      renderResourceEditor(item) + warnings +
      '</article>';
  }


  function renderResourceEditor(item) {
    if (item.type === 'image') return renderImageEditor(item);
    if (item.type === 'url') return renderInputField('\u94fe\u63a5', item.value, item.valueRange, 'url', 'resource-url-input', { clear: true });
    if (item.type === 'text') return renderTextEditor(item);
    if (item.type === 'attr') return renderAttributeEditor(item);
    return '';
  }

  function renderImageEditor(item) {
    const fullUrl = toFullImageUrl(item.url || '');
    const thumb = item.url ? '<a class="resource-thumb-link" data-preview-url="' + escapeHtml(fullUrl) + '" href="' + escapeHtml(fullUrl) + '" target="_blank" rel="noreferrer"><img class="resource-thumb" loading="lazy" decoding="async" src="' + escapeHtml(fullUrl) + '" alt=""></a>' : '<span class="resource-thumb-empty" role="img" aria-label="图片链接为空"><span class="resource-thumb-empty-marker" aria-hidden="true">×</span></span>';
    const params = item.params ? '<div class="dybg-param-grid">' + item.params.map(function (param) {
      return renderInputField(param.label, param.field.value, param.field.range, 'text');
    }).join('') + '</div>' : '';
    return '<div class="image-editor">' + thumb + '<div class="resource-fields">' + renderInputField('图片链接', item.url || '', item.urlRange, 'text', 'resource-url-input', { clear: true, defaultValue: item.defaultUrl }) + params + '</div></div>';
  }

  function renderTextEditor(item) {
    const styleFields = item.textStyles && item.textStyles.length
      ? '<div class="text-style-fields">' + item.textStyles.map(function (field) {
          return renderInputField(field.label, field.value, field.range, field.kind === 'number' ? 'number' : 'text', field.kind === 'text-color' ? 'color-hex-input' : '', field.kind === 'number' ? { min: '0', step: 'any' } : {});
        }).join('') + '</div>'
      : '';
    return '<div class="resource-fields">' + renderTextareaField('\u6587\u672c', item.value, item.valueRange, { clear: true }) + styleFields + '</div>';
  }

  function renderAttributeEditor(item) {
    const fields = item.fields && item.fields.length
      ? '<div class="attr-list">' + item.fields.map(renderAttributeField).join('') + '</div>'
      : '<div class="attr-list empty-url">无额外属性</div>';
    return '<div class="resource-fields"><label class="attr-raw-field">标签属性 <textarea data-edit-kind="range" data-start="' + item.valueRange.start + '" data-end="' + item.valueRange.end + '" data-expected="' + escapeHtml(item.value) + '">' + escapeHtml(item.value) + '</textarea></label>' + fields + '</div>';
  }

  function renderAttributeField(field) {
    if (field.kind === 'color') return renderColorField(field.label, field.value, field.range);
    return renderInputField(field.label, field.value, field.range, field.kind === 'url' ? 'url' : 'text', field.kind === 'url' ? 'resource-url-input' : '');
  }

  function renderColorField(label, value, range) {
    const parsed = parseColorValue(value || '');
    return '<label class="color-field">' + escapeHtml(label) + '<span class="color-edit"><input class="color-swatch" type="color" data-edit-kind="color" data-focus-key="range:' + range.start + ':' + range.end + ':color" data-start="' + range.start + '" data-end="' + range.end + '" data-expected="' + escapeHtml(value) + '" data-alpha="' + escapeHtml(parsed.alpha) + '" value="' + escapeHtml(parsed.hex) + '"><input class="color-hex-input" data-edit-kind="range" data-color-alpha="1" data-focus-key="range:' + range.start + ':' + range.end + ':hex" data-start="' + range.start + '" data-end="' + range.end + '" data-expected="' + escapeHtml(value || '') + '" value="' + escapeHtml(parsed.full) + '" maxlength="9"></span></label>';
  }

  function parseColorValue(value) {
    const match = String(value || '').match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (!match) return { hex: '#000000', alpha: '', full: String(value || '') };
    return { hex: '#' + match[1], alpha: match[2] || '', full: '#' + match[1] + (match[2] || '') };
  }

  function normalizeAlpha(value) {
    const match = String(value || '').match(/[0-9a-f]{2}$/i);
    return match ? match[0] : '';
  }

  function renderValueActions(value, range, options) {
    const clear = options && options.clear ? '<button type="button" data-resource-action="clear" data-start="' + range.start + '" data-end="' + range.end + '" data-value="" data-expected="' + escapeHtml(value) + '"' + (value ? '' : ' disabled') + '>\u6e05\u7a7a</button>' : '';
    const hasDefault = options && Object.prototype.hasOwnProperty.call(options, 'defaultValue') && options.defaultValue !== undefined;
    const defaultButton = hasDefault ? '<button type="button" data-resource-action="default" data-start="' + range.start + '" data-end="' + range.end + '" data-value="' + escapeHtml(options.defaultValue) + '" data-expected="' + escapeHtml(value) + '"' + (value === options.defaultValue ? ' disabled' : '') + '>\u9ed8\u8ba4</button>' : '';
    return clear || defaultButton ? '<span class="resource-value-actions">' + clear + defaultButton + '</span>' : '';
  }

  function renderInputField(label, value, range, type, className, options) {
    const constraints = options ? (options.min != null ? ' min="' + escapeHtml(options.min) + '"' : '') + (options.step != null ? ' step="' + escapeHtml(options.step) + '"' : '') : '';
    return '<label>' + escapeHtml(label) + '<span class="resource-value-control"><input class="' + escapeHtml(className || '') + '" type="' + escapeHtml(type || 'text') + '" data-edit-kind="range" data-focus-key="range:' + range.start + ':' + range.end + ':input" data-start="' + range.start + '" data-end="' + range.end + '" data-expected="' + escapeHtml(value || '') + '" value="' + escapeHtml(value || '') + '"' + constraints + '>' + renderValueActions(value || '', range, options) + '</span></label>';
  }

  function renderTextareaField(label, value, range, options) {
    return '<label class="text-resource-field">' + escapeHtml(label) + '<span class="resource-value-control"><textarea data-edit-kind="range" data-focus-key="range:' + range.start + ':' + range.end + ':textarea" data-start="' + range.start + '" data-end="' + range.end + '" data-expected="' + escapeHtml(value || '') + '">' + escapeHtml(value || '') + '</textarea>' + renderValueActions(value || '', range, options) + '</span></label>';
  }

  function countResources(node) {
    return node.resources.length + node.children.reduce(function (sum, child) {
      return sum + child.resourceCount;
    }, 0);
  }

  function naturalCompare(a, b) {
    return a.localeCompare(b, 'zh-Hans-CN', { numeric: true });
  }

  function toFullImageUrl(value) {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('./')) return ATTACH_BASE + '/' + value.slice(2);
    if (value.startsWith('/attachments/')) return 'https://img.nga.178.com' + value;
    return value;
  }

  function lineNumberFromOffset(text, offset) {
    return text.slice(0, offset).split(/\r?\n/).length;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  loadSampleButton.addEventListener('click', loadSample);
  renderButton.addEventListener('click', function () { renderImmediately(); });
  loginNgaButton.addEventListener('click', openLogin);
  loadPostButton.addEventListener('click', loadPostFromUrl);
  savePostButton.addEventListener('click', saveCurrentPost);
  resourceSort.value = resourceSortMode;
  resourceList.addEventListener('click', function(event){ if(!currentCatalog)return; const errorButton=event.target.closest('[data-locate-error]'); if(errorButton){const issue=currentCatalog.errors.find(function(e){return e.id===errorButton.dataset.locateError});if(issue&&Number.isInteger(issue.from)&&Number.isInteger(issue.to))editor.setSelection(issue.from,issue.to,true);return;} const locate=event.target.closest('[data-locate-id]'); if(!locate)return; const item=currentCatalog.resources.find(function(r){return r.stableId===locate.dataset.locateId}); if(item){selectedResourceId=item.stableId;editor.setSelection(item.range.start,item.range.end,true);} });

  init().catch(function (error) {
    setStatus('初始化失败：' + error.message, true);
  });
})();
