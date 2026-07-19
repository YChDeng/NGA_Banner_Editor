export function applyEdits(text, edits) {
  return [...edits].sort((a,b)=>b.start-a.start).reduce((value,edit)=>value.slice(0,edit.start)+edit.value+value.slice(edit.end),String(text));
}
export function createTextHistory(initial='') {
  let text=String(initial), undoStack=[], redoStack=[];
  return { get text(){return text;}, execute(edits){undoStack.push(text);redoStack=[];text=applyEdits(text,edits);return text;}, undo(){if(!undoStack.length)return false;redoStack.push(text);text=undoStack.pop();return true;}, redo(){if(!redoStack.length)return false;undoStack.push(text);text=redoStack.pop();return true;} };
}
