import { parseActionValue } from './action-expression.js';
import { readElseHeaderBlock } from './action-else-block.js';

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
      const elseBlock = readElseHeaderBlock(source, close + 1, endOffset, { skipWhitespace: skipWhitespaceAndLineComments, findMatchingBrace });
      if (elseBlock) {
        const elseChild = actionSyntaxChild(source, block, options, {
          text: source.slice(elseBlock.start, elseBlock.open + 1).trim(),
          startOffset: elseBlock.start,
          endOffset: elseBlock.open + 1
        }, state, child.id, { recognized: elseBlock.supported });
        children.push(elseChild);
        if (elseBlock.supported) children.push(...readActionSyntaxRows(source, block, options, state, elseBlock.open + 1, elseBlock.close, elseChild.id));
        offset = elseBlock.close + 1;
        continue;
      }
      offset = close + 1;
      continue;
    }
    const elseBlock = readElseHeaderBlock(source, offset, endOffset, { skipWhitespace: skipWhitespaceAndLineComments, findMatchingBrace });
    if (elseBlock) {
      children.push(actionSyntaxChild(source, block, options, {
        text: source.slice(elseBlock.start, elseBlock.open + 1).trim(),
        startOffset: elseBlock.start,
        endOffset: elseBlock.open + 1
      }, state, parentActionBodyId));
      offset = elseBlock.close + 1;
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

function actionSyntaxChild(source, block, options, line, state, parentActionBodyId, overrides = {}) {
  const rowIndex = state.rowIndex++;
  const row = /^([A-Za-z_$][\w$-]*)(?:\s+([A-Za-z_$@./:*+-][\w$./@:*+-]*))?(.*)$/.exec(line.text);
  const rowKind = row?.[1] ?? 'unknown';
  const name = actionRowName(rowKind, row?.[2], rowIndex);
  const rest = row?.[2]?.startsWith('@') ? ` ${row[2]}${row[3] ?? ''}` : (row?.[3] ?? '');
  const validation = validateActionRow(rowKind, row?.[2], rest, line.text);
  const recognized = overrides.recognized ?? (ACTION_BODY_ROWS.has(rowKind) && validation.ok);
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
    reason: recognized ? undefined : validation.reason
  });
}

function actionRowName(rowKind, rawName, rowIndex) {
  if (rowKind === 'if') {
    return rawName && !rawName.startsWith('@') && /^[A-Za-z_$][\w$-]*$/.test(rawName) ? rawName : `${rowKind}_${rowIndex}`;
  }
  return rawName && !rawName.startsWith('@') ? rawName : `${rowKind}_${rowIndex}`;
}

function validateActionRow(rowKind, rawName, rest, header) {
  if (!ACTION_BODY_ROWS.has(rowKind)) return { ok: false, reason: 'unsupported-action-body-row' };
  if (rowKind === 'if') return validateActionExpressionText(readIfCondition(header), { comparisonType: readInlineComparisonType(header), callType: readInlineCallType(header) });
  if (rowKind === 'set' || rowKind === 'insert' || rowKind === 'merge') {
    if (!readInlineWord('path', rest)) return { ok: false, reason: 'missing-action-path' };
    return validateActionExpressionText(readInlineValue('value', rest), { valueType: readInlineType(rest), comparisonType: readInlineComparisonType(rest), callType: readInlineCallType(rest) });
  }
  if (rowKind === 'remove') {
    return readInlineWord('path', rest) ? { ok: true } : { ok: false, reason: 'missing-action-path' };
  }
  if (rowKind === 'callEffect') {
    const input = readInlineValue('input', rest);
    return input ? validateActionExpressionText(input) : { ok: true };
  }
  if (rowKind === 'return') {
    const details = readReturnDetails(rawName, rest);
    if (!details.valueText) return { ok: true };
    const parsed = parseActionValue(details.valueText, details);
    if (parsed.ok) return { ok: true };
    if (isActionExpressionAdmissionReason(parsed.reason)) return { ok: false, reason: parsed.reason };
    return { ok: false, reason: 'unsupported-action-return-value' };
  }
  if (rowKind === 'let') {
    if (!rawName || rawName.startsWith('@') || !/^[A-Za-z_$][\w$-]*$/.test(rawName)) {
      return { ok: false, reason: 'unsupported-action-binding-name' };
    }
    const value = readInlineValue('value', rest);
    const parsed = value ? parseActionValue(value, { valueType: readInlineType(rest), comparisonType: readInlineComparisonType(rest), callType: readInlineCallType(rest) }) : undefined;
    if (parsed?.ok) return { ok: true };
    if (parsed?.reason === 'missing-action-expression-type' || parsed?.reason === 'unsupported-action-expression-type' || parsed?.reason === 'missing-action-comparison-type' || parsed?.reason === 'unsupported-action-comparison-type' || parsed?.reason === 'missing-action-call-type' || parsed?.reason === 'unsupported-action-call-type' || parsed?.reason === 'unsupported-action-call-callee' || parsed?.reason === 'unsupported-action-call-argument') {
      return { ok: false, reason: parsed.reason };
    }
    return { ok: false, reason: 'unsupported-action-binding-value' };
  }
  return { ok: true };
}

function readInlineValue(label, text) {
  return new RegExp('(?:^|\\s)' + label + '\\s+(.+?)(?=\\s+[A-Za-z_$][\\w$-]*\\s+|$)').exec(text)?.[1]?.trim();
}

function readInlineWord(label, text) {
  return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim();
}

function readInlineType(text) {
  return readInlineWord('type', text) ?? readInlineWord('valueType', text);
}

function readInlineComparisonType(text) {
  return readInlineWord('compare', text) ?? readInlineWord('comparisonType', text) ?? readInlineWord('compareType', text);
}

function readInlineCallType(text) {
  return readInlineWord('call', text) ?? readInlineWord('callType', text);
}

function readIfCondition(header) {
  const text = header.replace(/^if\b/, '').replace(/\{\s*$/, '').replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim();
  const explicit = /\bcondition\s+(.+)$/.exec(text);
  return explicit ? explicit[1].trim() : text;
}

function readReturnDetails(rawName, rest) {
  const text = stripIds(rawName?.startsWith('@') ? rest : `${rawName ?? ''}${rest ?? ''}`).trim();
  const explicitValue = /\bvalue\s+/.test(text);
  return {
    valueText: explicitValue ? readInlineValue('value', text) : text,
    valueType: readInlineType(text),
    comparisonType: readInlineComparisonType(text),
    callType: readInlineCallType(text)
  };
}

function stripIds(text) {
  return String(text ?? '').replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim();
}

function validateActionExpressionText(text, options = {}) {
  const parsed = parseActionValue(text, options);
  return parsed.ok ? { ok: true } : { ok: false, reason: parsed.reason };
}

function isActionExpressionAdmissionReason(reason) {
  return reason === 'missing-action-expression-type'
    || reason === 'unsupported-action-expression-type'
    || reason === 'missing-action-comparison-type'
    || reason === 'unsupported-action-comparison-type'
    || reason === 'missing-action-call-type'
    || reason === 'unsupported-action-call-type'
    || reason === 'unsupported-action-call-callee'
    || reason === 'unsupported-action-call-argument'
    || reason === 'unsupported-action-expression-ref'
    || reason === 'malformed-action-expression'
    || reason === 'missing-action-expression';
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
