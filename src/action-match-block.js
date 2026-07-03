import { readActionValue } from './action-expression.js';
import { findActionMatchingBrace, skipActionWhitespaceAndComments } from './action-source-blocks.js';

export function readMatchHeaderBlock(source, offset, endOffset, helpers = {}) {
  const match = /^match\b([^{\n]*)\{/.exec(source.slice(offset, endOffset));
  if (!match) return undefined;
  const open = offset + match[0].length - 1;
  const findBrace = helpers.findMatchingBrace ?? findActionMatchingBrace;
  const close = findBrace(source, open);
  if (close < 0 || close > endOffset) return undefined;
  return {
    start: offset,
    header: match[1].trim(),
    open,
    close,
    body: source.slice(open + 1, close),
    end: close + 1
  };
}

export function readMatchBranchBlock(source, offset, endOffset, helpers = {}) {
  const start = (helpers.skipWhitespace ?? skipActionWhitespaceAndComments)(source, offset, endOffset);
  const match = /^(case|default)\b([^{\n]*)\{/.exec(source.slice(start, endOffset));
  if (!match) return undefined;
  const open = start + match[0].length - 1;
  const close = (helpers.findMatchingBrace ?? findActionMatchingBrace)(source, open);
  if (close < 0 || close > endOffset) return undefined;
  return {
    kind: match[1],
    start,
    header: match[2].trim(),
    open,
    close,
    body: source.slice(open + 1, close),
    end: close + 1
  };
}

export function readMatchBranchBlocks(source, startOffset, endOffset, helpers = {}) {
  const branches = [];
  let offset = startOffset;
  while (offset < endOffset) {
    const branch = readMatchBranchBlock(source, offset, endOffset, helpers);
    if (branch) {
      branches.push(branch);
      offset = branch.end;
      continue;
    }
    const lineEnd = source.indexOf('\n', offset);
    offset = lineEnd < 0 || lineEnd > endOffset ? endOffset : lineEnd + 1;
  }
  return branches;
}

export function readActionMatchHeader(header, index) {
  const text = cleanHeader(header, 'match');
  const valueText = readInlineValue('value', text);
  const valueType = readInlineType(text);
  const comparisonType = readInlineComparisonType(text);
  const callType = readInlineCallType(text);
  const value = valueText ? readActionValue(valueText, { valueType, comparisonType, callType }) : undefined;
  return cleanRecord({
    id: idFrom(header, `action_body_match_${firstIdentifier(beforeLabel(text, 'value')) ?? index}`),
    name: firstIdentifier(beforeLabel(text, 'value')) ?? `match_${index}`,
    valueType,
    comparisonType,
    callType,
    value,
    valueText
  });
}

export function readActionMatchCaseHeader(header, index) {
  const text = cleanHeader(header, 'case');
  const valueText = readInlineValue('value', text);
  const value = valueText ? readActionValue(valueText) : undefined;
  return cleanRecord({
    id: idFrom(header, `action_body_case_${firstIdentifier(beforeLabel(text, 'value')) ?? index}`),
    name: firstIdentifier(beforeLabel(text, 'value')) ?? `case_${index}`,
    value,
    valueText
  });
}

export function readActionMatchDefaultHeader(header, index) {
  const text = cleanHeader(header, 'default');
  return {
    id: idFrom(header, `action_body_default_${firstIdentifier(text) ?? index}`),
    name: firstIdentifier(text) ?? `default_${index}`
  };
}

export function validateActionMatchHeader(header) {
  const details = readActionMatchHeader(header, 0);
  return details.value ? { ok: true } : { ok: false, reason: 'missing-action-match-value' };
}

export function validateActionMatchBranchHeader(rowKind, header) {
  if (rowKind === 'default') return { ok: true };
  if (rowKind !== 'case') return { ok: false, reason: 'unsupported-action-match-branch' };
  const details = readActionMatchCaseHeader(header, 0);
  if (!details.value) return { ok: false, reason: 'missing-action-match-case-value' };
  if (!Object.prototype.hasOwnProperty.call(details.value, 'value')) {
    return { ok: false, reason: 'unsupported-action-match-case-value' };
  }
  return { ok: true };
}

function cleanHeader(header, keyword) {
  return stripIds(String(header ?? '').replace(new RegExp('^' + keyword + '\\b'), '').replace(/\{\s*$/, '')).trim();
}

function beforeLabel(text, label) {
  const index = text.search(new RegExp('(?:^|\\s)' + label + '\\s+'));
  return index < 0 ? text : text.slice(0, index).trim();
}

function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function readInlineType(text) { return readInlineWord('type', text) ?? readInlineWord('valueType', text); }
function readInlineComparisonType(text) { return readInlineWord('compare', text) ?? readInlineWord('comparisonType', text) ?? readInlineWord('compareType', text); }
function readInlineCallType(text) { return readInlineWord('call', text) ?? readInlineWord('callType', text); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineValue(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+(.+?)(?=\\s+[A-Za-z_$][\\w$-]*\\s+|$)').exec(text)?.[1]?.trim(); }
function stripIds(text) { return String(text ?? '').replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim(); }
function firstIdentifier(text) { return /^([A-Za-z_$][\w$-]*)\b/.exec(text)?.[1]; }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
