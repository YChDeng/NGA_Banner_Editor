export function hashText(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)+':'+text.length}
export function catalogGeneration(text){return hashText(String(text??''))}
export function validateReplacements(text,generation,replacements){
 const valid=(replacements||[]).filter(x=>x&&Number.isInteger(x.start)&&Number.isInteger(x.end)&&x.start>=0&&x.start<=x.end&&x.end<=text.length).sort((a,b)=>b.start-a.start||b.end-a.end);
 if(generation!==catalogGeneration(text))return{ok:false,reason:'stale',replacements:valid};
 for(const item of valid)if(item.expected!=null&&text.slice(item.start,item.end)!==item.expected)return{ok:false,reason:'expected',replacements:valid};
 for(let i=1;i<valid.length;i++)if(valid[i-1].start<valid[i].end)return{ok:false,reason:'overlap',replacements:valid};
 return{ok:valid.length>0,reason:valid.length?'':'empty',replacements:valid};
}

export function catalogDiagnosticRanges(errors, textLength){
 const limit=Number.isInteger(textLength)&&textLength>=0?textLength:Infinity;
 return (errors||[]).filter(error=>error&&Number.isInteger(error.from)&&Number.isInteger(error.to)&&error.from>=0&&error.from<error.to&&error.to<=limit).map(error=>({start:error.from,end:error.to,class:'cm-diagnostic',message:String(error.message||''),severity:error.severity||'error'}));
}
export function resourceAnchorKey(item){return item&&item.stableId?String(item.stableId):''}
