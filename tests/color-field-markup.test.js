const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const renderer = fs.readFileSync('src/renderer.js', 'utf8');
const css = fs.readFileSync('src/app.css', 'utf8');

function colorFieldTemplate() {
  const match = renderer.match(/function renderColorField\([\s\S]*?\n  \}/);
  assert.ok(match, 'renderColorField should exist');
  return match[0];
}

test('color field does not label-wrap the native color input', () => {
  const template = colorFieldTemplate();
  assert.match(template, /<div class="color-field"><span class="color-field-label">/);
  assert.doesNotMatch(template, /<label class="color-field">/);
  assert.match(template, /<input class="color-swatch" type="color"/);
  assert.match(template, /<input class="color-hex-input"/);
  assert.match(template, /data-edit-kind="color"/);
  assert.match(template, /data-focus-key="range:/);
  assert.match(template, /data-alpha=/);
});

test('color field div keeps the former two-column alignment', () => {
  assert.match(css, /\.color-field \{[^}]*display: grid;[^}]*grid-template-columns: 5\.5em auto;[^}]*gap: 6px;[^}]*align-items: center;/s);
});
