import { splitTopLevelCommaList } from './type-variants.js';

export function parseOptionalTypeExpression(value) {
  return value ? parseTypeExpression(value.trim()) : undefined;
}

export function parseTypeExpression(value) {
  const text = value.trim();
  const application = readTypeApplication(text);
  if (!application) return text;
  if (application.name === 'Record') return readRecordTypeExpression(application.body) ?? text;
  if (application.name === 'Union') return readUnionTypeExpression(application.body) ?? text;
  const args = splitTopLevelCommaList(application.body);
  if (args.some((arg) => !arg)) return text;
  const parsedArgs = args.map(parseTypeExpression);
  if (application.name === 'Set' && parsedArgs.length === 1) return { kind: 'set', item: parsedArgs[0] };
  if (application.name === 'List' && parsedArgs.length === 1) return { kind: 'list', item: parsedArgs[0] };
  if (application.name === 'Map' && parsedArgs.length === 2) return { kind: 'map', key: parsedArgs[0], value: parsedArgs[1] };
  return { kind: 'ref', name: application.name, args: parsedArgs };
}

export function inspectTypeExpressionSyntax(value) {
  const text = value.trim();
  if (!text) return { ok: false, reason: 'missing-type-expression' };
  const application = readTypeApplication(text);
  if (!application) {
    return hasReservedStructuralTypeSyntax(text)
      ? { ok: false, reason: 'malformed-structural-type-expression' }
      : { ok: true };
  }
  if (application.name === 'Record') return inspectRecordTypeExpression(application.body);
  if (application.name === 'Union') return inspectUnionTypeExpression(application.body);
  if (!hasReservedStructuralTypeSyntax(application.body)) return { ok: true };
  const args = splitTopLevelCommaListStrict(application.body);
  if (!args.ok) return { ok: false, reason: args.reason };
  for (const arg of args.parts) {
    const inspected = inspectTypeExpressionSyntax(arg);
    if (!inspected.ok) return inspected;
  }
  return { ok: true };
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
  const split = splitTopLevelCommaListStrict(body);
  if (!split.ok) return undefined;
  const fields = [];
  const seen = new Set();
  const seenNames = new Set();
  for (const source of split.parts) {
    const field = readInlineTypeField(source, 'record_field');
    if (!field) return undefined;
    if (seen.has(field.id)) return undefined;
    seen.add(field.id);
    if (seenNames.has(field.name)) return undefined;
    seenNames.add(field.name);
    fields.push(field);
  }
  return fields.length ? { kind: 'record', fields } : undefined;
}

function readUnionTypeExpression(body) {
  const split = splitTopLevelCommaListStrict(body);
  if (!split.ok) return undefined;
  const variants = [];
  const seenNames = new Set();
  const seenIds = new Set();
  for (const source of split.parts) {
    const variant = readInlineTypeVariant(source);
    if (!variant) return undefined;
    if (seenNames.has(variant.name)) return undefined;
    seenNames.add(variant.name);
    if (variant.id) {
      if (seenIds.has(variant.id)) return undefined;
      seenIds.add(variant.id);
    }
    variants.push(variant);
  }
  return variants.length ? { kind: 'union', variants } : undefined;
}

function inspectRecordTypeExpression(body) {
  const split = splitTopLevelCommaListStrict(body);
  if (!split.ok) return { ok: false, reason: split.reason };
  if (!split.parts.length) return { ok: false, reason: 'empty-structural-record-type' };
  const seen = new Set();
  const seenNames = new Set();
  for (const source of split.parts) {
    const field = readInlineTypeField(source, 'record_field');
    if (!field) return { ok: false, reason: 'malformed-structural-record-field' };
    if (seen.has(field.id)) return { ok: false, reason: 'duplicate-structural-record-field-id' };
    seen.add(field.id);
    if (seenNames.has(field.name)) return { ok: false, reason: 'duplicate-structural-record-field-name' };
    seenNames.add(field.name);
  }
  return { ok: true, fieldCount: split.parts.length };
}

function inspectUnionTypeExpression(body) {
  const split = splitTopLevelCommaListStrict(body);
  if (!split.ok) return { ok: false, reason: split.reason };
  if (!split.parts.length) return { ok: false, reason: 'empty-structural-union-type' };
  const seenNames = new Set();
  const seenIds = new Set();
  for (const source of split.parts) {
    const inspected = inspectInlineTypeVariant(source);
    if (!inspected.ok) return inspected;
    const variant = readInlineTypeVariant(source);
    if (seenNames.has(variant.name)) return { ok: false, reason: 'duplicate-structural-union-variant-name' };
    seenNames.add(variant.name);
    if (variant.id) {
      if (seenIds.has(variant.id)) return { ok: false, reason: 'duplicate-structural-union-variant-id' };
      seenIds.add(variant.id);
    }
  }
  return { ok: true, variantCount: split.parts.length };
}

function readInlineTypeVariant(source) {
  const match = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?(?:\((.*)\))?\s*$/.exec(source);
  if (!match) return undefined;
  const payload = match[3]?.trim();
  const fields = [];
  if (match[3] !== undefined) {
    if (!payload) return undefined;
    const split = splitTopLevelCommaListStrict(payload);
    if (!split.ok) return undefined;
    const seen = new Set();
    const seenNames = new Set();
    for (const fieldSource of split.parts) {
      const field = readInlineTypeField(fieldSource, `variant_field_${match[1]}`);
      if (!field) return undefined;
      if (seen.has(field.id)) return undefined;
      seen.add(field.id);
      if (seenNames.has(field.name)) return undefined;
      seenNames.add(field.name);
      fields.push(field);
    }
  }
  return {
    ...(match[2] ? { id: match[2] } : {}),
    name: match[1],
    ...(fields.length ? { fields } : {})
  };
}

function inspectInlineTypeVariant(source) {
  const match = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?(?:\((.*)\))?\s*$/.exec(source);
  if (!match) return { ok: false, reason: 'malformed-structural-union-variant' };
  const payload = match[3]?.trim();
  if (match[3] === undefined) return { ok: true };
  if (!payload) return { ok: false, reason: 'empty-structural-union-variant-payload' };
  const split = splitTopLevelCommaListStrict(payload);
  if (!split.ok) return { ok: false, reason: split.reason };
  const seen = new Set();
  const seenNames = new Set();
  for (const fieldSource of split.parts) {
    const field = readInlineTypeField(fieldSource, `variant_field_${match[1]}`);
    if (!field) return { ok: false, reason: 'malformed-structural-union-variant-field' };
    if (seen.has(field.id)) return { ok: false, reason: 'duplicate-structural-union-variant-field-id' };
    seen.add(field.id);
    if (seenNames.has(field.name)) return { ok: false, reason: 'duplicate-structural-union-variant-field-name' };
    seenNames.add(field.name);
  }
  return { ok: true };
}

function readInlineTypeField(source, idPrefix) {
  const match = /^\s*([A-Za-z_$][\w$]*)(\?)?(?:\s+@id\(\s*["']([^"']+)["']\s*\))?(\?)?\s*:\s*(.+)\s*$/.exec(source);
  if (!match || !match[5].trim()) return undefined;
  const typeSource = match[5].trim();
  if (!inspectTypeExpressionSyntax(typeSource).ok) return undefined;
  const optional = Boolean(match[2] || match[4]);
  return {
    id: match[3] ?? `${idPrefix}_${match[1]}`,
    name: match[1],
    type: parseTypeExpression(typeSource),
    ...(optional ? { optional: true } : {})
  };
}

function hasReservedStructuralTypeSyntax(text) {
  return /\b(?:Record|Union)\s*</.test(text);
}

function splitTopLevelCommaListStrict(source) {
  const parts = [];
  const stack = [];
  let start = 0;
  let quote = '';
  let escaped = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '<' || char === '(' || char === '[' || char === '{') {
      stack.push(closingDelimiterFor(char));
      continue;
    }
    if (char === '>' || char === ')' || char === ']' || char === '}') {
      if (stack.pop() !== char) return { ok: false, reason: 'unbalanced-structural-type-expression' };
      continue;
    }
    if (char === ',' && stack.length === 0) {
      const part = source.slice(start, index).trim();
      if (!part) return { ok: false, reason: 'empty-structural-type-expression-part' };
      parts.push(part);
      start = index + 1;
    }
  }
  if (quote || stack.length) return { ok: false, reason: 'unbalanced-structural-type-expression' };
  const last = source.slice(start).trim();
  if (!last) return { ok: false, reason: 'empty-structural-type-expression-part' };
  parts.push(last);
  return { ok: true, parts };
}

function closingDelimiterFor(char) {
  if (char === '<') return '>';
  if (char === '(') return ')';
  if (char === '[') return ']';
  return '}';
}
