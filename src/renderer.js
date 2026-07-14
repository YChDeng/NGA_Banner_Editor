import {createEditorAdapter} from './editor-adapter.js';
import {hashText, validateReplacements, catalogDiagnosticRanges, resourceAnchorKey} from './catalog-guards.js';
import {catalogFingerprints,cacheResourceCounts} from './catalog-helpers.js';
import {measurePerf} from './performance.js';
import {buildBannerModel, SYSTEM_UNCATEGORIZED_KEY} from './banner-model.js';
import {deriveResourceBindings} from './banner-model-view.js';
;(function () {
  const ATTACH_BASE = 'https://img.nga.178.com/attachments';
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

  let currentModel = null;
  let currentResourceBindings = [];
  let currentPostContext = null;
  let resourceSortMode = readSortMode();
  const directoryOpenState = new Map();
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
    if (!currentModel) return;
    const candidates = currentResourceBindings.filter(function (r) { return selection.from === selection.to ? selection.from >= r.range.start && selection.from <= r.range.end : selection.from < r.range.end && selection.to > r.range.start; }).sort(function(a,b){return (a.range.end-a.range.start)-(b.range.end-b.range.start)});
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
    await window.bbcodePreview.getPaths();
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
      const hints=currentModel?.diagnostics.length; setStatus(hints?'预览已更新，资源提示 '+hints+' 项':'已使用 NGA 原解析器渲染',Boolean(hints));
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
        const token = currentModel && currentModel.tokensById[id];
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
    const checked = validateReplacements(txt, currentModel && currentModel.generation, replacements);
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

  function deriveResourceView(model, resources) {
    return { resources, errors: model.diagnostics };
  }

  function rebuildResourceTree() {
    if (!currentModel) return;
    const tree=measurePerf('model.tree',()=>buildResourceTree(currentModel,currentResourceBindings),{resources:currentResourceBindings.length});
    const html=renderModelSummary(currentModel,currentResourceBindings)+renderTreeNode(tree,0); measurePerf('model.innerHTML',()=>{resourceList.innerHTML=html},{resources:currentResourceBindings.length}); if(selectedResourceId){resourceList.querySelector('[data-resource-id="'+cssEscape(selectedResourceId)+'"]')?.classList.add('is-active')}
  }

  function updateResourceList(bbcode) {
    const nextModel=measurePerf('model.build',()=>buildBannerModel(bbcode||''),{length:(bbcode||'').length});
    const nextResources=deriveResourceBindings(nextModel);
    const nextFp=measurePerf('model.fingerprint',()=>catalogFingerprints(deriveResourceView(nextModel,nextResources)),{resources:nextResources.length});
    const previousFp=catalogFingerprintsCurrent; currentModel=nextModel; currentResourceBindings=nextResources; catalogFingerprintsCurrent=nextFp;
    editor.setDecorations(catalogDiagnosticRanges(nextModel.diagnostics,(bbcode||'').length)); resourceCount.textContent=String(nextResources.length);
    if(previousFp&&previousFp.content===nextFp.content){if(previousFp.line!==nextFp.line)updateModelLines(nextModel,nextResources);return}
    if(!nextResources.length&&!nextModel.diagnostics.length){resourceList.innerHTML='<div class="resource-empty">未发现资源</div>';return}
    measurePerf('model.renderHTML',()=>rebuildResourceTree(),{resources:nextResources.length});
  }
  function updateModelLines(model, resources){
    const byId=new Map(resources.map(r=>[r.stableId,r]));
    resourceList.querySelectorAll('[data-locate-id]').forEach(button=>{const item=byId.get(button.dataset.locateId);if(item)button.textContent='L'+(item.line||'')});
    const byError=new Map(model.diagnostics.map(e=>[e.id,e])); resourceList.querySelectorAll('[data-locate-error]').forEach(button=>{const e=byError.get(button.dataset.locateError);if(e)button.textContent='第 '+e.line+' 行：'+e.message});
  }

  function buildResourceTree(model, resources) {
    const modelRoot = model.rootBlock;
    const root = { key: '', name: '', children: [], resources: [], tokenIds: new Set(), errors: model.diagnostics.slice(), sourceOrder: -1 };
    const resourceByModelId = new Map();
    resources.forEach(function(resource){
      if(!resourceByModelId.has(resource.modelId)) resourceByModelId.set(resource.modelId, []);
      resourceByModelId.get(resource.modelId).push(resource);
    });
    function projectLeaf(item, parentKey, sourceOrder) {
      const kindKey = item.kind === 'StyleBlock' ? 'style' : 'slot:' + item.type;
      const key = (parentKey ? parentKey + '/' : '') + kindKey + ':' + item.logicalId;
      const tokenIds = new Set();
      if (item.source.nameTokenId) tokenIds.add(item.source.nameTokenId);
      if (item.source.pairedNameTokenId) tokenIds.add(item.source.pairedNameTokenId);
      return {key, name:item.name, children:[], resources:(resourceByModelId.get(item.logicalId)||[]).slice(), tokenIds, errors:[], sourceOrder, isSystemUncategorized:false};
    }
    function projectBlock(block, parentKey, sourceOrder) {
      const key = block.virtual ? SYSTEM_UNCATEGORIZED_KEY : (parentKey ? parentKey + '/' : '') + 'block:' + block.logicalId;
      const node = {key, name:block.name, children:[], resources:[], tokenIds:new Set(), errors:[], sourceOrder, isSystemUncategorized:block.virtual};
      block.sourceOccurrences.forEach(function(source){if(source.tokenId)node.tokenIds.add(source.tokenId);if(source.pairedTokenId)node.tokenIds.add(source.pairedTokenId)});
      block.blocks.forEach(function(child,index){node.children.push(projectBlock(child,key,index))});
      block.slots.forEach(function(slot,index){node.children.push(projectLeaf(slot,key,block.blocks.length+index))});
      block.styleBlocks.forEach(function(style,index){node.children.push(projectLeaf(style,key,block.blocks.length+block.slots.length+index))});
      return node;
    }
    modelRoot.blocks.forEach(function(block,index){root.children.push(projectBlock(block,'',index))});
    modelRoot.slots.forEach(function(slot,index){root.children.push(projectLeaf(slot,'',modelRoot.blocks.length+index))});
    modelRoot.styleBlocks.forEach(function(style,index){root.children.push(projectLeaf(style,'',modelRoot.blocks.length+modelRoot.slots.length+index))});
    cacheResourceCounts(root); return root;
  }
  function renderModelSummary(model, resources) {
    const errorHtml = model.diagnostics.length
      ? '<div class="resource-errors">' + model.diagnostics.map(function (error) {
        const locate = Number.isInteger(error.from) && Number.isInteger(error.to) && error.from < error.to ? ' data-locate-error="' + escapeHtml(error.id) + '"' : '';
        return '<button type="button" class="resource-error"' + locate + '>第 ' + escapeHtml(error.line) + ' 行：' + escapeHtml(error.message) + '</button>';
      }).join('') + '</div>'
      : '';
    return '<div class="catalog-summary">共 ' + resources.length + ' 个资源，' + model.diagnostics.length + ' 个提示</div>' + errorHtml;
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
    return '<div class="color-field"><span class="color-field-label">' + escapeHtml(label) + '</span><span class="color-edit"><input class="color-swatch" type="color" data-edit-kind="color" data-focus-key="range:' + range.start + ':' + range.end + ':color" data-start="' + range.start + '" data-end="' + range.end + '" data-expected="' + escapeHtml(value) + '" data-alpha="' + escapeHtml(parsed.alpha) + '" value="' + escapeHtml(parsed.hex) + '"><input class="color-hex-input" data-edit-kind="range" data-color-alpha="1" data-focus-key="range:' + range.start + ':' + range.end + ':hex" data-start="' + range.start + '" data-end="' + range.end + '" data-expected="' + escapeHtml(value || '') + '" value="' + escapeHtml(parsed.full) + '" maxlength="9"></span></div>';
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
  resourceList.addEventListener('click', function(event){ if(!currentModel)return; const errorButton=event.target.closest('[data-locate-error]'); if(errorButton){const issue=currentModel.diagnostics.find(function(e){return e.id===errorButton.dataset.locateError});if(issue&&Number.isInteger(issue.from)&&Number.isInteger(issue.to))editor.setSelection(issue.from,issue.to,true);return;} const locate=event.target.closest('[data-locate-id]'); if(!locate)return; const item=currentResourceBindings.find(function(r){return r.stableId===locate.dataset.locateId}); if(item){selectedResourceId=item.stableId;editor.setSelection(item.range.start,item.range.end,true);} });

  init().catch(function (error) {
    setStatus('初始化失败：' + error.message, true);
  });
})();
