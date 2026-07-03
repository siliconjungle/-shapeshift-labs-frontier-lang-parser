import { parseTypeExpression } from './type-expressions.js';
import { splitTopLevelCommaList } from './type-variants.js';

export function readTypeParameterNames(header) {
  return readTypeParameterRecords(header)?.map((parameter) => parameter.name);
}

export function readTypeParameterRecords(header) {
  const source = readTypeParameterSource(header);
  if (!source) return undefined;
  const records = [];
  for (const item of splitTopLevelCommaList(source)) {
    const record = readTypeParameterRecord(item);
    if (!record) return undefined;
    records.push(record);
  }
  return records.length ? records : undefined;
}

function readTypeParameterRecord(source) {
  const [withoutDefault, defaultSource] = splitTopLevelAssignment(source);
  const match = /^\s*([A-Za-z_$][\w$]*)(?:(?:\s+extends\s+|\s*:\s*)(.+))?\s*$/.exec(withoutDefault);
  if (!match) return undefined;
  return {
    name: match[1],
    ...(match[2]?.trim() ? { constraint: parseTypeExpression(match[2].trim()) } : {}),
    ...(defaultSource?.trim() ? { default: parseTypeExpression(defaultSource.trim()) } : {})
  };
}

function readTypeParameterSource(header) {
  const start = header.indexOf('<');
  if (start < 0) return undefined;
  let depth = 0;
  for (let index = start; index < header.length; index++) {
    const char = header[index];
    if (char === '<') depth++;
    if (char === '>') depth--;
    if (depth === 0) return header.slice(start + 1, index).trim();
  }
  return undefined;
}

function splitTopLevelAssignment(source) {
  let depth = 0;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '<') depth++;
    if (char === '>') depth--;
    if (char === '=' && depth === 0) return [source.slice(0, index).trim(), source.slice(index + 1).trim()];
  }
  return [source.trim(), undefined];
}
