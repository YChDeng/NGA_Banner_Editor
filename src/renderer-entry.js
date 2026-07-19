import 'monaco-editor/min/vs/editor/editor.main.css';
window.MonacoEnvironment={getWorkerUrl:()=>new URL('../dist/monaco-worker.js',window.location.href).toString()};
import './renderer.js';
