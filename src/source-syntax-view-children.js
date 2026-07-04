export function readViewSyntaxChildren(source, block, options = {}) {
  const children = [];
  const ranges = readRenderRanges(source.slice(block.bodyStartOffset, block.bodyEndOffset), block.bodyStartOffset);
  for (const line of readBodyLines(source, block.bodyStartOffset, block.bodyEndOffset)) {
    if (!line.text || line.text.startsWith('#') || inRange(line.startOffset, ranges)) continue;
    const child = viewRowChild(source, block, options, line);
    children.push(child ?? unknownViewChild(source, block, options, line, 'unsupported-view-row'));
  }
  for (const range of ranges) {
    children.push(renderHeaderChild(source, block, options, range));
    const nested = ranges.filter((candidate) => candidate.parentRenderId === range.id);
    for (const line of readBodyLines(source, range.bodyStartOffset, range.bodyEndOffset)) {
      if (!line.text || line.text.startsWith('#') || inRange(line.startOffset, nested)) continue;
      const child = renderRowChild(source, block, options, line, range);
      children.push(child ?? unknownViewChild(source, block, options, line, 'unsupported-view-render-row', range.id));
    }
  }
  return children;
}

function viewRowChild(source, block, options, line) {
  const reads = /^(reads?)\s+(.+)$/.exec(line.text);
  if (reads) return childRecord(source, block, options, line, { kind: 'viewRead', rowKind: reads[1], name: reads[2].trim(), id: `view_read_${safeId(block.name)}_${line.startOffset}`, values: readList(reads[2]) });
  const dispatch = /^(dispatch(?:es)?)\s+(.+)$/.exec(line.text);
  if (dispatch) return childRecord(source, block, options, line, { kind: 'viewDispatch', rowKind: dispatch[1], name: dispatch[2].trim(), id: `view_dispatch_${safeId(block.name)}_${line.startOffset}`, values: readList(dispatch[2]) });
  const prop = /^prop\s+([A-Za-z_$][\w$.-]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?\s*:\s*(.+)$/.exec(line.text);
  if (prop) return childRecord(source, block, options, line, { kind: 'viewProp', rowKind: 'prop', name: prop[1], id: prop[2] ?? `view_prop_${prop[1]}`, typeSource: prop[3].replace(/\s+optional\s*$/, '').trim(), optional: /\soptional\s*$/.test(prop[3]) || undefined });
  const event = /^event\s+([A-Za-z_$][\w$.-]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?(.*)$/.exec(line.text);
  if (event) return childRecord(source, block, options, line, { kind: 'viewEvent', rowKind: 'event', name: event[1], id: event[2] ?? `view_event_${event[1]}`, action: readInlineWord('action', event[3]), typeSource: readInlineType('input', event[3]) });
  return undefined;
}

function renderHeaderChild(source, block, options, range) {
  return childRecord(source, block, options, range, {
    kind: 'viewRender',
    rowKind: 'render',
    name: range.name,
    id: range.id,
    viewRenderKind: readInlineWord('kind', range.header) ?? 'element',
    parentRenderId: range.parentRenderId
  });
}

function renderRowChild(source, block, options, line, range) {
  const identity = /^(identity|key)\s+(.+)$/.exec(line.text);
  if (identity) return childRecord(source, block, options, line, { kind: 'viewRenderIdentity', rowKind: identity[1], name: identity[2].trim(), id: `${range.id}_${identity[1]}`, value: identity[2].trim(), parentRenderId: range.id });
  const text = /^text\s+(.+)$/.exec(line.text);
  if (text) return childRecord(source, block, options, line, { kind: 'viewRenderText', rowKind: 'text', name: 'text', id: `${range.id}_text`, ...readRenderValue(text[1]), parentRenderId: range.id });
  const attr = /^(component|tag|tagName|kind)\s+(.+)$/.exec(line.text);
  if (attr) return childRecord(source, block, options, line, { kind: 'viewRenderAttribute', rowKind: attr[1], name: attr[1], id: `${range.id}_${safeId(attr[1])}`, value: attr[2].trim(), parentRenderId: range.id });
  const prop = /^prop\s+([A-Za-z_$][\w$.-]*)\s+(.+)$/.exec(line.text);
  if (prop) return childRecord(source, block, options, line, { kind: 'viewRenderProp', rowKind: 'prop', name: prop[1], id: `${range.id}_prop_${safeId(prop[1])}`, ...readRenderValue(prop[2]), parentRenderId: range.id });
  const event = /^on\s+([A-Za-z_$][\w$.-]*)\s+([A-Za-z_$][\w$.-]*)/.exec(line.text);
  if (event) return childRecord(source, block, options, line, { kind: 'viewRenderEvent', rowKind: 'on', name: event[1], id: `${range.id}_on_${safeId(event[1])}`, action: event[2], parentRenderId: range.id });
  const child = /^(children?|child)\s+(.+)$/.exec(line.text);
  if (child) return childRecord(source, block, options, line, { kind: 'viewRenderChildren', rowKind: child[1], name: 'children', id: `${range.id}_children`, values: readList(child[2]), parentRenderId: range.id });
  return undefined;
}

function readRenderRanges(body, baseOffset, parentRenderId) {
  const ranges = [];
  for (const range of readTopLevelRenderRanges(body, baseOffset, parentRenderId)) {
    ranges.push(range, ...readRenderRanges(body.slice(range.bodyStartOffset - baseOffset, range.bodyEndOffset - baseOffset), range.bodyStartOffset, range.id));
  }
  return ranges;
}

function readTopLevelRenderRanges(body, baseOffset, parentRenderId) {
  const structure = scanStructure(body), ranges = [];
  const header = /(^|\n)\s*render\s+([^{}\n]+)\{/g;
  let match;
  while ((match = header.exec(body))) {
    const start = match.index + match[1].length + (/^\s*/.exec(body.slice(match.index + match[1].length))?.[0].length ?? 0);
    const open = header.lastIndex - 1;
    if (!structure.codeOffsets[start] || !structure.codeOffsets[open] || structure.depthBefore[start] !== 0) continue;
    const close = structure.bracePairs.get(open);
    if (close === undefined) continue;
    const headerText = (match[2] ?? '').trim(), name = nameFrom(headerText);
    ranges.push({ header: headerText, name, id: idFrom(headerText, `render_${name}`), startOffset: baseOffset + start, endOffset: baseOffset + close + 1, bodyStartOffset: baseOffset + open + 1, bodyEndOffset: baseOffset + close, parentRenderId });
    header.lastIndex = close + 1;
  }
  return ranges;
}

function childRecord(source, block, options, line, input) {
  return cleanRecord({
    ...input,
    normalizedRowKind: input.normalizedRowKind ?? input.rowKind,
    header: line.header ?? line.text ?? source.slice(line.startOffset, line.endOffset).trim(),
    startOffset: line.startOffset,
    endOffset: line.endOffset,
    location: sourcePosition(source, line.startOffset),
    parentKind: block.kind,
    parentId: block.id,
    parentName: block.name,
    moduleId: block.moduleId,
    moduleName: block.moduleName,
    sourceSpan: sourceSpan(source, block, line.startOffset, line.endOffset, options),
    recognized: input.recognized ?? true
  });
}

function unknownViewChild(source, block, options, line, reason, parentRenderId) {
  const rowKind = /^([A-Za-z_$][\w$-]*)\b/.exec(line.text)?.[1];
  return childRecord(source, block, options, line, { kind: 'viewUnknownRow', rowKind, normalizedRowKind: 'unknown', name: rowKind ?? 'unknown', id: `view_unknown_${safeId(rowKind ?? 'row')}_${line.startOffset}`, parentRenderId, recognized: false, reason });
}

function readBodyLines(source, startOffset, endOffset) {
  const lines = source.slice(startOffset, endOffset).split('\n');
  const records = [];
  let lineStart = startOffset;
  for (const rawLine of lines) {
    const rawEnd = lineStart + rawLine.length, leading = /^\s*/.exec(rawLine)?.[0].length ?? 0, trailing = /\s*$/.exec(rawLine)?.[0].length ?? 0;
    const start = lineStart + leading, end = Math.max(start, rawEnd - trailing);
    records.push({ text: rawLine.trim(), startOffset: start, endOffset: end });
    lineStart = rawEnd + 1;
  }
  return records;
}

function scanStructure(source) {
  const depthBefore = new Int32Array(source.length + 1), codeOffsets = new Uint8Array(source.length), stack = [], bracePairs = new Map();
  let depth = 0, state = 'code', quote = '';
  for (let index = 0; index < source.length; index++) {
    depthBefore[index] = depth;
    const char = source[index], next = source[index + 1];
    if (state === 'line-comment') { if (char === '\n') state = 'code'; continue; }
    if (state === 'block-comment') { if (char === '*' && next === '/') { index++; state = 'code'; } continue; }
    if (state === 'string') { if (char === '\\') { index++; continue; } if (char === quote) state = 'code'; continue; }
    codeOffsets[index] = 1;
    if (char === '#') { state = 'line-comment'; continue; }
    if (char === '"' || char === "'" || char === '`') { state = 'string'; quote = char; continue; }
    if (char === '/' && next === '*') { index++; state = 'block-comment'; continue; }
    if (char === '/' && next === '/') { index++; state = 'line-comment'; continue; }
    if (char === '{') { stack.push(index); depth++; continue; }
    if (char === '}') { const open = stack.pop(); if (open !== undefined) { depth = Math.max(0, depth - 1); bracePairs.set(open, index); } }
  }
  depthBefore[source.length] = depth;
  return { depthBefore, codeOffsets, bracePairs };
}

function inRange(offset, ranges) { return ranges.some((range) => offset >= range.startOffset && offset < range.endOffset); }
function readList(value) { return value.split(',').map((item) => item.trim()).filter(Boolean); }
function readInlineWord(label, text = '') { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineType(label, text = '') { return new RegExp('(?:^|\\s)' + label + '\\s+(.+)$').exec(text)?.[1]?.trim(); }
function readRenderValue(value) { const quoted = /^["']([^"']+)["']$/.exec(value.trim()); return quoted ? { value: quoted[1] } : { expression: value.trim() }; }
function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$.-]*)/.exec(header)?.[1] ?? 'Unnamed'; }
function sourcePosition(source, offset) { const lines = source.slice(0, offset).split('\n'); return { line: lines.length, column: lines[lines.length - 1].length + 1, offset }; }
function sourceSpan(source, block, startOffset, endOffset, options = {}) { return cleanRecord({ sourceId: options.documentId, path: options.sourcePath, blockId: block.id, blockKind: block.kind, startOffset, endOffset, start: sourcePosition(source, startOffset), end: sourcePosition(source, endOffset) }); }
function safeId(value) { return String(value).replace(/[^A-Za-z0-9_$-]+/g, '_').replace(/^_+|_+$/g, '') || 'row'; }
function cleanRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
