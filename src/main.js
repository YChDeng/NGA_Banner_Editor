const { app, BrowserWindow, ipcMain, Menu, nativeTheme, session } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const BBS_ORIGIN = 'https://bbs.nga.cn';
const NGA_PARTITION = 'persist:nga-bbcode-preview';
let mainWindow = null;
let loginWindow = null;
let currentContext = null;

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
  if (!response.ok) throw new Error('请求失败 ' + response.status + ': ' + text.slice(0, 160));
  return text;
}

async function requestJson(ngaSession, url, form) {
  const requestForm = url.includes('/post.php') ? { __inchst: 'UTF-8', ...form } : form;
  const text = await requestText(ngaSession, url, {
    method: 'POST',
    body: formBody(requestForm),
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

async function getPostContext(parsed) {
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
  return {
    action: data.action || parsed.action,
    fid: Number(data.fid || parsed.fid || 0),
    tid: Number(data.tid || parsed.tid || 0),
    pid: Number(data.pid || parsed.pid || 0),
    subject: decodeNgaEditText(data.subject),
    content: decodeNgaEditText(data.content),
    auth: String(data.auth || ''),
    attachs: asAttachmentArray(data.attachs),
    attachmentsValue: '',
    attachmentsCheckValue: '',
    raw: data
  };
}

async function savePost(content) {
  if (!currentContext) throw new Error('请先导入目标帖子');
  const response = await requestJson(getNgaSession(), BBS_ORIGIN + '/post.php', {
    action: 'modify',
    fid: currentContext.fid,
    tid: currentContext.tid,
    pid: currentContext.pid,
    post_subject: currentContext.subject,
    post_content: content,
    attachments: currentContext.attachmentsValue,
    attachments_check: currentContext.attachmentsCheckValue,
    nojump: 1,
    lite: 'htmljs',
    step: 2
  });
  const message = response.data && response.data.__MESSAGE;
  if (message && !message[0]) {
    currentContext = { ...currentContext, content };
    return { ok: true, message: String(message[1] || '保存成功'), redirectUrl: message[6] ? String(message[6]) : undefined };
  }
  if (response.error) throw new Error(formatNgaValue(response.error));
  throw new Error(formatNgaValue((message && message[1]) || '保存失败'));
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
ipcMain.handle('post:load', async (_event, postUrl) => {
  const parsed = parsePostUrl(postUrl);
  currentContext = await getPostContext(parsed);
  return { context: currentContext };
});
ipcMain.handle('post:save', async (_event, content) => savePost(content));

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
