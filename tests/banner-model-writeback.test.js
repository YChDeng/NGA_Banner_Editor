const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

let model,guards,createTextHistory;
test.before(async()=>{
 [model,guards,{createTextHistory}]=await Promise.all([
  import(pathToFileURL(path.resolve('src/banner-model.js')).href),
  import(pathToFileURL(path.resolve('src/catalog-guards.js')).href),
  import(pathToFileURL(path.resolve('src/editor-transaction.js')).href)
 ]);
});

function harness(text){
 const history=createTextHistory(text);
 return {history,get text(){return history.text},dispatch(replacements,generation){
  const checked=guards.validateReplacements(history.text,generation,replacements);
  assert.equal(checked.ok,true,checked.reason);
  history.execute(checked.replacements);
  return checked;
 }};
}
function renameReplacement(token,value){return {start:token.nameRange.start,end:token.nameRange.end,value,expected:token.name}}
function blockAt(m,pathParts){return m.blocks.find(block=>JSON.stringify(block.logicalPath)===JSON.stringify(pathParts))}

test('Block 多来源名称真实批量写回并单步 undo',()=>{
 const original='[comment // $++组][comment // $A][img]one[/img][comment // $--组]\n[comment // $++组][comment // $B][url=two][comment // $--组]';
 const initial=model.buildBannerModel(original); const block=blockAt(initial,['组']);
 assert.equal(block.sourceOccurrences.length,2);
 const tokenIds=new Set();
 block.sourceOccurrences.forEach(source=>{tokenIds.add(source.tokenId);tokenIds.add(source.pairedTokenId)});
 const replacements=Array.from(tokenIds,id=>renameReplacement(initial.tokensById[id],'新组'));
 const editor=harness(original); const checked=editor.dispatch(replacements,initial.generation);
 assert.ok(checked.replacements.every((item,index,list)=>index===0||list[index-1].start>=item.start),'guard 保持降序 changes');
 const renamed=model.buildBannerModel(editor.text); const renamedBlock=blockAt(renamed,['新组']);
 assert.equal(renamedBlock.sourceOccurrences.length,2);
 assert.equal(renamed.blocks.some(item=>item.name==='组'),false);
 assert.ok(editor.text.includes('$++'+renamedBlock.name)); assert.equal(editor.text.includes('++'+renamedBlock.name) && !editor.text.includes('$++'+renamedBlock.name),false);
 assert.equal(editor.history.undo(),true); assert.equal(editor.text,original);
 const restored=model.buildBannerModel(editor.text); assert.equal(blockAt(restored,['组']).sourceOccurrences.length,2);
});

test('suffix Slot open/close token 原子重命名并保持路径',()=>{
 const original='[comment // $++甲][comment // $乙++][comment // $图][img]x[/img][comment // $乙--][comment // $--甲]';
 const initial=model.buildBannerModel(original); const slot=initial.slots[0];
 const ids=[slot.source.nameTokenId,slot.source.pairedNameTokenId];
 const replacements=ids.map(id=>renameReplacement(initial.tokensById[id],'新乙'));
 const editor=harness(original); editor.dispatch(replacements,initial.generation);
 const renamed=model.buildBannerModel(editor.text);
 assert.deepEqual(renamed.blocks.map(item=>item.logicalPath),[['甲'],['甲','图']]);
 assert.deepEqual(renamed.slots[0].logicalPath,['甲','图','新乙']);
 assert.equal(renamed.slots[0].source.nameToken.name,'新乙');
 assert.equal(renamed.slots[0].source.pairedNameToken.name,'新乙');
 assert.equal(editor.history.undo(),true); assert.equal(editor.text,original);
});

test('图片 Slot clear/default 使用真实 valueRange 并支持 undo redo',()=>{
 const defaultUrl='./default.webp';
 const original='[comment // $#图!图片 = '+defaultUrl+']\n[comment // $图][img]manual.webp[/img]';
 const initial=model.buildBannerModel(original); const slot=initial.slots[0]; const range=slot.source.valueRange;
 assert.equal(model.sliceModelRange(initial,range),'manual.webp'); assert.equal(slot.valueState,'manual');
 const editor=harness(original);
 editor.dispatch([{start:range.start,end:range.end,value:'',expected:'manual.webp'}],initial.generation);
 const cleared=model.buildBannerModel(editor.text); assert.equal(cleared.slots[0].source.value,''); assert.equal(cleared.slots[0].valueState,'disabled');
 assert.equal(editor.history.undo(),true); assert.equal(editor.text,original);
 const restored=model.buildBannerModel(editor.text); assert.equal(restored.slots[0].valueState,'manual');
 const restoredRange=restored.slots[0].source.valueRange;
 editor.dispatch([{start:restoredRange.start,end:restoredRange.end,value:defaultUrl,expected:'manual.webp'}],restored.generation);
 const defaulted=model.buildBannerModel(editor.text); assert.equal(defaulted.slots[0].source.value,defaultUrl); assert.equal(defaulted.slots[0].valueState,'default');
 assert.equal(editor.history.undo(),true); assert.equal(editor.text,original);
 assert.equal(editor.history.redo(),true); assert.equal(model.buildBannerModel(editor.text).slots[0].valueState,'default');
});
