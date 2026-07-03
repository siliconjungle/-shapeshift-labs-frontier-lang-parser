const ACTION_BODY_ROWS = new Set(['set', 'insert', 'remove', 'merge', 'callEffect', 'return', 'if', 'let']);

export function readActionSyntaxChildren(source, block, options) {
  const body = source.slice(block.bodyStartOffset, block.bodyEndOffset);
  const bodyBlocks = readNestedBodyBlocks('body', body);
  const state = { rowIndex: 0 };
  const children = [];
  for (const bodyBlock of bodyBlocks) {
    const bodyStartOffset = block.bodyStartOffset + bodyBlock.bodyStart;
    const bodyEndOffset = block.bodyStartOffset + bodyBlock.bodyEnd;
    children.push(...readActionSyntaxRows(source, block, options, state, bodyStartOffset, bodyEndOffset));
  }
  return children;
}

function readActionSyntaxRows(source, block, options, state, startOffset, endOffset, parentActionBodyId) {
  const children = [];
  let offset = startOffset;
  while (offset < endOffset) {
    offset = skipWhitespaceAndLineComments(source, offset, endOffset);
    if (offset >= endOffset) break;
    const ifHeader = /^if\b([^{\n]*)\{/.exec(source.slice(offset, endOffset));
    if (ifHeader) {
      const open = offset + ifHeader[0].length - 1;
      const close = findMatchingBrace(source, open);
      if (close < 0 || close > endOffset) break;
      const child = actionSyntaxChild(source, block, options, {
        text: source.slice(offset, open + 1).trim(),
        startOffset: offset,
        endOffset: open + 1
      }, state, parentActionBodyId);
      children.push(child);
      children.push(...readActionSyntaxRows(source, block, options, state, open + 1, close, child.id));
      offset = close + 1;
      continue;
    }
    const lineEnd = source.indexOf('\n', offset);
    const rawEnd = lineEnd < 0 || lineEnd > endOffset ? endOffset : lineEnd;
    const rawLine = source.slice(offset, rawEnd);
    const leading = /^\s*/.exec(rawLine)?.[0].length ?? 0;
    const trailing = /\s*$/.exec(rawLine)?.[0].length ?? 0;
    const line = {
      text: rawLine.trim(),
      startOffset: offset + leading,
      endOffset: Math.max(offset + leading, rawEnd - trailing)
    };
    if (line.text && line.text !== '}') children.push(actionSyntaxChild(source, block, options, line, state, parentActionBodyId));
    offset = rawEnd + 1;
  }
  return children;
}

function actionSyntaxChild(source, block, options, line, state, parentActionBodyId) {
  const rowIndex = state.rowIndex++;
  const row = /^([A-Za-z_$][\w$-]*)(?:\s+([A-Za-z_$@./:*+-][\w$./@:*+-]*))?(.*)$/.exec(line.text);
  const rowKind = row?.[1] ?? 'unknown';
  const name = actionRowName(rowKind, row?.[2], rowIndex);
  const rest = row?.[2]?.startsWith('@') ? ` ${row[2]}${row[3] ?? ''}` : (row?.[3] ?? '');
  const recognized = ACTION_BODY_ROWS.has(rowKind);
  return cleanRecord({
    kind: recognized ? 'actionBodyRow' : 'actionUnknownRow',
    rowKind,
    normalizedRowKind: recognized ? rowKind : 'unknown',
    name,
    id: idFrom(rest, `action_body_${safeId(rowKind)}_${safeId(name)}_${rowIndex}`),
    header: line.text,
    startOffset: line.startOffset,
    endOffset: line.endOffset,
    location: sourcePosition(source, line.startOffset),
    parentKind: block.kind,
    parentId: block.id,
    parentName: block.name,
    moduleId: block.moduleId,
    moduleName: block.moduleName,
    parentActionBodyId,
    sourceSpan: sourceSpan(source, block, line.startOffset, line.endOffset, options),
    recognized,
    reason: recognized ? undefined : 'unsupported-action-body-row'
  });
}

function actionRowName(rowKind, rawName, rowIndex) {
  if (rowKind === 'if') {
    return rawName && !rawName.startsWith('@') && /^[A-Za-z_$][\w$-]*$/.test(rawName) ? rawName : `${rowKind}_${rowIndex}`;
  }
  return rawName && !rawName.startsWith('@') ? rawName : `${rowKind}_${rowIndex}`;
}

function readNestedBodyBlocks(kind, source) {
  const blocks = [];
  const header = new RegExp('\\b' + kind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s+([^{}\\n]+?))?\\s*\\{', 'g');
  let match;
  while ((match = header.exec(source))) {
    const open = header.lastIndex - 1;
    const close = findMatchingBrace(source, open);
    if (close < 0) continue;
    blocks.push({
      header: (match[1] ?? '').trim(),
      start: match.index,
      bodyStart: open + 1,
      bodyEnd: close,
      end: close + 1
    });
    header.lastIndex = close + 1;
  }
  return blocks;
}

function skipWhitespaceAndLineComments(source, offset, endOffset) {
  let index = offset;
  while (index < endOffset) {
    while (index < endOffset && /\s/.test(source[index])) index++;
    if (source[index] !== '#') return index;
    const lineEnd = source.indexOf('\n', index);
    index = lineEnd < 0 || lineEnd > endOffset ? endOffset : lineEnd + 1;
  }
  return index;
}

function findMatchingBrace(source, open) {
  let depth = 0;
  let state = 'code';
  let quote = '';
  for (let index = open; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];
    if (state === 'line-comment') {
      if (char === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        index++;
        state = 'code';
      }
      continue;
    }
    if (state === 'string') {
      if (char === '\\') {
        index++;
        continue;
      }
      if (char === quote) {
        state = 'code';
        quote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      index++;
      state = 'line-comment';
      continue;
    }
    if (char === '/' && next === '*') {
      index++;
      state = 'block-comment';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      state = 'string';
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function sourcePosition(source, offset) {
  const lines = source.slice(0, offset).split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1, offset };
}

function sourceSpan(source, block, startOffset, endOffset, options = {}) {
  return cleanRecord({
    sourceId: options.documentId,
    path: options.sourcePath,
    blockId: block.id,
    blockKind: block.kind,
    startOffset,
    endOffset,
    start: sourcePosition(source, startOffset),
    end: sourcePosition(source, endOffset)
  });
}

function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function safeId(value) { return String(value).replace(/[^A-Za-z0-9_$-]+/g, '_').replace(/^_+|_+$/g, '') || 'row'; }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
