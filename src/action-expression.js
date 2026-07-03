const IDENTIFIER = /^[A-Za-z_$][\w$-]*$/;
const BLOCKED_REF_ROOTS = new Set(['globalThis', 'process', 'window', 'document', 'constructor', 'prototype', '__proto__', 'env']);
const NUMERIC_OPERATORS = new Set(['+', '-', '*', '/', '%']);
const NUMERIC_TYPES = new Set(['number', 'numeric', 'int', 'integer', 'float', 'double', 'decimal']);

export function readActionValue(value, options = {}) {
  const parsed = parseActionValue(value, options);
  return parsed.ok ? parsed.value : undefined;
}

export function parseActionValue(value, options = {}) {
  const text = String(value ?? '').trim();
  if (!text) return fail('missing-action-expression');
  const expression = parseActionExpression(text, options);
  if (!expression.ok) return expression;
  if (hasNumericOperator(expression.ast) && !isNumericType(options.valueType ?? options.type)) {
    return fail((options.valueType ?? options.type) ? 'unsupported-action-expression-type' : 'missing-action-expression-type');
  }
  const valueType = options.valueType ?? options.type;
  if (expression.literal) return { ok: true, value: compactRecord({ value: expression.ast.value, valueType }) };
  return { ok: true, value: compactRecord({ expression: text, expressionAst: expression.ast, valueType }) };
}

export function parseActionExpression(value, options = {}) {
  const text = String(value ?? '').trim();
  if (!text) return fail('missing-action-expression');
  const tokens = tokenizeActionExpression(text);
  if (!tokens.ok) return tokens;
  const parser = new ExpressionParser(tokens.tokens, options);
  const ast = parser.parseExpression();
  if (!parser.ok) return fail(parser.reason);
  if (parser.peek().type !== 'eof') return fail(parser.reasonForTrailingToken());
  return { ok: true, ast, literal: ast.kind === 'literal' };
}

export function isSupportedActionValue(value, options = {}) {
  return parseActionValue(value, options).ok;
}

function tokenizeActionExpression(text) {
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
    if (char === '(' || char === ')' || char === '.') {
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

class ExpressionParser {
  constructor(tokens, options) {
    this.tokens = tokens;
    this.options = options;
    this.index = 0;
    this.ok = true;
    this.reason = undefined;
  }

  parseExpression() {
    return this.parseLogicalOr();
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.matchOperator('||')) left = { kind: 'logical', op: '||', left, right: this.parseLogicalAnd() };
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseComparison();
    while (this.matchOperator('&&')) left = { kind: 'logical', op: '&&', left, right: this.parseComparison() };
    return left;
  }

  parseComparison() {
    let left = this.parseAdditive();
    const operator = this.peek();
    if (operator.type === 'operator' && ['==', '!=', '>', '>=', '<', '<='].includes(operator.text)) {
      this.index++;
      left = { kind: 'binary', op: operator.text, left, right: this.parseAdditive() };
      if (this.peek().type === 'operator' && ['==', '!=', '>', '>=', '<', '<='].includes(this.peek().text)) {
        this.reject('malformed-action-expression');
      }
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while (this.peek().type === 'operator' && (this.peek().text === '+' || this.peek().text === '-')) {
      const operator = this.peek().text;
      this.index++;
      left = { kind: 'binary', op: operator, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    while (this.peek().type === 'operator' && (this.peek().text === '*' || this.peek().text === '/' || this.peek().text === '%')) {
      const operator = this.peek().text;
      this.index++;
      left = { kind: 'binary', op: operator, left, right: this.parseUnary() };
    }
    return left;
  }

  parseUnary() {
    if (this.matchOperator('!')) return { kind: 'unary', op: '!', argument: this.parseUnary() };
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();
    if (token.type === 'number') {
      this.index++;
      return { kind: 'literal', value: token.value };
    }
    if (token.type === 'string') {
      this.index++;
      return { kind: 'literal', value: token.value };
    }
    if (token.type === 'identifier') {
      if (token.text === 'true' || token.text === 'false') {
        this.index++;
        return { kind: 'literal', value: token.text === 'true' };
      }
      if (token.text === 'null') {
        this.index++;
        return { kind: 'literal', value: null };
      }
      return this.parseRef();
    }
    if (token.type === 'punctuation' && token.text === '(') {
      this.index++;
      const expression = this.parseExpression();
      if (!this.matchPunctuation(')')) this.reject('malformed-action-expression');
      return expression;
    }
    this.reject('malformed-action-expression');
    return { kind: 'literal', value: null };
  }

  parseRef() {
    const parts = [];
    const first = this.consumeIdentifier();
    if (!first) return { kind: 'literal', value: null };
    parts.push(first);
    while (this.matchPunctuation('.')) {
      const part = this.consumeIdentifier();
      if (!part) {
        this.reject('unsupported-action-expression-ref');
        return refNode(parts);
      }
      parts.push(part);
    }
    if (this.peek().type === 'punctuation' && this.peek().text === '(') {
      this.reject('unsupported-action-expression-ref');
      return refNode(parts);
    }
    if (BLOCKED_REF_ROOTS.has(parts[0])) {
      this.reject('unsupported-action-expression-ref');
      return refNode(parts);
    }
    return refNode(parts);
  }

  consumeIdentifier() {
    const token = this.peek();
    if (token.type !== 'identifier' || !IDENTIFIER.test(token.text)) {
      this.reject('unsupported-action-expression-ref');
      return undefined;
    }
    this.index++;
    return token.text;
  }

  matchOperator(operator) {
    const token = this.peek();
    if (token.type === 'operator' && token.text === operator) {
      this.index++;
      return true;
    }
    return false;
  }

  matchPunctuation(text) {
    const token = this.peek();
    if (token.type === 'punctuation' && token.text === text) {
      this.index++;
      return true;
    }
    return false;
  }

  peek() {
    return this.tokens[this.index] ?? this.tokens[this.tokens.length - 1];
  }

  reject(reason) {
    if (!this.ok) return;
    this.ok = false;
    this.reason = reason;
  }

  reasonForTrailingToken() {
    const token = this.peek();
    if (token.type === 'operator') return 'unsupported-action-expression-operator';
    if (token.type === 'punctuation' && (token.text === '.' || token.text === '(' || token.text === '[')) return 'unsupported-action-expression-ref';
    return 'malformed-action-expression';
  }
}

function canStartSignedNumber(tokens) {
  const previous = tokens[tokens.length - 1];
  if (!previous) return true;
  if (previous.type === 'operator') return true;
  return previous.type === 'punctuation' && previous.text === '(';
}

function hasNumericOperator(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.kind === 'binary') return NUMERIC_OPERATORS.has(node.op) || hasNumericOperator(node.left) || hasNumericOperator(node.right);
  if (node.kind === 'logical') return hasNumericOperator(node.left) || hasNumericOperator(node.right);
  if (node.kind === 'unary') return hasNumericOperator(node.argument);
  return false;
}

function isNumericType(value) {
  return NUMERIC_TYPES.has(String(value ?? '').trim().toLowerCase());
}

function refNode(parts) {
  const [root, ...rest] = parts;
  const scope = root === 'input' || root === 'state' || root === 'patches' ? root : 'local';
  const path = scope === 'local' ? parts : rest;
  return { kind: 'ref', name: parts.join('.'), scope, path };
}

function fail(reason) {
  return { ok: false, reason };
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
