const { app, BrowserWindow, ipcMain, Menu, nativeTheme, session } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const vm = require('vm');
const { attachmentState, buildAttachmentCatalog, buildMediaView, mergeAttachmentImages, nameImage, parseAttachment, parseImageReference, removeImage, scanManagedImages } = require('./attachment-domain');

const rootDir = path.resolve(__dirname, '..');
const BBS_ORIGIN = 'https://bbs.nga.cn';
const NGA_PARTITION = 'persist:nga-bbcode-preview';
let mainWindow = null;
let loginWindow = null;
let mainPostContext = null;
let imagePostContext = null;
let imagePostDirty = false;
let mainWindowClosing = false;
let allowMainWindowClose = false;
let saveTraceSequence = 0;
let imageMutationQueue = Promise.resolve();
let postSaveCooldownUntil = 0;
const DEFAULT_POST_SAVE_COOLDOWN_MS = 3000;
const IMAGE_OPERATION_TIMEOUT_MS = 60000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#17191c' : '#f5e8cb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.webContents.on('context-menu', (_event, params) => {
    if (!params.isEditable) return;
    Menu.buildFromTemplate([
      { label: '撤销', role: 'undo' },
      { label: '重做', role: 'redo' },
      { type: 'separator' },
      { label: '剪切', role: 'cut' },
      { label: '复制', role: 'copy' },
      { label: '粘贴', role: 'paste' },
      { type: 'separator' },
      { label: '全选', role: 'selectAll' }
    ]).popup({ window: mainWindow });
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('close', (event) => { if (allowMainWindowClose) return; event.preventDefault(); closeMainWindowSafely().catch((error) => { console.error('[nga-main-close]', error); allowMainWindowClose = true; if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close(); }); });
  mainWindow.on('close', (event) => {
    if (allowMainWindowClose) return;
    event.preventDefault();
    closeMainWindowSafely().catch((error) => { console.error('[nga-main-close]', error); allowMainWindowClose = true; if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close(); });
  });
}

function getNgaSession() {
  return session.fromPartition(NGA_PARTITION);
}

async function hasNgaCookie() {
  const cookies = await getNgaSession().cookies.get({ domain: 'bbs.nga.cn' });
  return cookies.some((cookie) => /uid|cid|nga/i.test(cookie.name));
}

async function openLoginWindow() {
  if (loginWindow) {
    loginWindow.focus();
    return false;
  }

  return new Promise((resolve) => {
    loginWindow = new BrowserWindow({
      width: 1100,
      height: 800,
      title: '登录 NGA',
      webPreferences: {
        session: getNgaSession(),
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    loginWindow.loadURL(BBS_ORIGIN + '/');
    loginWindow.on('closed', async () => {
      loginWindow = null;
      resolve(await hasNgaCookie());
    });
  });
}


function toNumber(value) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeUrl(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) throw new Error('请输入帖子地址');
  if (/^https?:\/\//i.test(trimmed)) return new URL(trimmed);
  if (trimmed.startsWith('//')) return new URL('https:' + trimmed);
  if (trimmed.startsWith('/')) return new URL(trimmed, BBS_ORIGIN);
  return new URL(BBS_ORIGIN + '/' + trimmed);
}

function parsePostUrl(input) {
  const url = normalizeUrl(input);
  const pathname = url.pathname.toLowerCase();
  const tid = toNumber(url.searchParams.get('tid'));
  const pid = toNumber(url.searchParams.get('pid')) || 0;
  const fid = toNumber(url.searchParams.get('fid'));
  const stid = toNumber(url.searchParams.get('stid'));
  const actionParam = url.searchParams.get('action');
  let action = 'modify';
  if (['modify', 'reply', 'new', 'quote'].includes(actionParam)) action = actionParam;
  else if (pathname.endsWith('thread.php')) action = 'new';
  else if (pathname.endsWith('read.php')) action = 'modify';
  if (action !== 'modify') throw new Error('当前只支持修改已有帖子链接');
  if (!tid && !pid) throw new Error('目标帖子地址需要包含 tid 或 pid');
  return { originalUrl: url.toString(), action, fid, tid, pid, stid };
}

function formBody(values) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '' || value === 0) continue;
    body.set(key, String(value));
  }
  return body.toString();
}

function formatNgaValue(value) {
  if (value === undefined || value === null) return '未知错误';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(formatNgaValue).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    const preferred = value.message ?? value.msg ?? value.error ?? value[0] ?? value[1];
    if (preferred !== undefined) return formatNgaValue(preferred);
    try { return JSON.stringify(value); } catch { return Object.prototype.toString.call(value); }
  }
  return String(value);
}

function extractBalancedObject(text, marker) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = text.indexOf('{', markerIndex + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return null;
}

function extractAssignmentStatement(text, variableName) {
  const marker = 'var ' + variableName + '=';
  const altMarker = variableName + '=';
  const markerIndex = text.indexOf(marker);
  const startMarker = markerIndex >= 0 ? marker : altMarker;
  const startIndex = markerIndex >= 0 ? markerIndex : text.indexOf(altMarker);
  if (startIndex < 0) return null;
  const objectExpression = extractBalancedObject(text, startMarker);
  if (!objectExpression) return null;
  return 'var ' + variableName + '=' + objectExpression + ';';
}

function evaluateScriptAssignment(script, variableName) {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { timeout: 1000 });
  return sandbox[variableName];
}

function parseNgaPayload(text) {
  const trimmed = String(text || '').trim().replace(/^﻿/, '');
  if (!trimmed) throw new Error('NGA 返回空响应');
  try { return JSON.parse(trimmed); } catch {}
  const storeStatement = extractAssignmentStatement(trimmed, 'script_muti_get_var_store');
  if (storeStatement) return evaluateScriptAssignment(storeStatement, 'script_muti_get_var_store');
  const pageStatement = extractAssignmentStatement(trimmed, '__U');
  if (pageStatement) return { data: evaluateScriptAssignment(pageStatement, '__U') };
  if (/^</.test(trimmed)) throw new Error('NGA 返回了 HTML 页面，响应片段：' + trimmed.slice(0, 180));
  throw new Error('无法解析 NGA 响应。响应片段：' + trimmed.slice(0, 180));
}

function responseCharset(response) {
  const contentType = response.headers.get('content-type') || '';
  const match = contentType.match(/charset=([^;]+)/i);
  return match && match[1] ? match[1].trim().replace(/^['"]|['"]$/g, '') : 'utf-8';
}

function decodeResponse(buffer, charset) {
  try { return new TextDecoder(charset).decode(buffer); } catch { return new TextDecoder('utf-8').decode(buffer); }
}

async function requestText(ngaSession, url, init = {}) {
  const response = await ngaSession.fetch(url, {
    method: init.method || 'GET',
    body: init.body,
    headers: init.headers
  });
  const buffer = await response.arrayBuffer();
  const text = decodeResponse(buffer, responseCharset(response));
  if (!response.ok && !init.allowHttpError) {
    throw new Error('HTTP request failed ' + response.status + ': ' + text.slice(0, 160));
  }
  return text;
}

async function requestJson(ngaSession, url, form) {
  const requestForm = url.includes('/post.php') ? { __inchst: 'UTF-8', ...form } : form;
  const text = await requestText(ngaSession, url, {
    method: 'POST',
    body: formBody(requestForm),
    allowHttpError: true,
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      origin: BBS_ORIGIN,
      referer: BBS_ORIGIN + '/'
    }
  });
  return parseNgaPayload(text);
}

function decodeNgaEditText(value) {
  return String(value == null ? '' : value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#92;/g, '\\')
    .replace(/&#36;/g, '$')
    .replace(/&amp;/g, '&');
}
function asAttachmentArray(attachs) {
  if (!attachs || typeof attachs !== 'object') return [];
  if (Array.isArray(attachs)) return attachs;
  return Object.values(attachs);
}

async function getPostContext(parsed, options = {}) {
  const response = await requestJson(getNgaSession(), BBS_ORIGIN + '/post.php', {
    __output: 1,
    action: parsed.action,
    fid: parsed.fid,
    tid: parsed.tid,
    pid: parsed.pid,
    stid: parsed.stid
  });
  if (response.error) throw new Error(formatNgaValue(response.error));
  if (!response.data) throw new Error('NGA 未返回帖子数据');
  const data = response.data;
  if (data.__MESSAGE) throw new Error(String(data.__MESSAGE[1] ?? data.__MESSAGE[0] ?? '无法打开帖子编辑页'));
  const originalContent = decodeNgaEditText(data.content);
  const context = {
    action: data.action || parsed.action,
    fid: Number(data.fid || (data.__T && data.__T.fid) || (data.__F && data.__F.fid) || parsed.fid || 0),
    tid: Number(data.tid || parsed.tid || 0),
    pid: Number(data.pid || parsed.pid || 0),
    subject: decodeNgaEditText(data.subject),
    content: originalContent,
    auth: String(data.auth || ''),
    attachs: asAttachmentArray(data.attachs),
    attachmentsValue: String(data.attachments || data.attach || ''),
    attachmentsCheckValue: String(data.attachments_check || data.attachmentsCheck || ''),
    uploadUrl: String(data.attach_url || data.attach_url_sec || 'https://img.nga.178.com/attach.php'),
    raw: data,
    manageImages: Boolean(options.manageImages)
  };
  const catalog = buildAttachmentCatalog(context.attachs);
  let contentChanged = false;
  if (options.manageImages) {
    const merged = mergeAttachmentImages(context.content, catalog);
    context.content = merged.content;
    contentChanged = context.content !== originalContent;
  }
  context.attachments = attachmentState(context.attachs, context.attachmentsValue, context.attachmentsCheckValue);
  context.sourceContent = originalContent;
  context.contentChanged = contentChanged;
  return context;
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function responseError(response) {
  const message = response && response.data && response.data.__MESSAGE;
  if (response && response.error) return formatNgaValue(response.error);
  if (message && message[0]) return String(message[0]) + ':' + String(message[1] || '\u4fdd\u5b58\u6210\u529f');
  return '';
}

function retryDelay(errorText) {
  if (!/^39:/.test(errorText)) return 0;
  const match = String(errorText).match(/(\d+)\s*\u79d2/);
  const seconds = match ? Number.parseInt(match[1], 10) : 1;
  return (Number.isFinite(seconds) && seconds >= 0 ? seconds + 1 : 2) * 1000;
}

function saveLog(trace, event, details = {}) {
  console.info('[nga-save]', JSON.stringify({ trace, event, ...details }));
}

function cooldownState(reason = '') {
  return { until: postSaveCooldownUntil, remainingMs: Math.max(0, postSaveCooldownUntil - Date.now()), reason };
}

function broadcastSaveCooldown(reason) {
  const state = cooldownState(reason);
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('post-save:cooldown', state);
  return state;
}

function startSaveCooldown(durationMs, reason) {
  const safeDuration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : DEFAULT_POST_SAVE_COOLDOWN_MS;
  postSaveCooldownUntil = Math.max(postSaveCooldownUntil, Date.now() + safeDuration);
  return broadcastSaveCooldown(reason);
}

async function waitForSaveCooldown(trace) {
  const remainingMs = Math.max(0, postSaveCooldownUntil - Date.now());
  if (!remainingMs) return;
  saveLog(trace, 'cooldown-wait', { waitMs: remainingMs });
  broadcastSaveCooldown('waiting');
  await sleep(remainingMs);
  broadcastSaveCooldown('ready');
}

async function refreshPostContext(context, trace, reason) {
  const oldFid = Number(context.fid) || 0;
  saveLog(trace, 'context-refresh-start', { reason, tid: context.tid, pid: context.pid, oldFid });
  const refreshed = await getPostContext(
    { action: 'modify', fid: oldFid || undefined, tid: context.tid, pid: context.pid },
    { manageImages: Boolean(context.manageImages) }
  );
  saveLog(trace, 'context-refresh-complete', { reason, tid: refreshed.tid, pid: refreshed.pid, oldFid, newFid: refreshed.fid });
  return refreshed;
}

async function saveContext(context, content, recovery) {
  if (!context) throw new Error('\u65e0\u6548\u7684\u4e0a\u4f20\u6570\u636e');
  const state = recovery || { trace: ++saveTraceSequence, attempts: 0, rateLimitRetries: 0, rateLimitRefreshes: 0, invalidFidRefreshes: 0, strategy: 'initial' };
  let working = context;
  await waitForSaveCooldown(state.trace);
  if (!working.fid) {
    if (state.invalidFidRefreshes >= 1) throw new Error('\u65e0\u6cd5\u83b7\u53d6\u6709\u6548\u7248\u9762 ID');
    state.invalidFidRefreshes += 1;
    working = await refreshPostContext(working, state.trace, 'preflight-invalid-fid');
    state.strategy = 'preflight-context-refresh';
  }
  state.attempts += 1;
  saveLog(state.trace, 'attempt', { attempt: state.attempts, strategy: state.strategy, tid: working.tid, pid: working.pid, fid: working.fid });
  const response = await requestJson(getNgaSession(), BBS_ORIGIN + '/post.php', {
    action: 'modify', fid: working.fid, tid: working.tid, pid: working.pid,
    post_subject: working.subject, post_content: content,
    attachments: working.attachmentsValue, attachments_check: working.attachmentsCheckValue,
    nojump: 1, lite: 'htmljs', step: 2
  });
  const message = response.data && response.data.__MESSAGE;
  if (message && !message[0]) {
    startSaveCooldown(DEFAULT_POST_SAVE_COOLDOWN_MS, 'save-success');
    saveLog(state.trace, 'success', { attempt: state.attempts, strategy: state.strategy, cooldownMs: DEFAULT_POST_SAVE_COOLDOWN_MS, tid: working.tid, pid: working.pid, fid: working.fid });
    return { context: { ...working, content }, result: { ok: true, message: String(message[1] || '\u4fdd\u5b58\u6210\u529f'), redirectUrl: message[6] ? String(message[6]) : undefined } };
  }
  const errorText = responseError(response) || '\u4fdd\u5b58\u5931\u8d25';
  const codeMatch = errorText.match(/^(\d+):/);
  const code = codeMatch ? Number(codeMatch[1]) : 0;
  saveLog(state.trace, 'business-error', { attempt: state.attempts, strategy: state.strategy, code, tid: working.tid, pid: working.pid, fid: working.fid });
  if (code === 39 && state.rateLimitRetries < 1) {
    state.rateLimitRetries += 1;
    const waitMs = retryDelay(errorText);
    startSaveCooldown(waitMs, 'rate-limit');
    saveLog(state.trace, 'rate-limit-freeze', { waitMs, retry: state.rateLimitRetries });
    await waitForSaveCooldown(state.trace);
    if (state.rateLimitRefreshes < 1) {
      state.rateLimitRefreshes += 1;
      working = await refreshPostContext(working, state.trace, 'rate-limit-after-cooldown');
    }
    state.strategy = 'refreshed-context-after-rate-limit';
    return saveContext(working, content, state);
  }
  if (code === 56 && state.invalidFidRefreshes < 1) {
    state.invalidFidRefreshes += 1;
    const refreshed = await refreshPostContext(working, state.trace, 'invalid-fid');
    state.strategy = 'refreshed-context-after-invalid-fid';
    return saveContext(refreshed, content, state);
  }
  saveLog(state.trace, 'failed', { attempt: state.attempts, code, rateLimitRetries: state.rateLimitRetries, rateLimitRefreshes: state.rateLimitRefreshes, invalidFidRefreshes: state.invalidFidRefreshes });
  throw new Error(errorText);
}

async function savePost(content) {
  const saved = await saveContext(mainPostContext, content);
  mainPostContext = saved.context;
  return saved.result;
}

function samePost(left, right) {
  return Boolean(left && right && Number(left.tid) === Number(right.tid) && Number(left.pid) === Number(right.pid));
}

function syncMainIfSamePost() {
  if (!samePost(mainPostContext, imagePostContext)) return;
  mainPostContext = { ...mainPostContext, content: imagePostContext.content, attachs: imagePostContext.attachs, attachments: imagePostContext.attachments, attachmentsValue: imagePostContext.attachmentsValue, attachmentsCheckValue: imagePostContext.attachmentsCheckValue };
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('media:content', mainPostContext.content);
}

function mediaState() {
  if (!imagePostContext) throw new Error('\u8bf7\u5148\u5bfc\u5165\u56fe\u7247\u5e16\u5b50');
  const images = scanManagedImages(imagePostContext.content);
  const attachments = imagePostContext.attachments || attachmentState(imagePostContext.attachs, imagePostContext.attachmentsValue, imagePostContext.attachmentsCheckValue);
  const view = buildMediaView(images, attachments.items);
  return { images: view.images, attachments: { ...attachments, items: view.attachments }, content: imagePostContext.content };
}

function attachmentIdOf(item) {
  return String(item && (item.aid || item.id || item.name) || '');
}

function findAttachmentByIdentity(attachments, identity) {
  return (Array.isArray(attachments) ? attachments : []).find((item) => item.identity === identity && attachmentIdOf(item));
}

async function confirmUploadedAttachment(identity, trace, timeoutMs = IMAGE_OPERATION_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt += 1;
    await waitForSaveCooldown(trace);
    const reconciled = await reconcileImageContext('after-upload');
    const matched = findAttachmentByIdentity(reconciled.attachments.items, identity);
    saveLog(trace, 'upload-reconcile-attempt', { attempt, identity, matched: Boolean(matched), aid: matched ? matched.id : '' });
    if (matched) return matched;
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;
    await sleep(Math.min(3000, remainingMs));
  }
  throw new Error('??????? 1 ?????????????????');
}

async function uploadAttachment(payload) {
  if (!imagePostContext) throw new Error('\u8bf7\u5148\u5bfc\u5165\u56fe\u7247\u5e16\u5b50');
  const dataUrl = String(payload && payload.dataUrl || '');
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('\u65e0\u6548\u7684\u4e0a\u4f20\u6570\u636e');
  const buffer = Buffer.from(dataUrl.slice(comma + 1), 'base64');
  const form = new FormData();
  const originalName = String(payload.originalName || payload.name || 'upload');
  form.append('func', 'upload'); form.append('v2', '1'); form.append('origin_domain', 'bbs.nga.cn'); form.append('__output', '1'); form.append('auth', imagePostContext.auth); form.append('fid', String(imagePostContext.fid));
  form.append('attachment_file1', new Blob([buffer], { type: payload.mimeType || 'application/octet-stream' }), originalName);
  form.append('attachment_file1_url_utf8_name', encodeURIComponent(originalName));
  const isGif = String(payload.mimeType || '').toLowerCase() === 'image/gif';
  form.append('attachment_file1_watermark', '');
  if (!isGif) form.append('attachment_file1_auto_size', '8');
  console.info('[nga-upload]', JSON.stringify({ mimeType: payload.mimeType || '', originalName, autoSize: isGif ? null : 8, watermark: '' }));
  const text = await requestText(getNgaSession(), imagePostContext.uploadUrl, { method: 'POST', body: form, headers: { origin: BBS_ORIGIN, referer: BBS_ORIGIN + '/' } });
  const response = parseNgaPayload(text);
  if (response.error || response.error_code) throw new Error(formatNgaValue(response.error || response.error_code));
  const data = response.data || {};
  if (!data.url) throw new Error('\u4e0a\u4f20\u6210\u529f\u4f46 NGA \u672a\u8fd4\u56de\u56fe\u7247\u5730\u5740');
  const attachment = { aid: String(data.aid || ''), attachurl: data.url, thumb: data.thumb, type: data.isImg ? 'img' : '', url_utf8_org_name: originalName, filename: originalName, name: String(data.name || ''), idSource: data.aid ? 'aid' : (data.name ? 'name' : '') };
  imagePostContext = { ...imagePostContext, attachs: [...imagePostContext.attachs, attachment], attachmentsValue: String(data.attachments || imagePostContext.attachmentsValue), attachmentsCheckValue: String(data.attachments_check || imagePostContext.attachmentsCheckValue) };
  imagePostContext.content = mergeAttachmentImages(imagePostContext.content, [attachment]).content;
  imagePostContext.attachments = attachmentState(imagePostContext.attachs, imagePostContext.attachmentsValue, imagePostContext.attachmentsCheckValue);
  imagePostDirty = true;
  const saved = await saveContext(imagePostContext, imagePostContext.content);
  imagePostContext = saved.context;
  imagePostDirty = false;
  const uploadedIdentity = parseImageReference(data.url).identity;
  saveLog(++saveTraceSequence, 'upload-saved-await-reconcile', { identity: uploadedIdentity, temporaryAid: attachment.aid || '' });
  const serverAttachment = await confirmUploadedAttachment(uploadedIdentity, saveTraceSequence);
  saveLog(saveTraceSequence, 'upload-reconciled', { identity: uploadedIdentity, aid: serverAttachment.id });
  syncMainIfSamePost();
  return { url: parseImageReference(data.url).fullSizeUrl, thumb: String(data.thumb || ''), attachment: serverAttachment, attachments: imagePostContext.attachments, message: saved.result.message };
}

async function deleteAttachment(payload) {
  if (!imagePostContext) throw new Error('\u8bf7\u5148\u5bfc\u5165\u56fe\u7247\u5e16\u5b50');
  if (!payload || !payload.aid) throw new Error('\u7f3a\u5c11\u9644\u4ef6 ID');
  const response = await requestJson(getNgaSession(), BBS_ORIGIN + '/nuke.php', { __lib: 'del_attach', __act: 'del_attach', pid: imagePostContext.pid, tid: imagePostContext.tid, aid: payload.aid, raw: 3 });
  if (response.error) throw new Error(formatNgaValue(response.error));
  imagePostContext = { ...imagePostContext, attachs: imagePostContext.attachs.filter((item) => attachmentIdOf(item) !== String(payload.aid)) };
  imagePostContext.attachments = attachmentState(imagePostContext.attachs, imagePostContext.attachmentsValue, imagePostContext.attachmentsCheckValue);
  return mediaState();
}

function broadcastImageOperation(state) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('media:operation-state', state);
}

function withTimeout(operation, timeoutMs = IMAGE_OPERATION_TIMEOUT_MS) {
  let timer;
  return Promise.race([
    Promise.resolve().then(operation),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('NGA \u64cd\u4f5c\u8d85\u8fc7 1 \u5206\u949f\u672a\u54cd\u5e94')), timeoutMs); })
  ]).finally(() => clearTimeout(timer));
}

async function runImmediateImageMutation(label, operation) {
  return enqueueImageMutation(label, async () => {
    broadcastImageOperation({ busy: true, phase: label, message: '\u6b63\u5728\u4fdd\u5b58\uff0c\u8bf7\u52ff\u5173\u95ed\u7a97\u53e3' });
    try {
      await flushPendingImagePost('before-' + label);
      return await withTimeout(operation);
    } finally {
      startSaveCooldown(DEFAULT_POST_SAVE_COOLDOWN_MS, 'operation-complete');
      await waitForSaveCooldown(++saveTraceSequence);
      broadcastImageOperation({ busy: false, phase: 'idle', message: '\u4fdd\u5b58\u6d41\u7a0b\u5df2\u7ed3\u675f\uff0c\u53ef\u4ee5\u7ee7\u7eed\u64cd\u4f5c' });
    }
  });
}

async function flushPendingImagePost(reason) {
  if (!imagePostDirty) return { saved: false };
  const saved = await saveContext(imagePostContext, imagePostContext.content);
  imagePostContext = saved.context;
  imagePostDirty = false;
  syncMainIfSamePost();
  console.info('[nga-lazy-save]', JSON.stringify({ event: 'flushed', reason, tid: imagePostContext.tid, pid: imagePostContext.pid }));
  return { saved: true, message: saved.result.message };
}

async function closeMainWindowSafely() {
  if (mainWindowClosing || !mainWindow || mainWindow.isDestroyed()) return;
  mainWindowClosing = true;
  broadcastImageOperation({ busy: true, phase: 'closing', message: imagePostDirty ? 'Closing: saving pending name changes' : 'Closing: waiting for the current operation' });
  let failed = false;
  try {
    await enqueueImageMutation('close-flush', () => withTimeout(() => flushPendingImagePost('window-close')));
  } catch (error) {
    failed = true;
    console.error('[nga-image-close]', error);
    broadcastImageOperation({ busy: true, phase: 'closing-error', message: 'Save before closing failed: ' + error.message });
  }
  if (failed && postSaveCooldownUntil <= Date.now()) startSaveCooldown(DEFAULT_POST_SAVE_COOLDOWN_MS, 'window-close-failed');
  await waitForSaveCooldown(++saveTraceSequence);
  allowMainWindowClose = true;
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
}

function enqueueImageMutation(label, operation) {
  const queuedAt = Date.now();
  const run = imageMutationQueue.catch(() => undefined).then(async () => {
    console.info('[nga-save-queue]', JSON.stringify({ event: 'start', label, waitedMs: Date.now() - queuedAt }));
    try { return await operation(); }
    finally { console.info('[nga-save-queue]', JSON.stringify({ event: 'complete', label })); }
  });
  imageMutationQueue = run.catch(() => undefined);
  return run;
}

async function saveMediaName(payload) {
  if (!imagePostContext) throw new Error('\u8bf7\u5148\u5bfc\u5165\u56fe\u7247\u5e16\u5b50');
  const changed = nameImage(imagePostContext.content, payload.url, payload.name);
  if (!changed.changed) return { ...changed, content: imagePostContext.content, pending: imagePostDirty, message: '\u540d\u79f0\u6ca1\u6709\u53d8\u5316' };
  imagePostContext = { ...imagePostContext, content: changed.content };
  imagePostDirty = true;
  console.info('[nga-lazy-save]', JSON.stringify({ event: 'staged-name', tid: imagePostContext.tid, pid: imagePostContext.pid }));
  return { ...changed, content: imagePostContext.content, pending: true, message: '\u540d\u79f0\u5df2\u6682\u5b58\uff0c\u5c06\u5728\u4e0a\u4f20\u56fe\u7247\u6216\u5173\u95ed\u7a97\u53e3\u65f6\u4fdd\u5b58' };
}

async function deleteMediaTransaction(payload) {
  if (!imagePostContext) throw new Error('????????');
  const target = parseImageReference(payload && payload.url).identity;
  const currentAttachment = findAttachmentByIdentity(imagePostContext.attachments && imagePostContext.attachments.items, target);
  const aid = currentAttachment && currentAttachment.id;
  if (aid) await deleteAttachment({ ...payload, aid });
  const removed = removeImage(imagePostContext.content, payload && payload.url);
  if (!removed.changed) return mediaState();
  imagePostContext = { ...imagePostContext, content: removed.content };
  imagePostDirty = true;
  const saved = await saveContext(imagePostContext, imagePostContext.content);
  imagePostContext = saved.context;
  imagePostDirty = false;
  syncMainIfSamePost();
  return { ...mediaState(), message: saved.result.message };
}

async function reconcileImageContext(reason, options = {}) {
  if (!imagePostContext) throw new Error('\u8bf7\u5148\u5bfc\u5165\u56fe\u7247\u5e16\u5b50');
  const previousContent = imagePostContext.content;
  const previousDirty = imagePostDirty;
  const refreshed = await getPostContext(
    { action: 'modify', fid: imagePostContext.fid, tid: imagePostContext.tid, pid: imagePostContext.pid },
    { manageImages: false }
  );
  const merged = mergeAttachmentImages(previousDirty ? previousContent : refreshed.content, refreshed.attachments.items);
  imagePostContext = { ...refreshed, manageImages: true, content: merged.content };
  imagePostDirty = previousDirty || merged.content !== previousContent;
  syncMainIfSamePost();
  console.info('[nga-reconcile]', JSON.stringify({ reason, dirty: imagePostDirty }));
  if (options.flushDirty) await flushPendingImagePost(reason);
  return mediaState();
}

ipcMain.handle('sample:read', async () => {
  return fs.readFile(path.join(rootDir, 'tmp', 'bbcode.txt'), 'utf8');
});

ipcMain.handle('app:paths', async () => {
  return {
    rootDir,
    attachmentBase: path.join(rootDir, 'img.nga.178.com', 'attachments').replace(/\\/g, '/'),
    samplePath: path.join(rootDir, 'tmp', 'bbcode.txt').replace(/\\/g, '/')
  };
});

ipcMain.handle('auth:open-login', async () => openLoginWindow());
ipcMain.handle('auth:status', async () => ({ loggedIn: await hasNgaCookie() }));
ipcMain.handle('post-save:cooldown-state', async () => cooldownState());
ipcMain.handle('image:open', async () => openImageWindow());
ipcMain.handle('post:load', async (_event, postUrl) => {
  mainPostContext = await getPostContext(parsePostUrl(postUrl));
  return { context: mainPostContext };
});
ipcMain.handle('post:save', async (_event, content) => savePost(content));
ipcMain.handle('media:load-post', async (_event, postUrl) => {
  imagePostContext = await getPostContext(parsePostUrl(postUrl), { manageImages: true });
  imagePostDirty = Boolean(imagePostContext.contentChanged);
  console.info('[nga-reconcile]', JSON.stringify({ reason: 'initial-load', contentChanged: imagePostContext.contentChanged, dirty: imagePostDirty }));
  return { context: imagePostContext };
});
ipcMain.handle('media:state', async () => mediaState());
ipcMain.handle('media:upload', async (_event, payload) => runImmediateImageMutation('upload', () => uploadAttachment(payload)));
ipcMain.handle('media:delete', async (_event, payload) => runImmediateImageMutation('delete-image', () => deleteMediaTransaction(payload)));
ipcMain.handle('media:name', async (_event, payload) => enqueueImageMutation('stage-name', () => saveMediaName(payload)));
ipcMain.handle('media:refresh', async () => reconcileImageContext('manual-refresh'));

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
