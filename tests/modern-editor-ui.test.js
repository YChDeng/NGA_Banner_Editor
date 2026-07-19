const fs=require('fs'),assert=require('assert');const html=fs.readFileSync('src/index.html','utf8'),css=fs.readFileSync('src/app.css','utf8'),adapter=fs.readFileSync('src/editor-adapter.js','utf8'),renderer=fs.readFileSync('src/renderer.js','utf8');assert.match(html,/id="resourceSearch"/);assert.match(html,/id="resourceInspector"/);assert.match(css,/grid-template-rows:auto auto minmax\(0,1fr\) auto/);assert.doesNotMatch(css,/\.cm-editor/);assert.match(adapter,/editor\.main\.js/);assert.match(adapter,/ResizeObserver/);assert.match(adapter,/contextmenu:true/);assert.match(renderer,/function resourceMatches/);assert.match(renderer,/function selectResource/);

assert.match(html,/id="resourceTooltip"/);
assert.match(renderer,/ancestorNames/);
assert.match(renderer,/resource-breadcrumb/);
assert.match(renderer,/data-tooltip-kind/);
assert.match(renderer,/function initResourceTooltip/);
assert.doesNotMatch(renderer,/item.type === 'image' ? '??'/);

const renderer2=fs.readFileSync('src/renderer.js','utf8'),html2=fs.readFileSync('src/index.html','utf8'),css2=fs.readFileSync('src/app.css','utf8');assert.match(renderer2,/function renderLeafNode/);assert.match(renderer2,/data-node-kind=\"slot\"/);assert.match(renderer2,/codicon-file-media/);assert.match(renderer2,/initResourceContextMenu/);assert.doesNotMatch(renderer2,/const rename = tokenIds/);assert.match(html2,/id=\"resourceContextMenu\"/);assert.match(css2,/top:calc\(26px \+ var\(--depth,0\)/);

const css3=fs.readFileSync('src/app.css','utf8'),renderer3=fs.readFileSync('src/renderer.js','utf8');assert.match(css3,/resource-fields input\[type="url"\]/);assert.match(css3,/resource-inspector .resource-url-input { width:100%; min-width:0; }/);assert.match(css3,/resource-detail-header strong {[^}]*font-size:11px/);assert.match(renderer3,/blockName=ancestors\.at\(-1\)/);assert.ok(renderer3.includes("title=blockName?blockName+' - '+slotName:slotName"));

const adapter4=fs.readFileSync('src/editor-adapter.js','utf8');assert.match(adapter4,/setTokensProvider/);assert.match(adapter4,/getInitialState/);assert.match(adapter4,/tokenizeLine/);assert.doesNotMatch(adapter4,/decorateSyntax/);assert.match(adapter4,/setModelMarkers/);

const imageManager=fs.readFileSync('src/image-manager.js','utf8'),appCss=fs.readFileSync('src/app.css','utf8');assert.ok(imageManager.includes('draggable="true"'));assert.ok(imageManager.includes('application/x-nga-image'));assert.ok(renderer3.includes('data-drop-target="image-slot"'));assert.ok(renderer3.includes('applyReplacements([{start:item.urlRange.start'));assert.ok(appCss.includes('resource-row[data-drop-target="image-slot"]'));
