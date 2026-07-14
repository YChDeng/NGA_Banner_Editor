function bindingFromEntry(entry, index, occurrence) {
  const source = entry.source;
  const resource = source && source.resource;
  if (!resource) throw new TypeError('BannerModel source.resource is missing');
  return Object.assign({}, resource, {
    id: 'r' + index,
    logicalId: entry.node.logicalId,
    modelId: entry.node.logicalId,
    modelKind: entry.node.kind,
    stableId: entry.node.logicalId + (occurrence ? ':conflict:' + occurrence : ''),
    sourceId: source.id,
    sourceKind: source.sourceKind || resource.sourceKind,
    range: source.range,
    line: source.line,
    nameTokenId: source.nameTokenId,
    pairedNameTokenId: source.pairedNameTokenId,
    nameToken: source.nameToken,
    pairedNameToken: source.pairedNameToken,
    contentFingerprint: source.contentFingerprint,
    isConflict: entry.isConflict,
    modelSource: source
  });
}

export function deriveResourceBindings(model) {
  const entries = [];
  model.slots.forEach(function (slot) {
    entries.push({ node: slot, source: slot.source, isConflict: false });
    slot.conflicts.forEach(function (conflict) {
      entries.push({ node: slot, source: conflict.source, isConflict: true });
    });
  });
  model.styleBlocks.forEach(function (styleBlock) {
    entries.push({ node: styleBlock, source: styleBlock.source, isConflict: false });
  });
  entries.sort(function (a, b) {
    return a.source.range.start - b.source.range.start || a.source.range.end - b.source.range.end;
  });
  const occurrenceByNode = new Map();
  return entries.map(function (entry, index) {
    const occurrence = occurrenceByNode.get(entry.node.logicalId) || 0;
    occurrenceByNode.set(entry.node.logicalId, occurrence + 1);
    return bindingFromEntry(entry, index, occurrence);
  });
}
