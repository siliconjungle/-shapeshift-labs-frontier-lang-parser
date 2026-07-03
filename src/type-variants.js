export function readVariantPayloadFields(rest, variantName, parseTypeExpression) {
  const withoutId = stripLeadingVariantId(rest);
  if (!withoutId) return undefined;
  const payload = /^\((.*)\)$/.exec(withoutId);
  if (!payload || !payload[1].trim()) return null;
  const fields = [];
  for (const part of splitTopLevelCommaList(payload[1])) {
    const field = parseVariantPayloadField(part, variantName, parseTypeExpression);
    if (!field) return null;
    fields.push(field);
  }
  return fields;
}

export function inspectVariantPayload(rest) {
  const withoutId = stripLeadingVariantId(rest);
  if (!withoutId) return { ok: true };
  const payload = /^\((.*)\)$/.exec(withoutId);
  if (!payload || !payload[1].trim()) return { ok: false, reason: 'malformed-type-variant-payload' };
  const fieldIds = [];
  const seen = new Set();
  for (const fieldSource of splitTopLevelCommaList(payload[1])) {
    const field = parseVariantPayloadField(fieldSource);
    if (!field) return { ok: false, reason: 'malformed-type-variant-payload' };
    if (seen.has(field.id)) return { ok: false, reason: 'duplicate-type-variant-field-id' };
    seen.add(field.id);
    fieldIds.push(field.id);
  }
  return { ok: true, fieldCount: fieldIds.length, fieldIds };
}

function parseVariantPayloadField(source, variantName, parseTypeExpression) {
  const match = /^\s*([A-Za-z_$][\w$]*)(\?)?(?:\s+@id\(\s*["']([^"']+)["']\s*\))?(\?)?\s*:\s*(.+)\s*$/.exec(source);
  if (!match || !match[5].trim()) return undefined;
  const optional = Boolean(match[2] || match[4]);
  return {
    id: match[3] ?? (variantName ? `variant_field_${variantName}_${match[1]}` : match[1]),
    name: match[1],
    ...(parseTypeExpression ? { type: parseTypeExpression(match[5].trim()) } : {}),
    ...(optional ? { optional: true } : {})
  };
}

function splitTopLevelCommaList(source) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '<') depth++;
    if (char === '>') depth = Math.max(0, depth - 1);
    if (char === ',' && depth === 0) {
      parts.push(source.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(source.slice(start).trim());
  return parts;
}

function stripLeadingVariantId(rest) {
  return rest.replace(/^\s*@id\(\s*["'][^"']+["']\s*\)/, '').trim();
}
