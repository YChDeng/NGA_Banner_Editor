import {hashText} from './catalog-guards.js';
import {buildLineIndex,lineNumberAt,mergeIntervals,overlapsIntervals} from './catalog-helpers.js';

export const UNCATEGORIZED = '未分类';
export const SYSTEM_UNCATEGORIZED_KEY = '__system_uncategorized__';
 function parseLegacyCatalog(bbcode) {
   const resources = [];
   const errors = [];
   const tokensById = Object.create(null);
   const consumed = [];
   const prefixStack = [];
   const suffixStack = [];
   const lineStarts=buildLineIndex(bbcode);
   const lines = splitLinesWithOffsets(bbcode).map((x,index)=>({...x,line:index+1}));
   const imageDefaults = [];
   let tokenSeq = 0;
   let resourceSeq = 0;

   lines.forEach(function (lineInfo) {
     const events = [];
     const line = lineInfo.text;
     const commentRegex = /(\[comment\s+\/\/\s*)([^\]]*)(\])/gi;
     let match;

     while ((match = commentRegex.exec(line))) {
       const token = parseCommentToken(match, lineInfo.offset, tokenSeq++, lineInfo.line);
       tokensById[token.id] = token;
       if (token.mode === 'imageDefault') imageDefaults.push(token);
       events.push({ kind: 'comment', index: match.index, token });
     }

     collectDybgEvents(line, lineInfo, events, bbcode);
     collectUrlEvents(line, lineInfo, events, bbcode);
     collectImgEvents(line, lineInfo, events, bbcode);
     events.sort(function (a, b) {
       if (a.index !== b.index) return a.index - b.index;
       return a.kind === 'comment' ? -1 : 1;
     });

     let currentNameToken = null;
     events.forEach(function (event) {
       if (event.kind === 'comment') {
         const token = event.token;
         if (token.mode === 'imageDefault') {
           return;
         } else if (token.mode === 'prefixOpen') {
           prefixStack.push(token);
         } else if (token.mode === 'prefixClose') {
           closeStack(prefixStack, token, '前缀目录', errors);
         } else if (token.mode === 'suffixOpen') {
           suffixStack.push(token);
         } else if (token.mode === 'suffixClose') {
           closeStack(suffixStack, token, '后缀目录', errors);
         } else if (token.feature === 'text') {
           currentNameToken = token;
           const item = extractTextResource(bbcode, line, lineInfo, token, prefixStack, suffixStack, resourceSeq++);
           resources.push(item);
           consumed.push(item.range);
         } else if (token.feature === 'attr') {
           currentNameToken = token;
           const item = extractAttributeResource(line, lineInfo, token, prefixStack, suffixStack, resourceSeq++);
           resources.push(item);
           if (item.range) consumed.push(item.range);
         } else {
           currentNameToken = token;
         }
         return;
       }

       if (event.kind === 'dybg') {
         const item = createImageResource(event, currentNameToken, prefixStack, suffixStack, resourceSeq++);
         resources.push(item);
         consumed.push(item.range);
       } else if (event.kind === 'img') {
         const item = createSimpleResource('image', 'img', event, currentNameToken, prefixStack, suffixStack, resourceSeq++);
         resources.push(item);
         consumed.push(item.range);
       } else if (event.kind === 'url') {
         const item = createSimpleResource('url', 'url', event, currentNameToken, prefixStack, suffixStack, resourceSeq++);
         resources.push(item);
         consumed.push(item.range);
       }
     });
   });

   prefixStack.slice().reverse().forEach(function (token) {
     errors.push(makeError('前缀目录未闭合：' + token.name, token));
   });
   suffixStack.slice().reverse().forEach(function (token) {
     errors.push(makeError('后缀目录未闭合：' + token.name, token));
   });

   collectUncategorized(bbcode, consumed, resources, resourceSeq, lineStarts);
   applyImageDefaults(imageDefaults, resources, errors);
   const generation = hashText(bbcode); const stableCounts=Object.create(null); resources.forEach(function(item){const base=stableResourceId(item,bbcode);const occurrence=stableCounts[base]||0;stableCounts[base]=occurrence+1;item.stableId=base+':'+occurrence}); return { resources, errors, tokensById, generation, snapshot: bbcode, defaultDeclarations: imageDefaults };
 }

 function stableResourceId(item, text) { const core=text.slice(item.range.start,item.range.end); return item.type+':'+item.sourceKind+':'+hashText(core)+':'+hashText(item.name||''); }

 function splitLinesWithOffsets(text) {
   const result = [];
   const regex = /.*(?:\r?\n|$)/g;
   let match;
   while ((match = regex.exec(text))) {
     if (!match[0] && match.index === text.length) break;
     const raw = match[0];
     result.push({ text: raw.replace(/\r?\n$/, ''), offset: match.index });
   }
   return result;
 }

 function parseCommentToken(match, lineOffset, seq, lineNumber) {
   const raw = match[2];
   const rawStart = lineOffset + match.index + match[1].length;
   const leading = raw.match(/^\s*/)[0].length;
   const trailing = raw.match(/\s*$/)[0].length;
   const trimmed = raw.slice(leading, raw.length - trailing);
   const trimmedStart = rawStart + leading;
   let mode = 'name';
   let markerStart = '';
   let markerEnd = '';
   let feature = '';
   let nameStartRel = 0;
   let nameEndRel = trimmed.length;

   const imageDefaultMatch = /^#([^!\]=]+)!\u56fe\u7247\s*=\s*(.*)$/.exec(trimmed);
   let defaultValue = '';
   if (imageDefaultMatch) {
     mode = 'imageDefault';
     nameStartRel = trimmed.indexOf(imageDefaultMatch[1]);
     nameEndRel = nameStartRel + imageDefaultMatch[1].length;
     defaultValue = imageDefaultMatch[2];
   } else if (trimmed.startsWith('++')) {
     mode = 'prefixOpen';
     markerStart = '++';
     nameStartRel = 2;
   } else if (trimmed.startsWith('--')) {
     mode = 'prefixClose';
     markerStart = '--';
     nameStartRel = 2;
   } else if (trimmed.endsWith('++')) {
     mode = 'suffixOpen';
     markerEnd = '++';
     nameEndRel = trimmed.length - 2;
   } else if (trimmed.endsWith('--')) {
     mode = 'suffixClose';
     markerEnd = '--';
     nameEndRel = trimmed.length - 2;
   }

   const featureIndex = trimmed.indexOf('!', nameStartRel);
   if (featureIndex !== -1 && featureIndex < nameEndRel) {
     const featureName = trimmed.slice(featureIndex + 1, nameEndRel).trim();
     if (featureName === '文本') feature = 'text';
     if (featureName === '属性') feature = 'attr';
     if (feature) nameEndRel = featureIndex;
   }

   while (nameStartRel < nameEndRel && /\s/.test(trimmed[nameStartRel])) nameStartRel += 1;
   while (nameEndRel > nameStartRel && /\s/.test(trimmed[nameEndRel - 1])) nameEndRel -= 1;

   const name = trimmed.slice(nameStartRel, nameEndRel);
   return {
     id: 'c' + seq,
     mode,
     markerStart,
     markerEnd,
     feature,
     name,
     defaultValue,
     raw,
     line: lineNumber,
     range: { start: lineOffset + match.index, end: lineOffset + match.index + match[0].length },
     nameRange: { start: trimmedStart + nameStartRel, end: trimmedStart + nameEndRel }
   };
 }

 function closeStack(stack, closeToken, label, errors) {
   if (!stack.length) {
     errors.push(makeError(label + '关闭没有对应开始：' + closeToken.name, closeToken));
     return;
   }
   const top = stack[stack.length - 1];
   if (top.name === closeToken.name) {
     stack.pop();
     pairTokens(top, closeToken);
     return;
   }
   const foundIndex = stack.map(function (token) { return token.name; }).lastIndexOf(closeToken.name);
   if (foundIndex === -1) {
     errors.push(makeError(label + '关闭名称不匹配：' + closeToken.name + '，当前为 ' + top.name, closeToken));
     return;
   }
   errors.push(makeError(label + '交叉关闭：' + closeToken.name + '，当前为 ' + top.name, closeToken));
   const openToken = stack.splice(foundIndex, 1)[0];
   pairTokens(openToken, closeToken);
 }

 function pairTokens(openToken, closeToken) {
   openToken.pairedTokenId = closeToken.id;
   closeToken.pairedTokenId = openToken.id;
 }

 function collectDybgEvents(line, lineInfo, events, bbcode) {
   const regex = /dybg\s+([^;\]]*);([^;\]]*);([^;\]]*);([^;\]]*);([^;\]]*);([^\]\s]*)/gi;
   let match;
   while ((match = regex.exec(line))) {
     const fields = [];
     let searchAt = match.index + match[0].indexOf(match[1]);
     for (let i = 1; i <= 6; i += 1) {
       const value = match[i];
       const relStart = line.indexOf(value, searchAt);
       const relEnd = relStart + value.length;
       fields.push({ value, range: { start: lineInfo.offset + relStart, end: lineInfo.offset + relEnd } });
       searchAt = relEnd + 1;
     }
     events.push({
       kind: 'dybg',
       index: match.index,
       range: { start: lineInfo.offset + match.index, end: lineInfo.offset + match.index + match[0].length },
       fields,
       line: lineInfo.line
     });
   }
 }

 function collectUrlEvents(line, lineInfo, events, bbcode) {
   const regex = /\[url=([^\]]*)\]/gi;
   let match;
   while ((match = regex.exec(line))) {
     const valueStart = lineInfo.offset + match.index + 5;
     events.push({
       kind: 'url',
       index: match.index,
       value: match[1],
       valueRange: { start: valueStart, end: valueStart + match[1].length },
       range: { start: lineInfo.offset + match.index, end: lineInfo.offset + match.index + match[0].length },
       line: lineInfo.line
     });
   }
 }

 function collectImgEvents(line, lineInfo, events, bbcode) {
   const regex = /\[img[^\]]*\]([\s\S]*?)\[\/img\]/gi;
   let match;
   while ((match = regex.exec(line))) {
     const openEnd = match[0].indexOf(']') + 1;
     const valueStart = lineInfo.offset + match.index + openEnd;
     events.push({
       kind: 'img',
       index: match.index,
       value: match[1],
       valueRange: { start: valueStart, end: valueStart + match[1].length },
       range: { start: lineInfo.offset + match.index, end: lineInfo.offset + match.index + match[0].length },
       line: lineInfo.line
     });
   }
 }

 function extractTextResource(bbcode, line, lineInfo, token, prefixStack, suffixStack, seq) {
   const localTokenStart = token.range.start - lineInfo.offset;
   const localStart = token.range.end - lineInfo.offset;
   const openStyles = collectOpenStyleTags(line.slice(0, localTokenStart), lineInfo.offset);
   const valueStart = token.range.end;
   const valueEndLocal = findTextContainerEnd(line, localStart, openStyles.length);
   const valueEnd = valueEndLocal === -1 ? valueStart : lineInfo.offset + valueEndLocal;
   const item = createBaseResource('text', '\u6587\u672c', token, prefixStack, suffixStack, seq);
   item.value = bbcode.slice(valueStart, valueEnd);
   item.valueRange = { start: valueStart, end: valueEnd };
   item.range = { start: token.range.start, end: valueEnd };
   item.textStyles = extractTextStyleFields(openStyles);
   if (valueEndLocal === -1) item.errors.push('\u672a\u627e\u5230\u5305\u88f9\u6587\u672c\u7684 style \u95ed\u5408\u6807\u7b7e');
   return item;
 }

 function collectOpenStyleTags(prefix, lineOffset) {
   const stack = [];
   const regex = /\[(\/?)style(?:\s+([^\]]*))?\]/gi;
   let match;
   while ((match = regex.exec(prefix))) {
     if (match[1]) stack.pop();
     else stack.push({ content: match[2] || '', contentStart: lineOffset + match.index + match[0].indexOf(match[2] || '') });
   }
   return stack;
 }

 function findTextContainerEnd(line, localStart, initialDepth) {
   if (!initialDepth) return -1;
   const regex = /\[(\/?)style(?:\s+[^\]]*)?\]/gi;
   regex.lastIndex = localStart;
   let depth = initialDepth;
   let match;
   while ((match = regex.exec(line))) {
     if (match[1]) {
       depth -= 1;
       if (depth < initialDepth) return match.index;
     } else {
       depth += 1;
     }
   }
   return -1;
 }

 function extractTextStyleFields(openStyles) {
   const fields = [];
   openStyles.forEach(function (style) {
     const tokens = tokenizeTagContent(style.content, style.contentStart);
     for (let index = 0; index < tokens.length; index += 1) {
       const key = tokens[index].value.toLowerCase();
       const value = tokens[index + 1];
       if (key === 'color' && value && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value.value)) {
         fields.push({ key: 'color', label: '\u6587\u5b57\u989c\u8272', value: value.value, range: value.range, kind: 'text-color' });
         index += 1;
       } else if (key === 'font' && value && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.value) && Number(value.value) > 0) {
         fields.push({ key: 'font', label: '\u5b57\u53f7 (em)', value: value.value, range: value.range, kind: 'number' });
         index += 1;
       }
     }
   });
   return fields;
 }

 function extractAttributeResource(line, lineInfo, token, prefixStack, suffixStack, seq) {
   const localStart = token.range.end - lineInfo.offset;
   const rest = line.slice(localStart);
   const match = /\[(?!\/)(?!comment\b)([^\]]*)\]/i.exec(rest);
   const item = createBaseResource('attr', '属性', token, prefixStack, suffixStack, seq);
   if (!match) {
     item.value = '';
     item.valueRange = { start: token.range.end, end: token.range.end };
     item.range = { start: token.range.start, end: token.range.end };
     item.errors.push('未找到 !属性 后面的属性标签');
     return item;
   }

   const tagStart = token.range.end + match.index;
   const contentStart = tagStart + 1;
   const contentEnd = contentStart + match[1].length;
   const parts = match[1].trim().split(/\s+/);
   item.tagName = parts.shift() || '';
   item.value = match[1];
   item.valueRange = { start: contentStart, end: contentEnd };
   item.range = { start: tagStart, end: tagStart + match[0].length };
   item.fields = parseKnownAttributes(match[1], contentStart);
   item.attributes = item.fields.map(field=>({key:field.key,value:field.value,label:field.label,range:field.range}));
   item.colors = findColorRanges(match[1], contentStart);
   return item;
 }

 function parseAttributes(content, contentStart) {
   const fields = parseKnownAttributes(content, contentStart);
   return fields.map(function (field) {
     return { key: field.key, value: field.value, label: field.label, range: field.range };
   });
 }

 function parseKnownAttributes(content, contentStart) {
   const tokens = tokenizeTagContent(content, contentStart);
   if (!tokens.length) return [];
   const tagName = tokens[0].value.toLowerCase();
   const fields = [];
   let index = 1;

   function addField(key, label, token, kind) {
     if (!token) return;
     fields.push({ key, label, value: token.value, range: token.range, kind: kind || 'text' });
   }

   function addSequence(key, labels, kind) {
     labels.forEach(function (label) {
       addField(key, label, tokens[index++], kind);
     });
   }

   while (index < tokens.length) {
     const keyToken = tokens[index++];
     const key = keyToken.value.toLowerCase();
     if (tagName === 'fixsize') {
       if (key === 'width') addSequence(key, ['宽度下限', '宽度上限']);
       else if (key === 'height') addSequence(key, ['高度']);
       else if (key === 'background') addSequence(key, ['外背景色', '内背景色'], 'color');
       else addField(key, keyToken.value, tokens[index++]);
       continue;
     }

     if (key === 'filter-drop-shadow') {
       const valueToken = tokens[index++];
       if (valueToken) {
         const parts = valueToken.value.split(';');
         let cursor = valueToken.range.start;
         const color = /#[0-9a-f]{6}(?:[0-9a-f]{2})?/i.exec(parts[0] || '');
         if (color) {
           const start = valueToken.range.start + color.index;
           fields.push({ key, label: '阴影颜色', value: color[0], range: { start, end: start + color[0].length }, kind: 'color' });
         }
         ['阴影X', '阴影Y', '阴影模糊'].forEach(function (label, labelIndex) {
           const partIndex = labelIndex + 1;
           if (parts[partIndex] == null) return;
           cursor = valueToken.range.start + parts.slice(0, partIndex).join(';').length + 1;
           const part = parts[partIndex];
           fields.push({ key, label, value: part, range: { start: cursor, end: cursor + part.length }, kind: 'text' });
         });
       }
     } else if (key === 'dybg') {
       const valueToken = tokens[index++];
       if (valueToken) {
         const parts = valueToken.value.split(';');
         const labels = ['缩放', '位置X', '位置Y', '活动量X', '活动量Y', '图片链接'];
         let cursor = valueToken.range.start;
         parts.forEach(function (part, partIndex) {
           fields.push({ key, label: labels[partIndex] || ('dybg-' + partIndex), value: part, range: { start: cursor, end: cursor + part.length }, kind: partIndex === 5 ? 'url' : 'text' });
           cursor += part.length + 1;
         });
       }
     } else if (key === 'background' || key === 'color') {
       addField(key, key === 'background' ? '背景色' : '文字颜色', tokens[index++], 'color');
     } else if (key === 'width' || key === 'height' || key === 'border-radius' || key === 'line-height' || key === 'left' || key === 'right' || key === 'top' || key === 'bottom' || key === 'rotate' || key === 'font' || key === 'align') {
       addField(key, keyToken.value, tokens[index++]);
     } else {
       addField(key, keyToken.value, tokens[index++]);
     }
   }
   return fields;
 }

 function tokenizeTagContent(content, contentStart) {
   const tokens = [];
   const regex = /\S+/g;
   let match;
   while ((match = regex.exec(content))) {
     tokens.push({ value: match[0], range: { start: contentStart + match.index, end: contentStart + match.index + match[0].length } });
   }
   return tokens;
 }

 function findColorRanges(content, contentStart) {
   const colors = [];
   const regex = /#([0-9a-f]{6})([0-9a-f]{2})?/gi;
   let match;
   while ((match = regex.exec(content))) {
     colors.push({
       value: '#' + match[1],
       alpha: match[2] || '',
       range: { start: contentStart + match.index, end: contentStart + match.index + match[0].length }
     });
   }
   return colors;
 }

 function createImageResource(event, nameToken, prefixStack, suffixStack, seq) {
   const item = createBaseResource('image', 'dybg', nameToken, prefixStack, suffixStack, seq);
   item.params = [
     { label: '缩放', field: event.fields[0] },
     { label: '位置X', field: event.fields[1] },
     { label: '位置Y', field: event.fields[2] },
     { label: '活动量X', field: event.fields[3] },
     { label: '活动量Y', field: event.fields[4] }
   ];
   item.url = event.fields[5].value;
   item.urlRange = event.fields[5].range;
   item.value = item.url;
   item.range = event.range;
   item.line = event.line;
   return item;
 }

 function createSimpleResource(type, sourceKind, event, nameToken, prefixStack, suffixStack, seq) {
   const item = createBaseResource(type, sourceKind, nameToken, prefixStack, suffixStack, seq);
   item.value = event.value;
   item.url = event.value;
   item.valueRange = event.valueRange;
   item.urlRange = event.valueRange;
   item.range = event.range;
   item.line = event.line;
   return item;
 }

 function createBaseResource(type, sourceKind, nameToken, prefixStack, suffixStack, seq) {
   const segmentTokens = [];
   const prefixParts = prefixStack.map(function (token) {
     segmentTokens.push(token.id);
     return token.name;
   });
   const suffixTokens = suffixStack.slice().reverse();
   const suffixParts = suffixTokens.map(function (token) {
     segmentTokens.push(token.id);
     return token.name;
   });
   const hasName = Boolean(nameToken && nameToken.name);
   const name = hasName ? nameToken.name : UNCATEGORIZED;
   const parts = hasName ? prefixParts.concat([name], suffixParts) : [UNCATEGORIZED];
   const pathTokenIds = hasName ? prefixStack.map(function (token) { return token.id; }).concat([nameToken.id], suffixTokens.map(function (token) { return token.id; })) : [];
   return {
     id: 'r' + seq,
     type,
     sourceKind,
     name,
     nameTokenId: nameToken ? nameToken.id : '',
     pathParts: parts,
     pathTokenIds,
     pathKeys: hasName ? pathTokenIds.map(function (id, index) { return id || ('name:' + parts[index]); }) : [SYSTEM_UNCATEGORIZED_KEY],
     path: '\\' + parts.join('\\'),
     line: nameToken ? nameToken.line : 0,
     errors: []
   };
 }

 function collectUncategorized(bbcode, consumed, resources, resourceSeq, lineStarts) {
   const ranges = mergeIntervals(consumed);
   const addIfFree = function (type, sourceKind, start, end, value, valueStart, valueEnd) {
     if (overlapsIntervals(ranges,start,end)) return;
     const item = {
       id: 'r' + resourceSeq++,
       type,
       sourceKind,
       name: UNCATEGORIZED,
       pathParts: [UNCATEGORIZED],
       pathTokenIds: [],
       pathKeys: [SYSTEM_UNCATEGORIZED_KEY],
       path: '\\' + UNCATEGORIZED,
       line: lineNumberAt(lineStarts,start),
       value,
       url: value,
       valueRange: { start: valueStart, end: valueEnd },
       urlRange: { start: valueStart, end: valueEnd },
       range: { start, end },
       errors: []
     };
     resources.push(item);
     ranges.splice(0,ranges.length,...mergeIntervals(ranges.concat(item.range)));
   };

   let match;
   const dybgTag = /dybg\s+([^;\]]*);([^;\]]*);([^;\]]*);([^;\]]*);([^;\]]*);([^\]\s]*)/gi;
   while ((match = dybgTag.exec(bbcode))) {
     const fields = [];
     let searchAt = match.index + match[0].indexOf(match[1]);
     for (let i = 1; i <= 6; i += 1) {
       const value = match[i];
       const relStart = bbcode.indexOf(value, searchAt);
       const relEnd = relStart + value.length;
       fields.push({ value, range: { start: relStart, end: relEnd } });
       searchAt = relEnd + 1;
     }
     if (!overlapsIntervals(ranges,match.index,match.index+match[0].length)) {
       const item = {
         id: 'r' + resourceSeq++,
         type: 'image',
         sourceKind: 'dybg',
         name: UNCATEGORIZED,
         pathParts: [UNCATEGORIZED],
         pathTokenIds: [],
         pathKeys: [SYSTEM_UNCATEGORIZED_KEY],
         path: '\\' + UNCATEGORIZED,
         line: lineNumberAt(lineStarts,match.index),
         params: [
           { label: '缩放', field: fields[0] },
           { label: '位置X', field: fields[1] },
           { label: '位置Y', field: fields[2] },
           { label: '活动量X', field: fields[3] },
           { label: '活动量Y', field: fields[4] }
         ],
         url: fields[5].value,
         urlRange: fields[5].range,
         value: fields[5].value,
         range: { start: match.index, end: match.index + match[0].length },
         errors: []
       };
       resources.push(item);
       ranges.splice(0,ranges.length,...mergeIntervals(ranges.concat(item.range)));
     }
   }

   const imgTag = /\[img[^\]]*\]([\s\S]*?)\[\/img\]/gi;
   while ((match = imgTag.exec(bbcode))) {
     const openEnd = match[0].indexOf(']') + 1;
     addIfFree('image', 'img', match.index, match.index + match[0].length, match[1], match.index + openEnd, match.index + openEnd + match[1].length);
   }

   const urlTag = /\[url=([^\]]*)\]/gi;
   while ((match = urlTag.exec(bbcode))) {
     addIfFree('url', 'url', match.index, match.index + match[0].length, match[1], match.index + 5, match.index + 5 + match[1].length);
   }
 }

 function applyImageDefaults(declarations, resources, errors) {
  const byName = Object.create(null);
  declarations.forEach(function (declaration) {
    const previous = byName[declaration.name];
    if (previous) {
      previous.shadowedByTokenId = declaration.id;
      declaration.shadowsTokenId = previous.id;
      const diagnostic = makeError('图片默认声明被后续声明覆盖：' + declaration.name, previous);
      diagnostic.severity = 'warning';
      diagnostic.code = 'shadowed-default';
      errors.push(diagnostic);
    }
    byName[declaration.name] = declaration;
  });
  resources.forEach(function(item){
    if(item.type!=='image') return;
    const name=item.pathParts[item.pathParts.length-1];
    const declaration=byName[name];
    if(declaration){item.defaultUrl=declaration.defaultValue;item.defaultDeclarationTokenId=declaration.id}
  });
 } function makeError(message, token) {
   return {
     id: 'e' + token.id,
     message,
     line: token.line,
     pathParts: [UNCATEGORIZED],
     path: '\\' + UNCATEGORIZED,
     from: (token.fullRange || token.nameRange || token.range).start,
     to: (token.fullRange || token.nameRange || token.range).end,
     severity: 'error'
   };
 }


function logicalHash(value) { return hashText(String(value)).split(':')[0]; }
function rangeCopy(range) { return range ? {start: range.start, end: range.end} : null; }
function sourceFromResource(resource, snapshot, nameTokenId, tokensById) {
 const resourceView={...resource};
 const nameToken=nameTokenId&&tokensById[nameTokenId];
 const pairedNameTokenId=nameToken?.pairedTokenId||'';
 const pairedNameToken=pairedNameTokenId&&tokensById[pairedNameTokenId];
 return {
  ...resource,
  resource: resourceView,
  id: resource.id,
  sourceKind: resource.sourceKind,
  range: rangeCopy(resource.range),
  valueRange: rangeCopy(resource.valueRange || resource.urlRange),
  line: resource.line,
  value: resource.value ?? resource.url ?? '',
  nameTokenId: nameToken?.id||'',
  pairedNameTokenId,
  nameToken: nameToken ? {id:nameToken.id, mode:nameToken.mode, name:nameToken.name, range:rangeCopy(nameToken.range), nameRange:rangeCopy(nameToken.nameRange), line:nameToken.line} : null,
  pairedNameToken: pairedNameToken ? {id:pairedNameToken.id, mode:pairedNameToken.mode, name:pairedNameToken.name, range:rangeCopy(pairedNameToken.range), nameRange:rangeCopy(pairedNameToken.nameRange), line:pairedNameToken.line} : null,
  contentFingerprint: hashText(snapshot.slice(resource.range.start, resource.range.end))
 };
}
function makeBlock(parent, name, logicalPath, options={}) {
 const logicalId = options.virtual ? SYSTEM_UNCATEGORIZED_KEY : 'block:' + logicalHash(logicalPath.join('\u001f'));
 return {kind:'Block', logicalId, stableId:logicalId, name, logicalPath, parentId:parent?.logicalId || null, virtual:Boolean(options.virtual), sourceOccurrences:[], blocks:[], slots:[], styleBlocks:[], childMap:new Map()};
}
function ensureBlock(root, parts, tokenIds, tokensById) {
 let parent=root;
 for(let index=0;index<parts.length;index+=1){
  const name=parts[index]; const virtual=parts.length===1&&name===UNCATEGORIZED;
  const key=virtual?SYSTEM_UNCATEGORIZED_KEY:'name:'+name;
  let block=parent.childMap.get(key);
  if(!block){block=makeBlock(parent,name,parent.logicalPath.concat(name),{virtual});parent.childMap.set(key,block);parent.blocks.push(block)}
  const tokenId=tokenIds[index]; const token=tokenId&&tokensById[tokenId];
  if(token&&!block.sourceOccurrences.some(item=>item.tokenId===token.id)) block.sourceOccurrences.push({tokenId:token.id, pairedTokenId:token.pairedTokenId||'', range:rangeCopy(token.range), nameRange:rangeCopy(token.nameRange), line:token.line});
  parent=block;
 }
 return parent;
}
function deriveValueState(value, defaultValue) {
 if(value===''||value==null) return 'disabled';
 if(defaultValue!==undefined&&value===defaultValue) return 'default';
 return 'manual';
}
function diagnosticForDuplicate(slot, conflict, index) {
 const source=conflict.source;
 return {id:'duplicate-slot:'+logicalHash(slot.logicalId+':'+index+':'+source.range.start),code:'duplicate-slot',message:'重复 Slot：'+slot.path+'（未合并、未覆盖）',line:source.line,pathParts:source.pathParts.slice(),path:source.path,from:source.range.start,to:source.range.end,severity:'error',slotId:slot.logicalId,conflictSource:source};
}
function stripMaps(block){delete block.childMap;block.blocks.forEach(stripMaps)}

export function buildBannerModel(bbcode) {
 const snapshot=String(bbcode??'');
 const legacy=parseLegacyCatalog(snapshot);
 const root=makeBlock(null,'',[]);
 root.logicalId='banner:root'; root.stableId=root.logicalId;
 const slots=[]; const styleBlocks=[]; const diagnostics=legacy.errors.slice(); const slotByKey=new Map();
 legacy.resources.forEach(resource=>{
  const named=resource.pathKeys?.[0]!==SYSTEM_UNCATEGORIZED_KEY;
  const nameIndex=named?resource.pathTokenIds.indexOf(resource.nameTokenId):-1;
  const isStyle=resource.type==='attr';
  const displayName=named?(isStyle?resource.pathParts[nameIndex]:resource.pathParts.at(-1)):UNCATEGORIZED;
  const parentParts=named?(isStyle?resource.pathParts.filter(function(_,index){return index!==nameIndex}):resource.pathParts.slice(0,-1)):[UNCATEGORIZED];
  const parentTokenIds=named?(isStyle?resource.pathTokenIds.filter(function(_,index){return index!==nameIndex}):resource.pathTokenIds.slice(0,-1)):[];
  const block=ensureBlock(root,parentParts,parentTokenIds,legacy.tokensById);
  const sourceNameTokenId=named?(isStyle?resource.nameTokenId:resource.pathTokenIds.at(-1)):'';
  if(isStyle){
   const logicalKey=block.logicalPath.join('\u001f')+'\u001fstyle\u001f'+displayName;
   const styleBlock={kind:'StyleBlock',logicalId:'style:'+logicalHash(logicalKey),stableId:'style:'+logicalHash(logicalKey),name:displayName,parentId:block.logicalId,path:resource.path,source:sourceFromResource(resource,snapshot,sourceNameTokenId,legacy.tokensById),attributes:resource.attributes||[],fields:resource.fields||[]};
   styleBlocks.push(styleBlock);block.styleBlocks.push(styleBlock);resource.modelKind='StyleBlock';resource.modelId=styleBlock.logicalId;return;
  }
  const anonymous=!named;
  const logicalName=anonymous?resource.sourceKind+':'+resource.range.start:displayName;
  const logicalKey=block.logicalPath.join('\u001f')+'\u001f'+resource.type+'\u001f'+logicalName;
  const source=sourceFromResource(resource,snapshot,sourceNameTokenId,legacy.tokensById);
  let slot=slotByKey.get(logicalKey);
  if(!slot){
   const logicalId='slot:'+logicalHash(logicalKey);
   slot={kind:'Slot',logicalId,stableId:logicalId,name:displayName,type:resource.type,parentId:block.logicalId,logicalPath:block.logicalPath.concat(displayName),path:resource.path,source,conflicts:[],defaultValue:resource.defaultUrl,valueState:deriveValueState(resource.value??resource.url,resource.defaultUrl)};
   slotByKey.set(logicalKey,slot);slots.push(slot);block.slots.push(slot);
  } else {
   const conflict={source};slot.conflicts.push(conflict);diagnostics.push(diagnosticForDuplicate(slot,conflict,slot.conflicts.length));
  }
 });
 const defaultDeclarations=legacy.defaultDeclarations||[];
 stripMaps(root);
 return {kind:'BannerModel',logicalId:'banner:root',generation:legacy.generation,snapshot,range:{start:0,end:snapshot.length},rootBlock:root,blocks:collectBlocks(root),slots,styleBlocks,defaultDeclarations,diagnostics,tokensById:legacy.tokensById};
}
function collectBlocks(root){const result=[];const visit=block=>{block.blocks.forEach(child=>{result.push(child);visit(child)})};visit(root);return result}

export function sliceModelRange(model,range){if(!model||model.generation!==hashText(model.snapshot))throw new Error('BannerModel generation 已过期');if(!range||!Number.isInteger(range.start)||!Number.isInteger(range.end)||range.start<0||range.start>range.end||range.end>model.snapshot.length)throw new RangeError('无效 range');return model.snapshot.slice(range.start,range.end)}