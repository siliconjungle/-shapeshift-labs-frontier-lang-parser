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
