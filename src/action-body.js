import { readFrontierNestedBlocks } from './source-syntax-report.js';

export function readActionBodyRecords(body) {
  const records = [];
  for (const bodyBlock of readFrontierNestedBlocks('body', body)) {
    for (const rawLine of bodyBlock.body.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const record = parseActionBodyLine(line, records.length);
      if (record) records.push(record);
    }
  }
  return records;
}

export function stripNestedBlocks(kind, source) {
  let text = source;
  for (const block of readFrontierNestedBlocks(kind, source).reverse()) text = text.slice(0, block.start) + text.slice(block.end);
  return text;
}

function parseActionBodyLine(line, index) {
  const statement = /^([A-Za-z_$][\w$-]*)(?:\s+([A-Za-z_$@./:*+-][\w$./@:*+-]*))?(.*)$/.exec(line);
  if (!statement) return undefined;
  const [, rowKind, rawName, rawRest] = statement;
  const name = rawName && !rawName.startsWith('@') ? rawName : `${rowKind}_${index}`;
  const rest = rawName?.startsWith('@') ? ` ${rawName}${rawRest ?? ''}` : (rawRest ?? '');
  if (rowKind === 'set' || rowKind === 'insert' || rowKind === 'merge') {
    return compactRecord({ kind: 'patch', op: rowKind, id: idFrom(rest, `action_body_${rowKind}_${name}`), name, path: readInlineWord('path', rest), value: readInlineActionValue('value', rest) });
  }
  if (rowKind === 'remove') {
    return compactRecord({ kind: 'patch', op: 'remove', id: idFrom(rest, `action_body_remove_${name}`), name, path: readInlineWord('path', rest) });
  }
  if (rowKind === 'callEffect') {
    return compactRecord({ kind: 'callEffect', id: idFrom(rest, `action_body_callEffect_${name}`), name, capability: readInlineWord('capability', rest) ?? readInlineWord('effect', rest) ?? name, input: readInlineActionValue('input', rest) });
  }
  if (rowKind === 'return') {
    const valueText = rawName?.startsWith('@') ? rest.trim() : `${rawName ?? ''}${rest ?? ''}`.trim();
    return compactRecord({ kind: 'return', id: idFrom(rest, `action_body_return_${index}`), value: valueText ? readActionValue(valueText) : undefined });
  }
  return undefined;
}

function readInlineActionValue(label, text) {
  const value = new RegExp('(?:^|\\s)' + label + '\\s+(.+?)(?=\\s+[A-Za-z_$][\\w$-]*\\s+|$)').exec(text)?.[1]?.trim();
  return value ? readActionValue(value) : undefined;
}

function readActionValue(value) {
  const text = value.trim();
  const quoted = /^["']([^"']*)["']$/.exec(text);
  if (quoted) return { value: quoted[1] };
  if (text === 'true') return { value: true };
  if (text === 'false') return { value: false };
  if (text === 'null') return { value: null };
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return { value: Number(text) };
  return { expression: text };
}

function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
