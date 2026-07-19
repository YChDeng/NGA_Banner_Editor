(() => {
  const api = window.bbcodePreview;
  const root = document.getElementById('embeddedImageManager');
  if (!root) return;
  const postUrl = document.getElementById('imagePostUrl');
  const loadButton = document.getElementById('imageLoadPost');
  const dropzone = document.getElementById('imageDropzone');
  const fileInput = document.getElementById('imageFileInput');
  const gallery = document.getElementById('imageGallery');
  const status = document.getElementById('imageStatus');
  let state = { images: [], attachments: [] };
  let cooldownUntil = 0;
  let cooldownTimer = 0;
  let operationBusy = false;

  function setStatus(text, error) { status.textContent = text; status.classList.toggle('error', Boolean(error)); }
  function setGalleryLocked(locked) {
    gallery.classList.toggle('locked', locked);
    gallery.querySelectorAll('input.name, button[data-action]').forEach((control) => { control.disabled = locked; });
  }

  function updateInteractionState() {
    const remainingMs = Math.max(0, cooldownUntil - Date.now());
    const cooling = remainingMs > 0;
    setGalleryLocked(operationBusy || cooling);
    if (operationBusy) return;
    if (cooling) setStatus(`NGA \u4fdd\u5b58\u51b7\u5374\u4e2d\uff0c\u7ea6 ${Math.ceil(remainingMs / 1000)} \u79d2\u540e\u53ef\u7f16\u8f91`);
    else setStatus('\u51b7\u5374\u7ed3\u675f\uff0c\u53ef\u4ee5\u7ee7\u7eed\u7f16\u8f91');
  }

  function applyCooldown(next) {
    cooldownUntil = Math.max(cooldownUntil, Number(next && next.until) || 0);
    clearInterval(cooldownTimer);
    updateInteractionState();
    if (cooldownUntil > Date.now()) {
      cooldownTimer = setInterval(() => {
        updateInteractionState();
        if (cooldownUntil <= Date.now()) clearInterval(cooldownTimer);
      }, 200);
    }
  }

  function applyOperationState(next) {
    operationBusy = Boolean(next && next.busy);
    if (next && next.message) setStatus(next.message, next.phase === 'closing-error');
    updateInteractionState();
  }

  function readFile(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error || new Error('\u65e0\u6cd5\u8bfb\u53d6\u56fe\u7247')); reader.readAsDataURL(file); }); }
  async function prepareImage(file) {
    const originalDataUrl = await readFile(file);
    if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) return { dataUrl: originalDataUrl, mimeType: 'image/gif', fileName: file.name };
    if (!file.type.startsWith('image/')) throw new Error('\u53ea\u652f\u6301\u56fe\u7247\u6587\u4ef6');
    const image = new Image(); image.src = originalDataUrl;
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('\u65e0\u6cd5\u8bfb\u53d6\u56fe\u7247')); });
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d'); if (!context) throw new Error('\u5f53\u524d\u73af\u5883\u4e0d\u652f\u6301\u56fe\u7247\u8f6c\u6362');
    context.drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL('image/webp', 0.92);
    if (!dataUrl.startsWith('data:image/webp')) throw new Error('\u9759\u6001\u56fe\u7247\u8f6c\u6362 WebP \u5931\u8d25');
    return { dataUrl, mimeType: 'image/webp', fileName: file.name.replace(/\.[^.]+$/, '') + '.webp' };
  }
  const ATTACH_BASE = 'https://img.nga.178.com/attachments';
  function toImageUrl(value) {
    const url = String(value == null ? '' : value).trim();
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^file:/i.test(url)) return url;
    if (url.startsWith('./')) return ATTACH_BASE + '/' + url.slice(2);
    if (/^\/?mon_\d+\//i.test(url)) return ATTACH_BASE + '/' + url.replace(/^\/+/, '');
    if (url.startsWith('/attachments/')) return 'https://img.nga.178.com' + url;
    if (url.startsWith('attachments/')) return 'https://img.nga.178.com/' + url;
    return url;
  }

  function imageKey(item) {
    if (item && item.identity) return item.identity;
    const url = String(item && item.url || '').trim().replace(/(?:\.,?(?:org|medium|thumb|thumb_s|thumb_ss)|\.(?:org|medium|thumb|thumb_s|thumb_ss))\.(?:jpe?g)$/i, '');
    const match = url.match(/(?:^|\/)(mon_\d+\/.+)$/i);
    return match ? 'nga:' + match[1].toLowerCase() : 'url:' + url;
  }
  function imageItems() {
    const byIdentity = new Map();
    for (const image of Array.isArray(state.images) ? state.images : []) byIdentity.set(imageKey(image), { ...image });
    const attachmentItems = Array.isArray(state.attachments) ? state.attachments : (state.attachments && Array.isArray(state.attachments.items) ? state.attachments.items : []);
    for (const item of attachmentItems) {
      if (item && item.isDeletionRemnant) continue;
      const key = imageKey(item);
      const existing = byIdentity.get(key);
      if (existing) existing.attachment = item;
      else if (item.url) byIdentity.set(key, { url:item.url, identity:key, name:'', attachment:item });
    }
    return [...byIdentity.values()];
  }
  function render() {
    const items = imageItems();
    if (!items.length) { gallery.innerHTML = '<div class="empty">\u6682\u65e0\u56fe\u7247</div>'; return; }
    gallery.innerHTML = items.map((item, index) => `<article class="card" draggable="true" title="??????????????" aria-label="??????????????????" data-index="${index}"><div class="preview"><img src="${escapeHtml(toImageUrl(item.url))}" alt=""><button class="delete-image" type="button" data-action="delete" title="\u5220\u9664\u56fe\u7247" aria-label="\u5220\u9664\u56fe\u7247"${item.attachment && item.attachment.id || item.url ? '' : ' disabled'}>&times;</button></div><div class="url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</div><input class="name" type="text" placeholder="\u6807\u8bb0\u540d\u79f0" value="${escapeHtml(item.name || '')}"></article>`).join('');
    applyCooldown({ until: cooldownUntil });
  }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  async function refresh() { try { state = await api.mediaState(); render(); } catch (error) { setStatus(error.message, true); } }
  async function loadPost() { try { setStatus('正在导入…'); const result = await api.loadMediaPost(postUrl.value.trim()); state = await api.mediaState(); render(); setStatus(`已导入 tid=${result.context.tid}, pid=${result.context.pid}`); } catch (error) { setStatus(error.message, true); } }
  async function uploadFiles(files) {
    if (!files.length || operationBusy || Date.now() < cooldownUntil) return;
    applyOperationState({ busy:true, phase:'upload', message:'\u6b63\u5728\u4e0a\u4f20\u5e76\u4fdd\u5b58\u2026' });
    try {
      for (const file of files) {
        const prepared = await prepareImage(file);
        await api.uploadMedia({ dataUrl:prepared.dataUrl, mimeType:prepared.mimeType, originalName:prepared.fileName });
      }
      await refresh();
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      if (operationBusy) applyOperationState({ busy:false });
    }
  }

  dropzone.addEventListener('click', () => fileInput.click()); fileInput.addEventListener('change', () => uploadFiles([...fileInput.files]));
  ['dragenter','dragover'].forEach((type) => dropzone.addEventListener(type, (event) => { event.preventDefault(); dropzone.classList.add('dragover'); }));
  ['dragleave','drop'].forEach((type) => dropzone.addEventListener(type, (event) => { event.preventDefault(); dropzone.classList.remove('dragover'); }));
  dropzone.addEventListener('drop', (event) => uploadFiles([...event.dataTransfer.files].filter((file) => file.type.startsWith('image/'))));
  loadButton.addEventListener('click', loadPost);
  gallery.addEventListener('dragstart', (event) => {
    const card=event.target.closest('.card');
    if(!card || event.target.closest('button,input')) return;
    const item=imageItems()[Number(card.dataset.index)];
    if(!item?.url || !event.dataTransfer) return;
    event.dataTransfer.effectAllowed='copy';
    window.__ngaImageDragActive = true;
    const payload=JSON.stringify({url:item.url,previewUrl:toImageUrl(item.url),identity:imageKey(item)});
    event.dataTransfer.setData('application/x-nga-image',payload);
    event.dataTransfer.setData('text/uri-list',toImageUrl(item.url));
    event.dataTransfer.setData('text/plain',item.url);
    card.classList.add('dragging');
  });
  gallery.addEventListener('dragend', (event) => { event.target.closest('.card')?.classList.remove('dragging'); window.__ngaImageDragActive = false; });
  window.addEventListener('blur', () => { window.__ngaImageDragActive = false; });

  gallery.addEventListener('input', (event) => {
    const input = event.target.closest('input.name');
    if (!input || input.disabled || operationBusy || Date.now() < cooldownUntil) return;
    const card = input.closest('.card');
    const item = imageItems()[Number(card.dataset.index)];
    if (!item) return;
    item.name = input.value;
    api.nameMedia({ url:item.url, name:input.value })
      .then((result) => setStatus(result.message || '\u540d\u79f0\u5df2\u6682\u5b58'))
      .catch((error) => setStatus(error.message, true));
  });

  gallery.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action="delete"]');
    if (!button || button.disabled || operationBusy || Date.now() < cooldownUntil) return;
    const card = button.closest('.card');
    const item = imageItems()[Number(card.dataset.index)];
    if (!item) return;
    try {
      if (confirm('\u786e\u8ba4\u5220\u9664\u8be5\u9644\u4ef6\uff08\u5982\u5b58\u5728\uff09\u5e76\u4ece\u6b63\u6587\u79fb\u9664\u56fe\u7247\uff1f')) {
        applyOperationState({ busy:true, phase:'delete', message:'\u6b63\u5728\u5220\u9664\u5e76\u4fdd\u5b58\u2026' });
        await api.deleteMedia({ aid:item.attachment && item.attachment.id, url:item.url });
        await refresh();
      }
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      if (operationBusy) applyOperationState({ busy:false });
    }
  });
  setStatus('\u8bf7\u5148\u5bfc\u5165\u5e16\u5b50');
  api.onSaveCooldown(applyCooldown);
  api.onMediaOperationState(applyOperationState);
  api.saveCooldownState().then(applyCooldown).catch(() => {});
})();
