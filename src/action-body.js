import { readFrontierNestedBlocks } from './source-syntax-report.js';
import { readActionValue } from './action-expression.js';
import { readElseHeaderBlock } from './action-else-block.js';
import { readActionForInHeader, readForInHeaderBlock, validateActionForInHeader } from './action-for-in-block.js';
import { findActionMatchingBrace, skipActionWhitespaceAndComments } from './action-source-blocks.js';
import {
  readActionMatchCaseHeader,
  readActionMatchDefaultHeader,
  readActionMatchHeader,
  readMatchBranchBlock,
  readMatchBranchBlocks,
  readMatchHeaderBlock,
  validateActionMatchBranchHeader
} from './action-match-block.js';

export function readActionBodyRecords(body) {
  const records = [];
  const state = { index: 0 };
  for (const bodyBlock of readFrontierNestedBlocks('body', body)) {
    records.push(...parseActionBodyRecords(bodyBlock.body, state));
  }
  return records;
}

export function stripNestedBlocks(kind, source) {
  let text = source;
  for (const block of readFrontierNestedBlocks(kind, source).reverse()) text = text.slice(0, block.start) + text.slice(block.end);
  return text;
}

function parseActionBodyRecords(source, state) {
  const records = [];
  let offset = 0;
  while (offset < source.length) {
    offset = skipActionWhitespaceAndComments(source, offset);
    if (offset >= source.length) break;
    const forBlock = readForInHeaderBlock(source, offset, source.length);
    if (forBlock) {
      const record = parseActionForInBlock(forBlock.header, forBlock.body, state.index++, state);
      if (record) records.push(record);
      offset = forBlock.end;
      continue;
    }
    const matchBlock = readMatchHeaderBlock(source, offset, source.length);
    if (matchBlock) {
      const record = parseActionMatchBlock(matchBlock.header, matchBlock.body, state.index++, state);
      if (record) records.push(record);
      offset = matchBlock.end;
      continue;
    }
    const ifHeader = /^if\b([^{\n]*)\{/.exec(source.slice(offset));
    if (ifHeader) {
      const open = offset + ifHeader[0].length - 1;
      const close = findActionMatchingBrace(source, open);
      if (close < 0) break;
      const elseBlock = readElseHeaderBlock(source, close + 1, source.length, { skipWhitespace: skipActionWhitespaceAndComments, findMatchingBrace: findActionMatchingBrace });
      const index = state.index++;
      const record = parseActionIfBlock(ifHeader[1].trim(), source.slice(open + 1, close), index, state, elseBlock);
      if (record) records.push(record);
      offset = elseBlock ? elseBlock.end : close + 1;
      continue;
    }
    const branchBlock = readMatchBranchBlock(source, offset, source.length);
    const elseBlock = readElseHeaderBlock(source, offset, source.length, { skipWhitespace: skipActionWhitespaceAndComments, findMatchingBrace: findActionMatchingBrace });
    if (branchBlock || elseBlock) {
      offset = branchBlock?.end ?? elseBlock.end;
      continue;
    }
    const lineEnd = source.indexOf('\n', offset);
    const end = lineEnd < 0 ? source.length : lineEnd;
    const line = source.slice(offset, end).trim();
    if (line && line !== '}') {
      const record = parseActionBodyLine(line, state.index++);
      if (record) records.push(record);
    }
    offset = end + 1;
  }
  return records;
}

function parseActionForInBlock(header, body, index, state) {
  const validation = validateActionForInHeader(header);
  if (!validation.ok) return undefined;
  const details = readActionForInHeader(header, index);
  return compactRecord({
    kind: 'forIn',
    id: details.id,
    name: details.name,
    itemName: details.itemName,
    collection: details.collection,
    body: parseActionBodyRecords(body, state)
  });
}

function parseActionMatchBlock(header, body, index, state) {
  const details = readActionMatchHeader(header, index);
  if (!details.value) return undefined;
  const branches = readMatchBranchBlocks(body, 0, body.length);
  const cases = [];
  let defaultRecord;
  for (const branch of branches) {
    const branchIndex = state.index++;
    if (branch.kind === 'case') {
      const validation = validateActionMatchBranchHeader('case', branch.header);
      const caseDetails = readActionMatchCaseHeader(branch.header, branchIndex);
      const { valueText: _valueText, ...caseRecord } = caseDetails;
      if (validation.ok) cases.push({ ...caseRecord, body: parseActionBodyRecords(branch.body, state) });
      continue;
    }
    if (!defaultRecord) {
      const defaultDetails = readActionMatchDefaultHeader(branch.header, branchIndex);
      defaultRecord = { ...defaultDetails, body: parseActionBodyRecords(branch.body, state) };
    }
  }
  if (!cases.length) return undefined;
  return compactRecord({
    kind: 'match',
    id: details.id,
    name: details.name,
    valueType: details.valueType,
    comparisonType: details.comparisonType,
    callType: details.callType,
    value: details.value,
    cases,
    defaultId: defaultRecord?.id,
    defaultName: defaultRecord?.name,
    defaultBody: defaultRecord?.body
  });
}

function parseActionIfBlock(header, body, index, state, elseBlock) {
  const details = parseActionIfHeader(header, index);
  if (!details.condition) return undefined;
  const elseDetails = parseActionElseBlock(elseBlock, state, index);
  return compactRecord({
    kind: 'if',
    id: details.id,
    name: details.name,
    comparisonType: details.comparisonType,
    callType: details.callType,
    condition: details.condition,
    body: parseActionBodyRecords(body, state),
    elseId: elseDetails?.id,
    elseName: elseDetails?.name,
    elseBody: elseDetails?.body
  });
}

function parseActionElseBlock(elseBlock, state, index) {
  if (!elseBlock) return undefined;
  if (elseBlock.isElseIf) {
    const nested = parseActionIfBlock(elseBlock.header, elseBlock.body, state.index++, state, elseBlock.tail);
    return nested ? { id: nested.id, name: nested.name, body: [nested] } : undefined;
  }
  const details = parseActionElseHeader(elseBlock.header, index);
  return { ...details, body: parseActionBodyRecords(elseBlock.body, state) };
}

function parseActionIfHeader(header, index) {
  const withoutId = header.replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim();
  const explicitCondition = /\bcondition\s+(.+)$/.exec(withoutId);
  const nameText = explicitCondition ? withoutId.slice(0, explicitCondition.index).trim() : '';
  const name = firstIdentifier(nameText) ?? `if_${index}`;
  const conditionText = explicitCondition?.[1]?.trim() || withoutId;
  const comparisonType = readInlineComparisonType(header);
  const callType = readInlineCallType(header);
  return {
    id: idFrom(header, `action_body_if_${name}`),
    name,
    comparisonType,
    callType,
    condition: conditionText ? readActionValue(conditionText, { comparisonType, callType }) : undefined
  };
}

function parseActionElseHeader(header, index) {
  const withoutId = header.replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim();
  const name = firstIdentifier(withoutId) ?? `else_${index}`;
  return {
    id: idFrom(header, `action_body_else_${name}`),
    name
  };
}

function parseActionBodyLine(line, index) {
  const statement = /^([A-Za-z_$][\w$-]*)(?:\s+([A-Za-z_$@./:*+-][\w$./@:*+-]*))?(.*)$/.exec(line);
  if (!statement) return undefined;
  const [, rowKind, rawName, rawRest] = statement;
  const name = rawName && !rawName.startsWith('@') ? rawName : `${rowKind}_${index}`;
  const rest = rawName?.startsWith('@') ? ` ${rawName}${rawRest ?? ''}` : (rawRest ?? '');
  if (rowKind === 'set' || rowKind === 'insert' || rowKind === 'merge') {
    const path = readInlineWord('path', rest);
    const valueType = readInlineType(rest);
    const comparisonType = readInlineComparisonType(rest);
    const callType = readInlineCallType(rest);
    const value = readInlineActionValue('value', rest, { valueType, comparisonType, callType });
    if (!path || !value) return undefined;
    return compactRecord({ kind: 'patch', op: rowKind, id: idFrom(rest, `action_body_${rowKind}_${name}`), name, path, valueType, comparisonType, callType, value });
  }
  if (rowKind === 'remove') {
    const path = readInlineWord('path', rest);
    if (!path) return undefined;
    return compactRecord({ kind: 'patch', op: 'remove', id: idFrom(rest, `action_body_remove_${name}`), name, path });
  }
  if (rowKind === 'callEffect') {
    const inputText = readInlineValue('input', rest);
    const input = inputText ? readActionValue(inputText) : undefined;
    if (inputText && !input) return undefined;
    return compactRecord({ kind: 'callEffect', id: idFrom(rest, `action_body_callEffect_${name}`), name, capability: readInlineWord('capability', rest) ?? readInlineWord('effect', rest) ?? name, input });
  }
  if (rowKind === 'let') {
    const valueType = readInlineType(rest);
    const comparisonType = readInlineComparisonType(rest);
    const callType = readInlineCallType(rest);
    const value = readInlineActionBindingValue('value', rest, { valueType, comparisonType, callType });
    if (!rawName || rawName.startsWith('@') || !isActionBindingName(name) || !value) return undefined;
    return compactRecord({ kind: 'let', id: idFrom(rest, `action_body_let_${name}`), name, valueType, comparisonType, callType, value });
  }
  if (rowKind === 'return') {
    const details = readReturnDetails(rawName, rest);
    const value = details.valueText ? readActionValue(details.valueText, details) : undefined;
    if (details.valueText && !value) return undefined;
    return compactRecord({
      kind: 'return',
      id: idFrom(rest, `action_body_return_${index}`),
      valueType: details.valueType,
      comparisonType: details.comparisonType,
      callType: details.callType,
      value
    });
  }
  return undefined;
}

function readReturnDetails(rawName, rest) {
  const text = stripIds(rawName?.startsWith('@') ? rest : `${rawName ?? ''}${rest ?? ''}`).trim();
  const explicitValue = /\bvalue\s+/.test(text);
  const valueType = readInlineType(text);
  const comparisonType = readInlineComparisonType(text);
  const callType = readInlineCallType(text);
  const valueText = explicitValue ? readInlineValue('value', text) : text;
  return {
    valueText,
    valueType,
    comparisonType,
    callType
  };
}

function readInlineActionValue(label, text, options = {}) {
  const value = readInlineValue(label, text);
  return value ? readActionValue(value, options) : undefined;
}

function readInlineActionBindingValue(label, text, options = {}) {
  const value = readInlineActionValue(label, text, options);
  return value ?? undefined;
}

function isActionBindingName(value) {
  return /^[A-Za-z_$][\w$-]*$/.test(String(value ?? ''));
}

function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function readInlineType(text) { return readInlineWord('type', text) ?? readInlineWord('valueType', text); }
function readInlineComparisonType(text) { return readInlineWord('compare', text) ?? readInlineWord('comparisonType', text) ?? readInlineWord('compareType', text); }
function readInlineCallType(text) { return readInlineWord('call', text) ?? readInlineWord('callType', text); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineValue(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+(.+?)(?=\\s+[A-Za-z_$][\\w$-]*\\s+|$)').exec(text)?.[1]?.trim(); }
function stripIds(text) { return String(text ?? '').replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim(); }
function firstIdentifier(text) { return /^([A-Za-z_$][\w$-]*)\b/.exec(text)?.[1]; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
