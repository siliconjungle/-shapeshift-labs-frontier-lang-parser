import { parseActionValue } from './action-expression.js';
import { readElseHeaderBlock } from './action-else-block.js';
import { readForInHeaderBlock, validateActionForInHeader } from './action-for-in-block.js';
import { readRepeatHeaderBlock, validateActionRepeatHeader } from './action-repeat-block.js';
import { findActionMatchingBrace, readActionNestedBlocks, skipActionWhitespaceAndComments } from './action-source-blocks.js';
import { readMatchBranchBlock, readMatchHeaderBlock, validateActionMatchBranchHeader, validateActionMatchHeader } from './action-match-block.js';

const ACTION_BODY_ROWS = new Set(['set', 'insert', 'remove', 'merge', 'callEffect', 'return', 'if', 'let', 'match', 'for', 'repeat']);

export function readActionSyntaxChildren(source, block, options) {
  const body = source.slice(block.bodyStartOffset, block.bodyEndOffset);
  const bodyBlocks = readActionNestedBlocks('body', body);
  const state = { rowIndex: 0, rowKinds: new Map() };
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
    offset = skipActionWhitespaceAndComments(source, offset, endOffset);
    if (offset >= endOffset) break;
    const repeatBlock = readRepeatHeaderBlock(source, offset, endOffset);
    if (repeatBlock) {
      const child = actionSyntaxChild(source, block, options, { text: source.slice(offset, repeatBlock.open + 1).trim(), startOffset: offset, endOffset: repeatBlock.open + 1 }, state, parentActionBodyId);
      children.push(child);
      if (child.recognized) children.push(...readActionSyntaxRows(source, block, options, state, repeatBlock.open + 1, repeatBlock.close, child.id));
      offset = repeatBlock.end;
      continue;
    }
    const forBlock = readForInHeaderBlock(source, offset, endOffset);
    if (forBlock) {
      const child = actionSyntaxChild(source, block, options, { text: source.slice(offset, forBlock.open + 1).trim(), startOffset: offset, endOffset: forBlock.open + 1 }, state, parentActionBodyId);
      children.push(child);
      if (child.recognized) children.push(...readActionSyntaxRows(source, block, options, state, forBlock.open + 1, forBlock.close, child.id));
      offset = forBlock.end;
      continue;
    }
    const matchBlock = readMatchHeaderBlock(source, offset, endOffset);
    if (matchBlock) {
      const child = actionSyntaxChild(source, block, options, { text: source.slice(offset, matchBlock.open + 1).trim(), startOffset: offset, endOffset: matchBlock.open + 1 }, state, parentActionBodyId);
      children.push(child);
      if (child.recognized) children.push(...readActionSyntaxRows(source, block, options, state, matchBlock.open + 1, matchBlock.close, child.id));
      offset = matchBlock.end;
      continue;
    }
    const ifHeader = /^if\b([^{\n]*)\{/.exec(source.slice(offset, endOffset));
    if (ifHeader) {
      const open = offset + ifHeader[0].length - 1;
      const close = findActionMatchingBrace(source, open);
      if (close < 0 || close > endOffset) break;
      const child = actionSyntaxChild(source, block, options, {
        text: source.slice(offset, open + 1).trim(),
        startOffset: offset,
        endOffset: open + 1
      }, state, parentActionBodyId);
      children.push(child);
      children.push(...readActionSyntaxRows(source, block, options, state, open + 1, close, child.id));
      const elseBlock = readElseHeaderBlock(source, close + 1, endOffset, { skipWhitespace: skipActionWhitespaceAndComments, findMatchingBrace: findActionMatchingBrace });
      if (elseBlock) {
        let branch = elseBlock, parentId = child.id;
        while (branch) {
          const elseChild = actionSyntaxChild(source, block, options, { text: source.slice(branch.start, branch.open + 1).trim(), startOffset: branch.start, endOffset: branch.open + 1 }, state, parentId, { recognized: branch.supported });
          children.push(elseChild);
          if (branch.supported) children.push(...readActionSyntaxRows(source, block, options, state, branch.open + 1, branch.close, elseChild.id));
          parentId = elseChild.id;
          branch = branch.tail;
        }
        offset = elseBlock.end;
        continue;
      }
      offset = close + 1;
      continue;
    }
    const branchBlock = readMatchBranchBlock(source, offset, endOffset);
    if (branchBlock) {
      const parentKind = state.rowKinds.get(parentActionBodyId);
      const validation = parentKind === 'match'
        ? validateActionMatchBranchHeader(branchBlock.kind, source.slice(branchBlock.start, branchBlock.open + 1).trim())
        : { ok: false, reason: 'unsupported-action-body-row' };
      const child = actionSyntaxChild(source, block, options, { text: source.slice(branchBlock.start, branchBlock.open + 1).trim(), startOffset: branchBlock.start, endOffset: branchBlock.open + 1 }, state, parentActionBodyId, { recognized: validation.ok, reason: validation.reason });
      children.push(child);
      if (child.recognized) children.push(...readActionSyntaxRows(source, block, options, state, branchBlock.open + 1, branchBlock.close, child.id));
      offset = branchBlock.end;
      continue;
    }
    const elseBlock = readElseHeaderBlock(source, offset, endOffset, { skipWhitespace: skipActionWhitespaceAndComments, findMatchingBrace: findActionMatchingBrace });
    if (elseBlock) {
      children.push(actionSyntaxChild(source, block, options, {
        text: source.slice(elseBlock.start, elseBlock.open + 1).trim(),
        startOffset: elseBlock.start,
        endOffset: elseBlock.open + 1
      }, state, parentActionBodyId));
      offset = elseBlock.end;
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
  const child = cleanRecord({
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
    reason: recognized ? undefined : overrides.reason ?? validation.reason
  });
  state.rowKinds?.set(child.id, child.rowKind);
  return child;
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
  if (rowKind === 'match') return validateActionMatchHeader(header);
  if (rowKind === 'for') return validateActionForInHeader(header);
  if (rowKind === 'repeat') return validateActionRepeatHeader(header);
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
