(function () {
  const win = window;

  win.__NOW = Math.floor(Date.now() / 1000);
  win.__AJAX_DOMAIN = 'bbs.nga.cn';
  win.__IMG_BASE = 'file://' + location.pathname.replace(/\/src\/index\.html$/i, '/img4.nga.178.com');
  win.__IMGPATH = win.__IMG_BASE + '/ngabbs';
  win.__IMG_STYLE = win.__IMG_BASE + '/ngabbs/nga_classic';
  win.__COMMONRES_PATH = win.__IMG_BASE + '/common_res';
  win.__BBSURL = 'https://bbs.nga.cn';
  win.__CURRENT_FID = 0;
  win.__CURRENT_UID = 0;
  win.__CURRENT_F_BIT = 0;
  win.__GP = win.__GP || {};
  win.__SETTING = Object.assign({ bit: 0, width: 1200, fontSize: 12 }, win.__SETTING || {});
  win.__SCRIPTS = win.__SCRIPTS || {
    rand: Date.now(),
    load: function (_key, cb) { if (typeof cb === 'function') cb(); },
    asyncLoad: function (_src, cb) { if (typeof cb === 'function') cb(); },
    syncLoad: function () {}
  };
  win.loader = win.loader || { script: function (_src, cb) { if (typeof cb === 'function') cb(); } };
  win.__TXT = win.__TXT || function (key) { return key; };

  if (!win.commonui) win.commonui = {};
  const commonui = win.commonui;

  commonui.getAttachBase = function () {
    return win.__NGA_REMOTE_ATTACH_BASE || 'https://img.nga.178.com/attachments';
  };



  commonui.hexToRgba = commonui.hexToRgba || function (hex) {
    const v = hex.replace('#', '');
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    const a = v.length >= 8 ? parseInt(v.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  };


  commonui.checkLinkTable = commonui.checkLinkTable || { _: 2 };
  commonui.checkIframeTable = commonui.checkIframeTable || {};
  commonui.checkSigImg = commonui.checkSigImg || function () { return true; };
  commonui.domainSelect = commonui.domainSelect || function () { return 'https://bbs.nga.cn'; };
  commonui.QRCode = commonui.QRCode || { loadDataUrl: function () {} };

  if (!win.__NUKE) {
    win.__NUKE = {
      inheritClone: function (o) {
        if (o == null || typeof o !== 'object') return o;
        function F() {}
        F.prototype = o;
        return new F();
      },
      simpleClone: function (o) {
        if (o == null || typeof o !== 'object') return o;
        return Object.assign(Array.isArray(o) ? [] : {}, o);
      }
    };
  }

  win.__NUKE.inheritClone = win.__NUKE.inheritClone || function (o) {
    if (o == null || typeof o !== 'object') return o;
    function F() {}
    F.prototype = o;
    return new F();
  };


  win.__NUKE.doRequest2 = win.__NUKE.doRequest2 || function () {};
  win.__NUKE.addCss = win.__NUKE.addCss || function (css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  };

  if (!win.ubbcode) win.ubbcode = {};
  win.__NGA_PATCH_UBBCODE_ATTACH = function () {
    if (!win.ubbcode || !win.ubbcode.attach) return;
    const originalCheck = win.ubbcode.attach.check && win.ubbcode.attach.check.bind(win.ubbcode.attach);
    win.ubbcode.attach.cache = win.ubbcode.attach.cache || {};
    win.ubbcode.attach.check = function (id, src) {
      if (originalCheck) return originalCheck(id, src);
      return this.parseName ? this.parseName(src) : { url: src, size: 0, w: 0, h: 0, thumb: 0 };
    };
    win.ubbcode.attach.disp = win.ubbcode.attach.disp || function () {};
  };

  document.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) return;
    const href = target.getAttribute('href') || '';
    if (href.startsWith('javascript:')) return;
    event.preventDefault();
  });
})();
