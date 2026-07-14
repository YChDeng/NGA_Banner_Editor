const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

let buildBannerModel,deriveResourceBindings;
test.before(async()=>{
 const [model,view]=await Promise.all([
  import(pathToFileURL(path.resolve('src/banner-model.js')).href),
  import(pathToFileURL(path.resolve('src/banner-model-view.js')).href)
 ]);
 buildBannerModel=model.buildBannerModel;
 deriveResourceBindings=view.deriveResourceBindings;
});

function binding(text,sourceKind){return deriveResourceBindings(buildBannerModel(text)).find(item=>item.sourceKind===sourceKind)}
function assertRange(text,range,expected){assert.ok(range&&Number.isInteger(range.start)&&Number.isInteger(range.end));assert.equal(text.slice(range.start,range.end),expected)}
function assertCardBase(item,type,sourceKind){assert.equal(item.type,type);assert.equal(item.sourceKind,sourceKind);assert.equal(typeof item.path,'string');assert.ok(Array.isArray(item.pathParts));assert.ok(Array.isArray(item.errors));assert.ok(item.range);assert.equal(typeof item.stableId,'string');assert.equal(typeof item.contentFingerprint,'string')}

test('dybg binding keeps image parameters and edit ranges',()=>{
 const text='[comment // image][style dybg 1;2;3;4;5;./image.webp]'; const item=binding(text,'dybg');
 assertCardBase(item,'image','dybg'); assert.equal(item.url,'./image.webp'); assert.equal(item.value,'./image.webp'); assertRange(text,item.urlRange,'./image.webp');
 assert.equal(item.params.length,5); ['1','2','3','4','5'].forEach((value,index)=>assertRange(text,item.params[index].field.range,value));
 assert.equal(item.urlRange.start,item.modelSource.resource.urlRange.start);
});

test('img binding keeps resource urlRange without source override',()=>{
 const text='[comment // image][img]image.png[/img]'; const item=binding(text,'img');
 assertCardBase(item,'image','img'); assert.equal(item.url,'image.png'); assertRange(text,item.urlRange,'image.png'); assertRange(text,item.valueRange,'image.png');
 assert.notStrictEqual(item,item.modelSource.resource); assert.strictEqual(item.urlRange,item.modelSource.resource.urlRange);
});

test('url binding keeps link value and editable range',()=>{
 const text='[comment // link][url=https://example.test/a]'; const item=binding(text,'url');
 assertCardBase(item,'url','url'); assert.equal(item.value,'https://example.test/a'); assertRange(text,item.valueRange,'https://example.test/a');
});

test('text binding keeps body and style field ranges',()=>{
 const text='[style color #112233 font 1.5][comment // text!\u6587\u672c]body[/style]'; const item=binding(text,'\u6587\u672c');
 assertCardBase(item,'text','\u6587\u672c'); assert.equal(item.value,'body'); assertRange(text,item.valueRange,'body'); assert.equal(item.textStyles.length,2);
 assertRange(text,item.textStyles[0].range,'#112233'); assertRange(text,item.textStyles[1].range,'1.5');
});

test('StyleBlock binding keeps attr value, fields and ranges',()=>{
 const text='[comment // style!\u5c5e\u6027][style background #112233 width 80]'; const item=binding(text,'\u5c5e\u6027');
 assertCardBase(item,'attr','\u5c5e\u6027'); assert.equal(item.modelKind,'StyleBlock'); assertRange(text,item.valueRange,'style background #112233 width 80');
 assert.equal(item.value,'style background #112233 width 80'); assert.equal(item.fields.length,2); assertRange(text,item.fields[0].range,'#112233');
 assert.equal(item.fields[0].kind,'color'); assertRange(text,item.fields[1].range,'80');
});

test('duplicate conflict derives a complete card from conflict source resource',()=>{
 const text='[comment // A][img]one.png[/img]\n[comment // A][img]two.png[/img]'; const items=deriveResourceBindings(buildBannerModel(text));
 assert.equal(items.length,2); const conflict=items.find(item=>item.isConflict); assertCardBase(conflict,'image','img'); assert.equal(conflict.url,'two.png');
 assertRange(text,conflict.urlRange,'two.png'); assert.match(conflict.stableId,/:conflict:1$/); assert.equal(conflict.modelSource.resource.url,'two.png');
});
