const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAttachmentCatalog, buildMediaView, mergeAttachmentImages, nameImage, normalizeManagedImages, parseAttachment, parseImageReference, removeImage, scanManagedImages, scanPostImages } = require('../src/attachment-domain');

test('jpg and jp_ deletion remnants share one NGA identity', () => {
  const jpg = parseImageReference('./mon_202607/16/example.jpg');
  const jp = parseImageReference('./mon_202607/16/example.jp_');
  assert.equal(jpg.identity, jp.identity);
  assert.equal(jp.fullSizeUrl, './mon_202607/16/example.jpg');
  assert.equal(jp.isDeletionRemnant, true);
});

test('parses NGA references into one canonical full-size identity', () => {
  const forms = [
    './mon_202607/10/example.webp', '/mon_202607/10/example.webp', 'mon_202607/10/example.webp',
    '/attachments/mon_202607/10/example.webp', 'https://img.nga.178.com/attachments/mon_202607/10/example.webp',
    './mon_202607/10/example.webp.,thumb_s.jpg'
  ].map(parseImageReference);
  assert.equal(new Set(forms.map((item) => item.identity)).size, 1);
  assert.ok(forms.every((item) => item.fullSizeUrl === './mon_202607/10/example.webp'));
});

test('parses attachurl and derives variants from thumb bits', () => {
  const item = parseAttachment({ attachurl: '/mon_202607/10/example.webp', type: 'img', thumb: 64|32|16|8, aid: 'aid', name: 'display-name', url_utf8_org_name: 'bg.webp' });
  assert.equal(item.url, './mon_202607/10/example.webp');
  assert.equal(item.id, 'aid');
  assert.equal(item.variants.medium, './mon_202607/10/example.webp.,medium.jpg');
  assert.equal(item.variants.thumbTiny, './mon_202607/10/example.webp.,thumb_ss.jpg');
});

test('attachment catalog deduplicates response forms by identity', () => {
  const catalog = buildAttachmentCatalog([
    { attachurl: '/mon_202607/10/example.webp', type:'img', thumb:16, name:'a' },
    { attachurl: 'mon_202607/10/example.webp', type:'img', thumb:64, name:'a' }
  ]);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].url, './mon_202607/10/example.webp');
  assert.ok(catalog[0].variants.medium && catalog[0].variants.thumbSmall);
});

test('only standalone img tags are managed', () => {
  const text='[url=x][img]./mon_202607/10/a.webp[/img][/url]\n[style background ./mon_202607/10/b.webp]\n[img]./mon_202607/10/c.webp[/img]';
  assert.equal(scanPostImages(text).length,2);
  assert.deepEqual(scanManagedImages(text).map((item)=>item.fullSizeUrl),['./mon_202607/10/c.webp']);
});

test('merges only genuinely missing canonical attachments', () => {
  const catalog=buildAttachmentCatalog([{attachurl:'/mon_202607/10/a.webp',type:'img'},{attachurl:'/mon_202607/10/b.webp',type:'img'}]);
  const result=mergeAttachmentImages('[img]./mon_202607/10/a.webp[/img]',catalog);
  assert.equal(result.missing.length,1);
  assert.equal(result.content,'[img]./mon_202607/10/a.webp[/img]\n[img]./mon_202607/10/b.webp[/img]');
});

test('normalization removes variants and duplicates with last name winning', () => {
  const text='[$name = old][$name = newer][img]./mon_202607/10/a.webp.,thumb.jpg[/img]\n[$name = final][img]https://img.nga.178.com/attachments/mon_202607/10/a.webp[/img]';
  assert.equal(normalizeManagedImages(text).content,'[$name = final][img]./mon_202607/10/a.webp[/img]\n');
});

test('name and delete touch standalone matching image only', () => {
  const text='[url=x][img]./mon_202607/10/a.webp[/img][/url]\n[img]./mon_202607/10/a.webp[/img]';
  assert.equal(nameImage(text,'/mon_202607/10/a.webp','hero').content,'[url=x][img]./mon_202607/10/a.webp[/img][/url]\n[$name = hero][img]./mon_202607/10/a.webp[/img]');
  assert.equal(removeImage('[$deleted][$name = hero][img]./mon_202607/10/a.webp[/img]','mon_202607/10/a.webp').content,'');
});


test('media view hides deleted identities from both body and attachments', () => {
  const images = scanManagedImages('[$deleted][img]./mon_202607/10/deleted.webp[/img]\n[img]./mon_202607/10/visible.webp[/img]\n[img]https://outside.example/a.png[/img]');
  const attachments = buildAttachmentCatalog([
    { attachurl: '/mon_202607/10/deleted.webp', type: 'img', name: 'deleted' },
    { attachurl: '/mon_202607/10/visible.webp', type: 'img', name: 'visible' }
  ]);
  const view = buildMediaView(images, attachments);
  assert.deepEqual(view.images.map((item) => item.fullSizeUrl), ['./mon_202607/10/deleted.webp', './mon_202607/10/visible.webp', 'https://outside.example/a.png']);
  assert.deepEqual(view.attachments.map((item) => item.url), ['./mon_202607/10/deleted.webp', './mon_202607/10/visible.webp']);
});

test('media view keeps one body item when the same identity is also attached', () => {
  const images = scanManagedImages('[img]./mon_202607/10/shared.webp[/img]');
  const attachments = buildAttachmentCatalog([{ attachurl: '/mon_202607/10/shared.webp', type: 'img', name: 'shared' }]);
  const view = buildMediaView(images, attachments);
  assert.equal(view.images.length, 1);
  assert.equal(view.attachments.length, 1);
  assert.equal(view.images[0].identity, view.attachments[0].identity);
});


test('attachment IDs prefer aid or id and accept NGA protocol name fallback', () => {
  const catalog = buildAttachmentCatalog([
    { attachurl: '/mon_202607/10/a.webp', type: 'img', aid: 'server-aid', name: 'display-name' },
    { attachurl: '/mon_202607/10/b.webp', type: 'img', name: 'name-only' }
  ]);
  assert.equal(catalog.find((item) => item.identity === 'nga:mon_202607/10/a.webp').id, 'server-aid');
  assert.equal(catalog.find((item) => item.identity === 'nga:mon_202607/10/b.webp').id, 'name-only');
});



test('deletion remnants are filtered from catalog and merge', () => {
  const catalog = buildAttachmentCatalog([{ attachurl: '/mon_202607/10/gone.jp_', type: 'img', aid: 'gone' }]);
  assert.equal(catalog.length, 0);
  assert.equal(mergeAttachmentImages('', catalog).content, '');
});

test('deleted marker is ignored without becoming image state', () => {
  const images = scanManagedImages('[$deleted][img]./mon_202607/10/a.webp[/img]');
  assert.equal(images.length, 1);
  assert.equal(images[0].name, '');
});

test('any final underscore marks an attachment as a deletion remnant', () => {
  for (const suffix of ['jp_', 'web_', 'png_', '_']) {
    const reference = parseImageReference('./mon_202607/16/example.' + suffix);
    assert.equal(reference.isDeletionRemnant, true);
    assert.equal(buildAttachmentCatalog([{ attachurl: '/mon_202607/16/example.' + suffix, type: 'img' }]).length, 0);
  }
});
