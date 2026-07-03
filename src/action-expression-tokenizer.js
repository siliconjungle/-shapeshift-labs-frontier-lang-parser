import { NUMERIC_OPERATORS } from './action-expression-semantics.js';

export function tokenizeActionExpression(text) {
  const tokens = [];
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (/\s/.test(char)) {
      index++;
      continue;
    }
    if (char === '"' || char === "'") {
      const read = readStringToken(text, index);
      if (!read.ok) return read;
      tokens.push(read.token);
      index = read.next;
      continue;
    }
    const canReadSignedNumber = char !== '-' || canStartSignedNumber(tokens);
    const number = canReadSignedNumber ? /^-?\d+(?:\.\d+)?/.exec(text.slice(index)) : undefined;
    if (number) {
      tokens.push({ type: 'number', value: Number(number[0]), text: number[0], start: index, end: index + number[0].length });
      index += number[0].length;
      continue;
    }
    const identifier = /^[A-Za-z_$][\w$-]*/.exec(text.slice(index));
    if (identifier) {
      tokens.push({ type: 'identifier', text: identifier[0], start: index, end: index + identifier[0].length });
      index += identifier[0].length;
      continue;
    }
    const triple = text.slice(index, index + 3);
    if (triple === '===' || triple === '!==') return fail('unsupported-action-expression-operator');
    const double = text.slice(index, index + 2);
    if (double === '&&' || double === '||' || double === '==' || double === '!=' || double === '>=' || double === '<=') {
      tokens.push({ type: 'operator', text: double, start: index, end: index + 2 });
      index += 2;
      continue;
    }
    if (char === '!' || char === '>' || char === '<' || NUMERIC_OPERATORS.has(char)) {
      tokens.push({ type: 'operator', text: char, start: index, end: index + 1 });
      index++;
      continue;
    }
    if (char === '(' || char === ')' || char === '.' || char === ',') {
      tokens.push({ type: 'punctuation', text: char, start: index, end: index + 1 });
      index++;
      continue;
    }
    if ('=&|?:[]{}'.includes(char)) return fail('unsupported-action-expression-operator');
    return fail('malformed-action-expression');
  }
  tokens.push({ type: 'eof', text: '', start: text.length, end: text.length });
  return { ok: true, tokens };
}

function readStringToken(text, start) {
  const quote = text[start];
  let value = '';
  let index = start + 1;
  while (index < text.length) {
    const char = text[index];
    if (char === quote) {
      return { ok: true, token: { type: 'string', value, text: text.slice(start, index + 1), start, end: index + 1 }, next: index + 1 };
    }
    if (char === '\\') {
      const next = text[index + 1];
      if (next === undefined) return fail('malformed-action-expression');
      if (next === 'n') value += '\n';
      else if (next === 'r') value += '\r';
      else if (next === 't') value += '\t';
      else if (next === '\\' || next === '"' || next === "'") value += next;
      else return fail('malformed-action-expression');
      index += 2;
      continue;
    }
    value += char;
    index++;
  }
  return fail('malformed-action-expression');
}

function canStartSignedNumber(tokens) {
  const previous = tokens[tokens.length - 1];
  if (!previous) return true;
  if (previous.type === 'operator') return true;
  return previous.type === 'punctuation' && (previous.text === '(' || previous.text === ',');
}

function fail(reason) {
  return { ok: false, reason };
}
