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
  const renderButton = document.getElementById('render');
  const loginNgaButton = document.getElementById('loginNga');
  const postUrlInput = document.getElementById('postUrl');
  const loadPostButton = document.getElementById('loadPost');
  const savePostButton = document.getElementById('savePost');
  const postStatus = document.getElementById('postStatus');
  const authStatus = document.getElementById('authStatus');
  const codeModeTab = document.getElementById('codeModeTab');
  const advancedModeTab = document.getElementById('advancedModeTab');
  const codeModePanel = document.getElementById('codeModePanel');
  const advancedModePanel = document.getElementById('advancedModePanel');
  const resourceList = document.getElementById('resourceList');
  const resourceCount = document.getElementById('resourceCount');
  const resourceSort = document.getElementById('resourceSort');
  const resourceSearch = document.getElementById('resourceSearch');
  const resourceTypeFilter = document.getElementById('resourceTypeFilter');
  const resourceInspector = document.getElementById('resourceInspector');
  const resourceHoverPreview = document.getElementById('resourceHoverPreview');
  const resourceTooltip = document.getElementById('resourceTooltip');
  const resourceContextMenu = document.getElementById('resourceContextMenu');
  const appShell = document.querySelector('.app-shell');
  const mainResizer = document.querySelector('.main-resizer');

  let currentModel = null;
  let currentResourceBindings = [];
  let currentPostContext = null;
  let resourceSortMode = readSortMode();
  const directoryOpenState = new Map();
  let catalogTimer = 0;
  let previewTimer = 0;
  let updateVersion = 0;
  let selectedResourceId = '';
  let resourceQuery = '';
  let resourceType = 'all';
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
    if (!id || id === selectedResourceId) return;
    selectResource(id, { reveal: true });
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
    previewStatus.textContent = message;
    previewStatus.classList.toggle('is-error', Boolean(isError));
  }

  async function init() {
    initMainResize();
    initResourceHoverPreview();
    initResourceTooltip();
    initImageSlotDrop();
    initResourceContextMenu();
    initResourceEditing();
    initResourceSorting();
    initEditorTabs();
    editor = createEditorAdapter(sourceHost, { onChange: scheduleLiveUpdates, onSelectionChange: syncResourceFromSelection, onModEnter: render });
    await refreshAuthStatus();
    await window.bbcodePreview.getPaths();
    window.bbcodePreview.onMediaContent(function (content) { currentPostContext = currentPostContext ? { ...currentPostContext, content } : currentPostContext; setSourceValue(content); renderImmediately(); });
    window.__NGA_REMOTE_ATTACH_BASE = ATTACH_BASE;
    if (window.commonui) {
      window.commonui.getAttachBase = function () { return ATTACH_BASE; };
    }
    updateResourceList('');
    setStatus('准备就绪');
  }

  function initEditorTabs() {
    const tabs = [codeModeTab, advancedModeTab];
    function activate(tab) {
      const codeActive = tab === codeModeTab;
      codeModeTab.classList.toggle('is-active', codeActive);
      advancedModeTab.classList.toggle('is-active', !codeActive);
      codeModeTab.setAttribute('aria-selected', String(codeActive));
      advancedModeTab.setAttribute('aria-selected', String(!codeActive));
      codeModePanel.hidden = !codeActive;
      advancedModePanel.hidden = codeActive;
      if (codeActive) requestAnimationFrame(function () { editor?.layout(); editor?.focus(); });
    }
    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { activate(tab); });
      tab.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault(); const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; next.focus(); activate(next);
      });
    });
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
      const globalBar = appShell.querySelector('.global-bar');
      const globalHeight = globalBar ? globalBar.getBoundingClientRect().height : 40;
      const separatorHeight = mainResizer.getBoundingClientRect().height || 5;
      const available = Math.max(440, rect.height - globalHeight - separatorHeight);
      const previewHeight = Math.min(Math.max(event.clientY - rect.top - globalHeight, 220), available - 220);
      const workbenchHeight = Math.max(220, available - previewHeight);
      appShell.style.gridTemplateRows = globalHeight + 'px ' + previewHeight + 'px ' + separatorHeight + 'px ' + workbenchHeight + 'px';
    });

    window.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('resizing-main');
    });
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
    advancedModePanel.addEventListener('click', function (event) {
      const action = event.target.closest('[data-resource-action]');
      if (action && advancedModePanel.contains(action)) {
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

    advancedModePanel.addEventListener('keydown', function (event) {
      if (event.target.closest('[data-edit-kind]') && event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
        event.target.blur();
      }
    });

    advancedModePanel.addEventListener('change', function (event) {
      const control = event.target.closest('[data-edit-kind]');
      if (!control || !advancedModePanel.contains(control)) return;
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
    const controlAnchor=control?control.closest('[data-resource-key]'):null;
    const treeAnchor=controlAnchor&&resourceList.contains(controlAnchor)?controlAnchor:resourceList.querySelector('[data-resource-id="'+cssEscape(selectedResourceId)+'"]');
    const listRect=resourceList.getBoundingClientRect(), anchorRect=treeAnchor?treeAnchor.getBoundingClientRect():null;
    return {scrollTop:resourceList.scrollTop,inspectorScrollTop:resourceInspector.scrollTop,focusKey:control?control.dataset.focusKey||'':'',anchorKey:treeAnchor?treeAnchor.dataset.resourceKey||'':'',anchorOffset:anchorRect?anchorRect.top-listRect.top:null,selectionStart:control&&typeof control.selectionStart==='number'?control.selectionStart:null,selectionEnd:control&&typeof control.selectionEnd==='number'?control.selectionEnd:null};
  }

  function restoreResourceViewState(state) {
    if (!state) return;
    function restore() {
      resourceList.scrollTop = state.scrollTop || 0;
      resourceInspector.scrollTop = state.inspectorScrollTop || 0;
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
    const control = advancedModePanel.querySelector(selector);
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
    resourceSearch.addEventListener('input', function () { resourceQuery = resourceSearch.value.trim().toLocaleLowerCase('zh-Hans-CN'); rebuildResourceTree(); });
    resourceTypeFilter.addEventListener('change', function () { resourceType = resourceTypeFilter.value || 'all'; rebuildResourceTree(); });
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
    const html=renderModelSummary(currentModel,currentResourceBindings)+renderTreeNode(tree,0); measurePerf('model.innerHTML',()=>{resourceList.innerHTML=html},{resources:currentResourceBindings.length});
    const visible=currentResourceBindings.filter(resourceMatches);
    if(!visible.some(item=>item.stableId===selectedResourceId)) selectedResourceId=visible[0]?.stableId||'';
    selectResource(selectedResourceId,{reveal:false});
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
    function projectLeaf(item, parentKey, sourceOrder, ancestors) {
      const kindKey = item.kind === 'StyleBlock' ? 'style' : 'slot:' + item.type;
      const key = (parentKey ? parentKey + '/' : '') + kindKey + ':' + item.logicalId;
      const tokenIds = new Set();
      if (item.source.nameTokenId) tokenIds.add(item.source.nameTokenId);
      if (item.source.pairedNameTokenId) tokenIds.add(item.source.pairedNameTokenId);
      const projectedResources=(resourceByModelId.get(item.logicalId)||[]).map(resource=>({...resource,ancestorNames:ancestors.slice(),slotName:item.name}));
      return {key, name:item.name, children:[], resources:projectedResources, tokenIds, errors:[], sourceOrder, isSystemUncategorized:false, ancestors:ancestors.slice(), isLeaf:true};
    }
    function projectBlock(block, parentKey, sourceOrder, ancestors=[]) {
      const key = block.virtual ? SYSTEM_UNCATEGORIZED_KEY : (parentKey ? parentKey + '/' : '') + 'block:' + block.logicalId;
      const node = {key, name:block.name, children:[], resources:[], tokenIds:new Set(), errors:[], sourceOrder, isSystemUncategorized:block.virtual};
      block.sourceOccurrences.forEach(function(source){if(source.tokenId)node.tokenIds.add(source.tokenId);if(source.pairedTokenId)node.tokenIds.add(source.pairedTokenId)});
      const childAncestors=block.virtual?ancestors:ancestors.concat(block.name);
      block.blocks.forEach(function(child,index){node.children.push(projectBlock(child,key,index,childAncestors))});
      block.slots.forEach(function(slot,index){node.children.push(projectLeaf(slot,key,block.blocks.length+index,childAncestors))});
      block.styleBlocks.forEach(function(style,index){node.children.push(projectLeaf(style,key,block.blocks.length+block.slots.length+index,childAncestors))});
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

  function resourceMatches(item) {
    if (resourceType !== 'all' && item.type !== resourceType) return false;
    if (!resourceQuery) return true;
    return [item.name,item.path,item.sourceKind,item.type].some(value=>String(value||'').toLocaleLowerCase('zh-Hans-CN').includes(resourceQuery));
  }
  function nodeHasMatches(node) { return node.resources.some(resourceMatches) || node.children.some(nodeHasMatches); }

  function renderTreeNode(node, depth) {
    const children = node.children.slice().sort(compareDirectories).filter(nodeHasMatches);
    const childHtml = children.map(function (child) {
      const tokenIds = Array.from(child.tokenIds);
      const systemLabel = child.isSystemUncategorized ? '<span class="dir-system-mark">（系统）</span>' : '';
      const isOpen = directoryOpenState.has(child.key) ? directoryOpenState.get(child.key) : !child.isSystemUncategorized;
      if(child.isLeaf) return renderLeafNode(child,depth);
      return '<details class="catalog-dir' + (child.isSystemUncategorized ? ' catalog-dir-system' : '') + '" data-node-kind="block" data-node-name="' + escapeHtml(child.name) + '" data-token-ids="' + escapeHtml(tokenIds.join(',')) + '" data-directory-key="' + escapeHtml(child.key) + '"' + (isOpen ? ' open' : '') + ' style="--depth:' + depth + '"><summary tabindex="0" role="treeitem"><span class="dir-name-static">' + escapeHtml(child.name) + systemLabel + '</span><span class="dir-count">' + child.resourceCount + '</span></summary>' + renderTreeNode(child, depth + 1) + '</details>'; 
    }).join('');
    const resources = node.resources.filter(resourceMatches);
    if (resourceSortMode !== 'default') resources.sort(compareResources);
    return '<div class="catalog-node">' + childHtml + resources.map(renderResourceItem).join('') + '</div>';
  }

  function renderLeafNode(node, depth) {
    const resources=node.resources.slice(); if(resourceSortMode!=='default')resources.sort(compareResources);
    if(!resources.length)return '';
    return '<div class="catalog-leaf" data-depth="'+depth+'">'+resources.map((item,index)=>renderResourceItem(item,{node,index,count:resources.length})).join('')+'</div>';
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

  function resourceTypeLabel(type) { return type === 'image' ? '\u56fe\u7247' : type === 'url' ? 'URL' : type === 'text' ? '\u6587\u672c' : '\u5c5e\u6027'; }

  function renderResourceItem(item, leaf={}) {
    const typeLabel=resourceTypeLabel(item.type), name=leaf.node?.name||item.name||item.path.split('\\').pop()||'(\u672a\u547d\u540d)', tooltipData=buildResourceTooltipData(item), tokenIds=Array.from(leaf.node?.tokenIds||[]);
    const icon=item.type==='image'?'codicon-file-media':item.type==='text'?'codicon-symbol-string':item.type==='url'?'codicon-link':'codicon-settings-gear';
    const dropAttrs=item.type==='image'?' data-drop-target="image-slot" data-drop-stable-id="'+escapeHtml(item.stableId)+'"':'';
    return '<button type="button" role="treeitem" class="resource-row'+(item.stableId===selectedResourceId?' is-active':'')+'"'+dropAttrs+' data-node-kind="slot" data-node-name="'+escapeHtml(name)+'" data-token-ids="'+escapeHtml(tokenIds.join(','))+'" data-resource-key="'+escapeHtml(resourceAnchorKey(item))+'" data-resource-id="'+escapeHtml(item.stableId)+'" data-tooltip-kind="'+escapeHtml(tooltipData.kind)+'" data-tooltip-path="'+escapeHtml(tooltipData.path)+'" data-tooltip-value="'+escapeHtml(tooltipData.value)+'" data-tooltip-preview="'+escapeHtml(tooltipData.preview||'')+'"><span class="codicon '+icon+'" aria-label="'+typeLabel+'"></span><span class="resource-row-main"><strong>'+escapeHtml(name)+'</strong></span><span class="resource-line">L'+escapeHtml(item.line||'')+'</span></button>';
  }

  function renderResourceInspector(item) {
    if (!item) return '<div class="resource-inspector-empty">\u6ca1\u6709\u7b26\u5408\u7b5b\u9009\u6761\u4ef6\u7684\u8d44\u6e90</div>';
    const typeLabel = resourceTypeLabel(item.type);
    const warnings = item.errors?.length ? '<div class="resource-item-errors">' + item.errors.map(escapeHtml).join('<br>') + '</div>' : '';
    const ancestors=(item.ancestorNames||[]).filter(Boolean), slotName=item.slotName||item.name||typeLabel, blockName=ancestors.at(-1)||'', title=blockName?blockName+' - '+slotName:slotName;
    const breadcrumb=ancestors.concat(slotName);
    const dropAttrs=item.type==='image'?' data-drop-target="image-slot" data-drop-stable-id="'+escapeHtml(item.stableId)+'"':'';
    return '<article class="resource-detail catalog-resource"'+dropAttrs+' data-resource-key="' + escapeHtml(resourceAnchorKey(item)) + '" data-resource-id="' + escapeHtml(item.stableId) + '"><div class="resource-breadcrumb">' + breadcrumb.map(part=>'<span>'+escapeHtml(part)+'</span>').join('<i>/</i>') + '</div><header class="resource-detail-header"><div><span class="resource-type resource-type-' + escapeHtml(item.type) + '">' + typeLabel + '</span><strong title="'+escapeHtml(title)+'">' + escapeHtml(title) + '</strong></div><button type="button" class="resource-locate" data-locate-id="' + escapeHtml(item.stableId) + '">\u5b9a\u4f4d\u4ee3\u7801 ? L' + escapeHtml(item.line || '') + '</button></header><div class="resource-detail-body">' + renderResourceEditor(item) + warnings + '</div></article>';
  }

  function buildResourceTooltipData(item) {
    const value=item.type==='image'?(item.url||''):item.type==='url'?(item.value||''):item.type==='text'?(item.value||''):(item.value||item.path||'');
    return {kind:item.type,path:item.path||'',value:String(value),preview:item.type==='image'?toFullImageUrl(item.url||''):''};
  }

  function readImageDropPayload(event) {
    const transfer=event.dataTransfer; if(!transfer)return null;
    try { const raw=transfer.getData('application/x-nga-image'); if(raw){const payload=JSON.parse(raw);if(payload?.url)return payload;} } catch {}
    const fallback=transfer.getData('text/plain')||transfer.getData('text/uri-list');
    return fallback ? {url:fallback.split('\n')[0].trim()} : null;
  }
  function resolveDropResource(target) {
    const id=target?.dataset.dropStableId; const item=currentResourceBindings.find(resource=>resource.stableId===id); return item?.type==='image'&&item.urlRange?item:null;
  }
  function initImageSlotDrop() {
    let active=null;
    function clear(){advancedModePanel.querySelectorAll('.is-drop-target').forEach(node=>node.classList.remove('is-drop-target'));active=null;}
    function isImageDrag(event){
      if(window.__ngaImageDragActive) return true;
      const types=Array.from(event.dataTransfer?.types||[]);
      return types.includes('application/x-nga-image');
    }
    function targetFromEvent(event){
      const node=event.target?.closest?.('[data-drop-target="image-slot"]');
      return node && advancedModePanel.contains(node) ? node : null;
    }
    advancedModePanel.addEventListener('dragenter',event=>{
      const target=targetFromEvent(event);
      if(!target||!isImageDrag(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect='copy';
      if(active!==target){clear();target.classList.add('is-drop-target');active=target;}
    });
    advancedModePanel.addEventListener('dragover',event=>{
      const target=targetFromEvent(event);
      if(!target||!isImageDrag(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect='copy';
      if(active!==target){clear();target.classList.add('is-drop-target');active=target;}
    });
    advancedModePanel.addEventListener('dragleave',event=>{
      if(active&&(!event.relatedTarget||!active.contains(event.relatedTarget))) clear();
    });
    advancedModePanel.addEventListener('drop',event=>{
      const target=targetFromEvent(event);
      if(!target||!isImageDrag(event)) return;
      const payload=readImageDropPayload(event),item=resolveDropResource(target);
      if(!payload||!item){clear();return;}
      event.preventDefault();
      const url=payload.url.trim();
      if(url===String(item.url||'')){setStatus('\u56fe\u7247\u94fe\u63a5\u672a\u53d8\u5316');clear();return;}
      const viewState=captureResourceViewState(target);
      applyReplacements([{start:item.urlRange.start,end:item.urlRange.end,value:url,expected:item.url||''}],viewState);
      clear();
    });
    addEventListener('dragend',clear); addEventListener('drop',()=>setTimeout(clear,0)); addEventListener('blur',clear);
  }

  function initResourceTooltip() {
    let timer=0, active=null;
    function hide(){clearTimeout(timer);active=null;resourceTooltip.classList.remove('is-visible');resourceTooltip.setAttribute('aria-hidden','true');resourceTooltip.replaceChildren();}
    function show(target){clearTimeout(timer);active=target;timer=setTimeout(()=>{if(active!==target)return;const data=target.dataset;const wrap=document.createElement('div');wrap.className='tooltip-content';const path=document.createElement('div');path.className='tooltip-path';path.textContent=data.tooltipPath||'';wrap.appendChild(path);if(data.tooltipKind==='image'&&data.tooltipPreview){const image=document.createElement('img');image.src=data.tooltipPreview;image.alt='';wrap.appendChild(image);}const value=document.createElement('div');value.className='tooltip-value';value.textContent=data.tooltipValue||'(?)';wrap.appendChild(value);resourceTooltip.replaceChildren(wrap);resourceTooltip.classList.add('is-visible');resourceTooltip.setAttribute('aria-hidden','false');position(target);},350);}
    function position(target){const rect=target.getBoundingClientRect(),tip=resourceTooltip.getBoundingClientRect(),gap=8;let left=rect.right+gap,top=rect.top;if(left+tip.width>innerWidth-8)left=rect.left-tip.width-gap;if(top+tip.height>innerHeight-8)top=innerHeight-tip.height-8;resourceTooltip.style.left=Math.max(8,left)+'px';resourceTooltip.style.top=Math.max(8,top)+'px';}
    resourceList.addEventListener('pointerover',e=>{const row=e.target.closest('.resource-row[data-tooltip-kind]');if(row)show(row);}); resourceList.addEventListener('pointerout',e=>{if(!e.relatedTarget||!e.relatedTarget.closest?.('.resource-row[data-tooltip-kind]'))hide();}); resourceList.addEventListener('focusin',e=>{const row=e.target.closest('.resource-row[data-tooltip-kind]');if(row)show(row);}); resourceList.addEventListener('focusout',hide); addEventListener('resize',()=>{if(active&&resourceTooltip.classList.contains('is-visible'))position(active);});
  }

  function initResourceContextMenu() {
    let target=null, committing=false;
    const renameButton=resourceContextMenu.querySelector('[data-tree-action="rename"]');
    function close(){resourceContextMenu.hidden=true;target=null;}
    function open(node,x,y){target=node;renameButton.disabled=!(node.dataset.tokenIds||'').trim();resourceContextMenu.hidden=false;const rect=resourceContextMenu.getBoundingClientRect();resourceContextMenu.style.left=Math.max(6,Math.min(x,innerWidth-rect.width-6))+'px';resourceContextMenu.style.top=Math.max(6,Math.min(y,innerHeight-rect.height-6))+'px';resourceContextMenu.querySelector('button:not(:disabled)')?.focus();}
    function beginRename(){if(!target)return;const label=target.matches('.resource-row')?target.querySelector('.resource-row-main strong'):target.querySelector(':scope > summary .dir-name-static');if(!label)return;const original=target.dataset.nodeName||label.textContent;const input=document.createElement('input');input.className='tree-inline-rename';input.value=original;label.replaceWith(input);close();requestAnimationFrame(()=>{input.focus();input.select()});let done=false;function finish(commit){if(done)return;done=true;if(commit&&input.value!==original){const ids=(target?.dataset.tokenIds||input.closest('[data-token-ids]')?.dataset.tokenIds||'').split(',').filter(Boolean);const replacements=ids.map(id=>{const token=currentModel?.tokensById[id];return token?{start:token.nameRange.start,end:token.nameRange.end,value:input.value,expected:token.name}:null}).filter(Boolean);if(replacements.length)applyReplacements(replacements,captureResourceViewState(input));else input.replaceWith(label);}else input.replaceWith(label);}input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();finish(true)}else if(e.key==='Escape'){e.preventDefault();finish(false)}});input.addEventListener('blur',()=>finish(true));}
    resourceList.addEventListener('contextmenu',e=>{const node=e.target.closest('[data-node-kind]');if(!node)return;e.preventDefault();open(node,e.clientX,e.clientY)});resourceList.addEventListener('keydown',e=>{if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){const node=e.target.closest('[data-node-kind]');if(node){e.preventDefault();const r=node.getBoundingClientRect();open(node,r.left+20,r.top+20)}}});resourceContextMenu.addEventListener('click',e=>{const action=e.target.closest('[data-tree-action]')?.dataset.treeAction;if(action==='rename')beginRename();else if(action==='locate'&&target){const id=target.dataset.resourceId,item=currentResourceBindings.find(r=>r.stableId===id);if(item)editor.setSelection(item.range.start,item.range.end,true);close();}});document.addEventListener('pointerdown',e=>{if(!resourceContextMenu.hidden&&!resourceContextMenu.contains(e.target))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!resourceContextMenu.hidden)close()});addEventListener('blur',close);
  }

  function selectResource(id, options={}) {
    selectedResourceId=id||'';
    resourceList.querySelectorAll('[data-resource-id]').forEach(row=>row.classList.toggle('is-active',row.dataset.resourceId===selectedResourceId));
    const item=currentResourceBindings.find(resource=>resource.stableId===selectedResourceId);
    resourceInspector.innerHTML=renderResourceInspector(item);
    if(options.reveal){const row=resourceList.querySelector('[data-resource-id="'+cssEscape(selectedResourceId)+'"]');if(row){let dir=row.closest('details');while(dir){dir.open=true;dir=dir.parentElement.closest('details')}row.scrollIntoView({block:'nearest'});}}
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
    if (/^\/mon_\d+\//i.test(value)) return ATTACH_BASE + value;
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

  renderButton.addEventListener('click', function () { renderImmediately(); });
  loginNgaButton.addEventListener('click', openLogin);
  loadPostButton.addEventListener('click', loadPostFromUrl);
  savePostButton.addEventListener('click', saveCurrentPost);
  resourceSort.value = resourceSortMode;
  resourceList.addEventListener('click', function(event){
    if(!currentModel)return;
    const errorButton=event.target.closest('[data-locate-error]'); if(errorButton){const issue=currentModel.diagnostics.find(e=>e.id===errorButton.dataset.locateError);if(issue&&Number.isInteger(issue.from)&&Number.isInteger(issue.to))editor.setSelection(issue.from,issue.to,true);return;}
    const row=event.target.closest('.resource-row[data-resource-id]'); if(row){selectResource(row.dataset.resourceId);return;}
  });
  resourceInspector.addEventListener('click', function(event){
    const locate=event.target.closest('[data-locate-id]');
    if(!locate)return;
    const item=currentResourceBindings.find(r=>r.stableId===locate.dataset.locateId);
    if(item)editor.setSelection(item.range.start,item.range.end,true);
  });

  init().catch(function (error) {
    setStatus('初始化失败：' + error.message, true);
  });
})();
