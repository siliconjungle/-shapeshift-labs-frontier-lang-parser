import { splitTopLevelCommaList } from './type-variants.js';

export function parseOptionalTypeExpression(value) {
  return value ? parseTypeExpression(value.trim()) : undefined;
}

export function parseTypeExpression(value) {
  const text = value.trim();
  const application = readTypeApplication(text);
  if (!application) return text;
  const args = splitTopLevelCommaList(application.body);
  if (args.some((arg) => !arg)) return text;
  const parsedArgs = args.map(parseTypeExpression);
  if (application.name === 'Set' && parsedArgs.length === 1) return { kind: 'set', item: parsedArgs[0] };
  if (application.name === 'List' && parsedArgs.length === 1) return { kind: 'list', item: parsedArgs[0] };
  if (application.name === 'Map' && parsedArgs.length === 2) return { kind: 'map', key: parsedArgs[0], value: parsedArgs[1] };
  if (application.name === 'Record') return readRecordTypeExpression(application.body) ?? { kind: 'ref', name: application.name, args: parsedArgs };
  if (application.name === 'Union') return readUnionTypeExpression(application.body) ?? { kind: 'ref', name: application.name, args: parsedArgs };
  return { kind: 'ref', name: application.name, args: parsedArgs };
}

function readTypeApplication(text) {
  const match = /^([A-Za-z_$][\w$]*)</.exec(text);
  if (!match || !text.endsWith('>')) return undefined;
  let depth = 0;
  for (let index = match[1].length; index < text.length; index++) {
    const char = text[index];
    if (char === '<') depth++;
    if (char === '>') depth--;
    if (depth < 0) return undefined;
    if (depth === 0 && index !== text.length - 1) return undefined;
  }
  if (depth !== 0) return undefined;
  return { name: match[1], body: text.slice(match[1].length + 1, -1).trim() };
}

function readRecordTypeExpression(body) {
  const fields = [];
  for (const source of splitTopLevelCommaList(body)) {
    const field = readInlineTypeField(source, 'record_field');
    if (!field) return undefined;
    fields.push(field);
  }
  return fields.length ? { kind: 'record', fields } : undefined;
}

function readUnionTypeExpression(body) {
  const variants = [];
  for (const source of splitTopLevelCommaList(body)) {
    const variant = readInlineTypeVariant(source);
    if (!variant) return undefined;
    variants.push(variant);
  }
  return variants.length ? { kind: 'union', variants } : undefined;
}

function readInlineTypeVariant(source) {
  const match = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?(?:\((.*)\))?\s*$/.exec(source);
  if (!match) return undefined;
  const payload = match[3]?.trim();
  const fields = [];
  if (payload) {
    for (const fieldSource of splitTopLevelCommaList(payload)) {
      const field = readInlineTypeField(fieldSource, `variant_field_${match[1]}`);
      if (!field) return undefined;
      fields.push(field);
    }
  }
  return {
    ...(match[2] ? { id: match[2] } : {}),
    name: match[1],
    ...(fields.length ? { fields } : {})
  };
}

function readInlineTypeField(source, idPrefix) {
  const match = /^\s*([A-Za-z_$][\w$]*)(\?)?(?:\s+@id\(\s*["']([^"']+)["']\s*\))?(\?)?\s*:\s*(.+)\s*$/.exec(source);
  if (!match || !match[5].trim()) return undefined;
  const optional = Boolean(match[2] || match[4]);
  return {
    id: match[3] ?? `${idPrefix}_${match[1]}`,
    name: match[1],
    type: parseTypeExpression(match[5].trim()),
    ...(optional ? { optional: true } : {})
  };
}
