const LIMIT=100, samples=[];
function enabled(){return (typeof window!=='undefined'&&(window.__NGA_PERF_DEBUG===true||window.location?.search?.includes('perf=1')))||typeof process!=='undefined'&&process.env.NGA_PERF_DEBUG==='1'}
const clock=()=>globalThis.performance?.now?.()??Date.now();
export function measurePerf(name,fn,meta={}){if(!enabled())return fn();const start=clock();try{return fn()}finally{samples.push({name,duration:clock()-start,at:Date.now(),...meta});if(samples.length>LIMIT)samples.splice(0,samples.length-LIMIT)}}
export function recordPerf(name,start,meta={}){if(enabled()){samples.push({name,duration:clock()-start,at:Date.now(),...meta});if(samples.length>LIMIT)samples.shift()}}
export function perfNow(){return clock()}
export function getPerfSamples(name){return samples.filter(x=>!name||x.name===name).map(x=>({...x}))}
export function clearPerfSamples(){samples.length=0}
if(typeof window!=='undefined')window.__NGA_PERF={getSamples:getPerfSamples,clear:clearPerfSamples};
