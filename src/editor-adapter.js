import * as monaco from 'monaco-editor/esm/vs/editor/editor.main.js';
import {tokenizeBbcode} from './tokenizer.js';

const languageId = 'nga-bbcode';
let registered = false;

function ensureLanguage() {
  if (registered) return;
  registered = true;
  monaco.languages.register({ id: languageId });
  monaco.languages.setLanguageConfiguration(languageId, { brackets:[['[',']']], autoClosingPairs:[{open:'[',close:']'}], surroundingPairs:[{open:'[',close:']'}] });
  monaco.languages.setTokensProvider(languageId, { getInitialState: () => createTokenState(0), tokenize: tokenizeLine });
  defineThemes();
}
function defineThemes() {
  const rules = [
    ['bb-bracket','64748b'],['bb-close','dc2626'],['bb-tag','7c3aed'],['bb-attribute','b45309'],['bb-value','0f766e'],['bb-comment','64748b'],['bb-url','2563eb'],['bb-color','be185d'],['bb-number','15803d'],['bb-entity','9333ea'],['bb-comment-marker','c2410c'],['bb-comment-name','4d7c0f'],['bb-comment-feature','a21caf']
  ].map(([token,foreground])=>({token,foreground}));
  rules.push({token:'bb-comment',foreground:'64748b',fontStyle:'italic'},{token:'bb-commentMarker',foreground:'c2410c',fontStyle:'bold'},{token:'bb-commentFeature',foreground:'a21caf',fontStyle:'bold'});
  monaco.editor.defineTheme('nga-light',{base:'vs',inherit:true,rules,colors:{'editor.background':'#ffffff','editor.foreground':'#1f2937','editorLineNumber.foreground':'#9ca3af','editorLineNumber.activeForeground':'#2563eb','editor.lineHighlightBackground':'#f8fafc','editor.selectionBackground':'#bfdbfe','editorCursor.foreground':'#2563eb','editorIndentGuide.background1':'#e5e7eb'}});
  monaco.editor.defineTheme('nga-dark',{base:'vs-dark',inherit:true,rules:rules.map(rule=>({...rule})),colors:{'editor.background':'#111827','editor.foreground':'#e5e7eb','editorLineNumber.foreground':'#6b7280','editorLineNumber.activeForeground':'#60a5fa','editor.lineHighlightBackground':'#172033','editor.selectionBackground':'#1d4ed880','editorCursor.foreground':'#60a5fa','editorIndentGuide.background1':'#374151'}});
}
function createTokenState(depth){ return { depth, clone(){ return createTokenState(this.depth); }, equals(other){ return Boolean(other) && this.depth === other.depth; } }; }
function tokenizeLine(line, state) {
  const text=String(line||''), currentDepth=state?.depth||0, tokens=[];
  if(currentDepth>0){
    const close=text.search(/\[\s*\/\s*code\s*\]/i);
    if(close<0) return {tokens:[],endState:createTokenState(currentDepth)};
    const closeMatch=text.slice(close).match(/^\[\s*\/\s*code\s*\]/i), closeEnd=close+closeMatch[0].length;
    const tail=tokenizeLine(text.slice(closeEnd),createTokenState(0));
    return {tokens:tail.tokens.map(token=>({startIndex:token.startIndex+closeEnd,scopes:token.scopes})),endState:tail.endState};
  }
  for(const range of tokenizeBbcode(text)) tokens.push({startIndex:range.start,scopes:'bb-'+range.type});
  const opens=(text.match(/\[\s*code(?:\s|\])/gi)||[]).length, closes=(text.match(/\[\s*\/\s*code\s*\]/gi)||[]).length;
  return {tokens,endState:createTokenState(Math.max(0,opens-closes))};
}
function offsetsToRange(model,start,end){return monaco.Range.fromPositions(model.getPositionAt(start),model.getPositionAt(end));}

export function createEditorAdapter(parent, options={}) {
  ensureLanguage();
  const media=matchMedia('(prefers-color-scheme: dark)');
  const model=monaco.editor.createModel('',languageId);
  const editor=monaco.editor.create(parent,{model,theme:media.matches?'nga-dark':'nga-light',automaticLayout:false,fontFamily:'Cascadia Code, JetBrains Mono, Consolas, monospace',fontSize:14,lineHeight:21,fontLigatures:true,minimap:{enabled:false},stickyScroll:{enabled:false},smoothScrolling:true,scrollBeyondLastLine:false,renderWhitespace:'selection',bracketPairColorization:{enabled:true},guides:{bracketPairs:true,indentation:true},wordWrap:'off',padding:{top:8,bottom:8},overviewRulerBorder:false,renderValidationDecorations:'on',contextmenu:true,find:{addExtraSpaceOnTop:false,seedSearchStringFromSelection:'selection'},quickSuggestions:false});
  const resizeObserver=new ResizeObserver(()=>editor.layout()); resizeObserver.observe(parent);
  let listeners=options.onChange?[options.onChange]:[], selectionListeners=options.onSelectionChange?[options.onSelectionChange]:[], externalIds=[], suppress=false;
  const subscriptions=[];
  subscriptions.push(model.onDidChangeContent(()=>{if(suppress)return;const state={doc:{toString:()=>model.getValue()}};listeners.forEach(fn=>fn({state}));}));
  subscriptions.push(editor.onDidChangeCursorSelection(()=>{const selection=api.getSelection();selectionListeners.forEach(fn=>fn(selection));}));
  editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter,()=>options.onModEnter?.());
  const onTheme=event=>monaco.editor.setTheme(event.matches?'nga-dark':'nga-light'); media.addEventListener('change',onTheme);
  const api={getText:()=>model.getValue(),setText(text){suppress=true;model.setValue(String(text??''));suppress=false;},dispatchChanges(changes,selection){editor.pushUndoStop();editor.executeEdits('resource-edit',changes.map(change=>({range:offsetsToRange(model,change.start,change.end),text:change.value,forceMoveMarkers:true})));editor.pushUndoStop();if(selection)api.setSelection(selection.anchor??selection.from,selection.head??selection.to);},getSelection(){const selection=editor.getSelection();return{from:model.getOffsetAt(selection.getStartPosition()),to:model.getOffsetAt(selection.getEndPosition())};},setSelection(from,to=from,center=true){editor.setSelection(offsetsToRange(model,from,to));if(center)editor.revealRangeInCenter(editor.getSelection());editor.focus();},focus:()=>editor.focus(),layout:()=>editor.layout(),onChange(fn){listeners.push(fn);return()=>listeners=listeners.filter(item=>item!==fn);},onSelectionChange(fn){selectionListeners.push(fn);return()=>selectionListeners=selectionListeners.filter(item=>item!==fn);},setDecorations(extra=[]){externalIds=editor.deltaDecorations(externalIds,extra.filter(item=>item.start>=0&&item.end<=model.getValueLength()&&item.start<item.end).map(item=>({range:offsetsToRange(model,item.start,item.end),options:{inlineClassName:item.class||'monaco-diagnostic',hoverMessage:item.message?{value:item.message}:undefined,overviewRuler:{color:'#ef4444',position:monaco.editor.OverviewRulerLane.Right}}})));monaco.editor.setModelMarkers(model,'catalog',extra.map(item=>({startLineNumber:model.getPositionAt(item.start).lineNumber,startColumn:model.getPositionAt(item.start).column,endLineNumber:model.getPositionAt(item.end).lineNumber,endColumn:model.getPositionAt(item.end).column,message:item.message||'Invalid BBCode',severity:monaco.MarkerSeverity.Error})));},dispose(){media.removeEventListener('change',onTheme);subscriptions.forEach(item=>item.dispose());resizeObserver.disconnect();editor.dispose();model.dispose();}};
  return api;
}
