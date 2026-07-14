const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

let model;
test.before(async()=>{model=await import(pathToFileURL(path.resolve('src/banner-model.js')).href)});
const parse=text=>model.buildBannerModel(text);
const blockAt=(m,logicalPath)=>m.blocks.find(block=>JSON.stringify(block.logicalPath)===JSON.stringify(logicalPath));
const slotSummary=block=>block.slots.map(slot=>slot.type+':'+slot.name).sort();

test('完整 legacy 路径末级为 Slot，之前所有段为 Block',()=>{
 const m=parse('[comment // ++甲][comment // 乙++][comment // 图][img]x[/img][comment // 乙--][comment // --甲]');
 assert.deepEqual(m.blocks.map(x=>x.logicalPath),[['甲'],['甲','图']]);
 assert.deepEqual(m.slots[0].logicalPath,['甲','图','乙']);
 assert.equal(m.slots[0].name,'乙');
});

test('同父同名 Block 合并多个 sourceOccurrences',()=>{
 const text='[comment // ++组][comment // A++][comment // 图][img]a[/img][comment // A--][comment // --组]\n[comment // ++组][comment // A++][comment // 链接][url=b][comment // A--][comment // --组]';
 const m=parse(text); const block=blockAt(m,['组','图']);
 const secondBlock=blockAt(m,['组','链接']);
 assert.equal(m.blocks.filter(x=>x.logicalPath.join('/')==='组/图').length,1);
 assert.equal(block.sourceOccurrences.length,1);
 assert.deepEqual(slotSummary(block),['image:A']);
 assert.deepEqual(slotSummary(secondBlock),['url:A']);
 const merged=parse('[comment // ++组][comment // A++][comment // 图][img]a[/img][comment // A--][comment // --组]\n[comment // ++组][comment // A++][comment // 图][url=b][comment // A--][comment // --组]');
 const mergedBlock=blockAt(merged,['组','图']);
 assert.equal(merged.blocks.filter(x=>x.logicalPath.join('/')==='组/图').length,1);
 assert.equal(mergedBlock.sourceOccurrences.length,2);
 assert.deepEqual(slotSummary(mergedBlock),['image:A','url:A']);
});

test('Slot 单 source；重复不覆盖并有可定位冲突诊断',()=>{
 const text='[comment // ++组][comment // A][img]one[/img]\n[comment // A][img]two[/img][comment // --组]';
 const m=parse(text); const slot=m.slots[0];
 assert.equal(m.slots.length,1); assert.equal(slot.source.value,'one'); assert.equal(slot.conflicts.length,1);
 const issue=m.diagnostics.find(x=>x.code==='duplicate-slot');
 assert.equal(text.slice(issue.from,issue.to),'[img]two[/img]'); assert.equal(issue.conflictSource.value,'two');
 assert.equal(slot.conflicts[0].source.value,'two');
});

test('图片默认按最终 Slot 名匹配，后者生效且删除恢复',()=>{
 const first='[comment // #悬停效果!图片 = old]\n'; const second='[comment // #悬停效果!图片 = new]\n';
 const suffixResource='[comment // 悬停效果++][comment // icon-01][style dybg 1;2;3;4;5;value][comment // 悬停效果--]';
 const matched=parse(first+second+suffixResource); const matchedSlot=matched.slots[0];
 assert.equal(matchedSlot.name,'悬停效果'); assert.equal(matchedSlot.defaultValue,'new');
 assert.equal(matched.defaultDeclarations[0].shadowedByTokenId,matched.defaultDeclarations[1].id);
 assert.equal(matched.diagnostics.find(x=>x.code==='shadowed-default').severity,'warning');
 assert.equal(parse(first+suffixResource).slots[0].defaultValue,'old');
});

test('Slot 与 StyleBlock source 显式保留重命名 token 引用',()=>{
 const suffix=parse('[comment // 尾++][comment // 图][img]x[/img][comment // 尾--]');
 const suffixSlot=suffix.slots[0];
 assert.equal(suffixSlot.name,'尾');
 assert.equal(suffix.tokensById[suffixSlot.source.nameTokenId].mode,'suffixOpen');
 assert.equal(suffixSlot.source.pairedNameTokenId,suffix.tokensById[suffixSlot.source.nameTokenId].pairedTokenId);
 assert.equal(suffixSlot.source.nameToken.name,'尾');
 assert.equal(suffixSlot.source.pairedNameToken.name,'尾');
 const ordinary=parse('[comment // 普通][img]x[/img]').slots[0];
 assert.equal(ordinary.source.nameTokenId,ordinary.source.nameTokenId);
 assert.equal(ordinary.source.nameToken.mode,'name');
 assert.equal(ordinary.source.pairedNameTokenId,'');
 const style=parse('[comment // 样式!属性][style color #ffffff]').styleBlocks[0];
 assert.equal(style.source.nameTokenId,style.source.nameTokenId);
 assert.equal(style.source.nameToken.name,'样式');
 assert.equal(style.source.pairedNameTokenId,'');
 const uncategorized=parse('[img]x[/img]').slots[0];
 assert.equal(uncategorized.source.nameTokenId,'');
 assert.equal(uncategorized.source.nameToken,null);
});
test('Slot 三态严格派生为 disabled/default/manual',()=>{
 const empty=parse('[comment // A][img][/img]').slots[0];
 const emptyWithDefault=parse('[comment // #A!图片 = x]\n[comment // A][img][/img]').slots[0];
 const equal=parse('[comment // #A!图片 = x]\n[comment // A][img]x[/img]').slots[0];
 const custom=parse('[comment // #A!图片 = x]\n[comment // A][img]y[/img]').slots[0];
 const noDefault=parse('[comment // A][img]y[/img]').slots[0];
 assert.deepEqual([empty.valueState,emptyWithDefault.valueState,equal.valueState,custom.valueState,noDefault.valueState],['disabled','disabled','default','manual','manual']);
});

test('!属性形成具名 StyleBlock，suffix 仍作为其父 Block',()=>{
 const m=parse('[comment // ++组][comment // 尾++][comment // 全局!属性][style color #ffffff][comment // 尾--][comment // --组]');
 assert.equal(m.styleBlocks.length,1); assert.equal(m.slots.length,0);
 assert.equal(m.styleBlocks[0].name,'全局'); assert.deepEqual(blockAt(m,['组','尾']).styleBlocks.map(x=>x.name),['全局']);
 assert.equal(m.styleBlocks[0].fields[0].value,'#ffffff');
});

test('逻辑 ID 与内容 fingerprint 分离',()=>{
 const a=parse('[comment // A][url=one]').slots[0]; const b=parse('[comment // A][url=two]').slots[0];
 assert.equal(a.logicalId,b.logicalId); assert.notEqual(a.source.contentFingerprint,b.source.contentFingerprint);
});

test('range 切片受 generation 和边界保护',()=>{
 const text='前[comment // A][url=x]后'; const m=parse(text); const range=m.slots[0].source.range;
 assert.equal(model.sliceModelRange(m,range),'[url=x]');
 assert.throws(()=>model.sliceModelRange({...m,snapshot:m.snapshot+'x'},range),/generation/);
 assert.throws(()=>model.sliceModelRange(m,{start:-1,end:2}),RangeError);
});

test('tmp/test.bbcode 具体 Block/Slot 与 golden 摘要',()=>{
 const text=fs.readFileSync('tmp/test.bbcode','utf8'); const m=parse(text);
 const left=blockAt(m,['Pg1_海报','版头左侧菜单','左上图标菜单','icon-01']);
 assert.ok(left,'缺少左侧 icon-01 Block');
 assert.deepEqual(slotSummary(left),['image:悬停效果','url:URL']);
 const tx=blockAt(m,['Pg1_海报','版头右侧菜单','右公告板','TX-01']);
 assert.ok(tx,'缺少右公告板 TX-01 Block');
 assert.deepEqual(slotSummary(tx),['image:悬停效果','text:文本','url:URL']);
 const summary={blocks:m.blocks.length,slots:m.slots.length,styleBlocks:m.styleBlocks.length,resources:m.slots.length+m.styleBlocks.length+m.slots.reduce((count,slot)=>count+slot.conflicts.length,0),duplicateSlots:m.diagnostics.filter(x=>x.code==='duplicate-slot').length,rootNames:m.rootBlock.blocks.map(x=>x.name)};
 assert.deepEqual(summary,{blocks:58,slots:145,styleBlocks:2,resources:147,duplicateSlots:0,rootNames:['Pg1_海报','未分类']});
 assert.equal(m.range.end,text.length);
});


test('renderer 直接以 BannerModel 构建 current state',()=>{
 const renderer=fs.readFileSync('src/renderer.js','utf8');
 assert.match(renderer,/import \{buildBannerModel, SYSTEM_UNCATEGORIZED_KEY\} from '\.\/banner-model\.js'/);
 assert.match(renderer,/currentModel=nextModel/);
 assert.match(renderer,/buildBannerModel\(bbcode\|\|''\)/);
 assert.doesNotMatch(renderer,/parseResourceCatalog|projectCatalog/);
});
