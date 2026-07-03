import { hasCallExpression, hasNonLiteralOrderedComparison, hasNumericOperator, isNumericType, isSupportedCallType } from './action-expression-semantics.js';
import { tokenizeActionExpression } from './action-expression-tokenizer.js';

const IDENTIFIER = /^[A-Za-z_$][\w$-]*$/;
const BLOCKED_REF_ROOTS = new Set(['globalThis', 'process', 'window', 'document', 'constructor', 'prototype', '__proto__', 'env']);
const BLOCKED_CALL_ROOTS = new Set([...BLOCKED_REF_ROOTS, 'input', 'state', 'patches']);

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
  if (hasNonLiteralOrderedComparison(expression.ast) && !isNumericType(options.comparisonType ?? options.compareType)) {
    return fail((options.comparisonType ?? options.compareType) ? 'unsupported-action-comparison-type' : 'missing-action-comparison-type');
  }
  if (hasCallExpression(expression.ast) && !isSupportedCallType(options.callType ?? options.call ?? options.returns)) {
    return fail((options.callType ?? options.call ?? options.returns) ? 'unsupported-action-call-type' : 'missing-action-call-type');
  }
  const valueType = options.valueType ?? options.type;
  const comparisonType = options.comparisonType ?? options.compareType;
  const callType = options.callType ?? options.call ?? options.returns;
  const ast = callType ? attachCallType(expression.ast, callType) : expression.ast;
  if (expression.literal) return { ok: true, value: compactRecord({ value: ast.value, valueType, comparisonType, callType }) };
  return { ok: true, value: compactRecord({ expression: text, expressionAst: ast, valueType, comparisonType, callType }) };
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
    if (token.type === 'punctuation' && token.text === '[') return this.parseArray();
    if (token.type === 'punctuation' && token.text === '{') return this.parseObject();
    this.reject('malformed-action-expression');
    return { kind: 'literal', value: null };
  }

  parseArray() {
    this.matchPunctuation('[');
    const elements = [];
    if (this.matchPunctuation(']')) return { kind: 'array', elements };
    while (this.ok) {
      elements.push(this.parseExpression());
      if (this.matchPunctuation(']')) break;
      if (!this.matchPunctuation(',')) {
        this.reject('malformed-action-expression');
        break;
      }
      if (this.peek().type === 'punctuation' && this.peek().text === ']') {
        this.reject('malformed-action-expression');
        break;
      }
    }
    return { kind: 'array', elements };
  }

  parseObject() {
    this.matchPunctuation('{');
    const entries = [];
    if (this.matchPunctuation('}')) return { kind: 'object', entries };
    while (this.ok) {
      const key = this.readObjectKey();
      if (key === undefined) {
        this.reject('malformed-action-expression');
        break;
      }
      if (!this.matchPunctuation(':')) {
        this.reject('malformed-action-expression');
        break;
      }
      entries.push({ key, value: this.parseExpression() });
      if (this.matchPunctuation('}')) break;
      if (!this.matchPunctuation(',')) {
        this.reject('malformed-action-expression');
        break;
      }
      if (this.peek().type === 'punctuation' && this.peek().text === '}') {
        this.reject('malformed-action-expression');
        break;
      }
    }
    return { kind: 'object', entries };
  }

  readObjectKey() {
    const token = this.peek();
    if (token.type !== 'identifier' && token.type !== 'string') return undefined;
    this.index++;
    return token.text === '__proto__' ? '__proto__' : String(token.value ?? token.text);
  }

  parseRef() {
    const parts = [];
    const first = this.consumeIdentifier();
    if (!first) return { kind: 'literal', value: null };
    parts.push(first);
    if (this.peek().type === 'punctuation' && this.peek().text === '(') return this.parseCall(first);
    while (this.matchPunctuation('.')) {
      const part = this.consumeIdentifier();
      if (!part) {
        this.reject('unsupported-action-expression-ref');
        return refNode(parts);
      }
      parts.push(part);
    }
    if (this.peek().type === 'punctuation' && this.peek().text === '(') {
      this.reject('unsupported-action-call-callee');
      return refNode(parts);
    }
    if (BLOCKED_REF_ROOTS.has(parts[0])) {
      this.reject('unsupported-action-expression-ref');
      return refNode(parts);
    }
    return refNode(parts);
  }

  parseCall(callee) {
    if (!IDENTIFIER.test(callee) || BLOCKED_CALL_ROOTS.has(callee)) {
      this.reject('unsupported-action-call-callee');
      return { kind: 'call', callee, args: [] };
    }
    this.matchPunctuation('(');
    const args = [];
    if (this.matchPunctuation(')')) return compactRecord({ kind: 'call', callee, args, callType: this.options.callType ?? this.options.call ?? this.options.returns });
    while (this.ok) {
      const argument = this.parseExpression();
      if (hasCallExpression(argument)) this.reject('unsupported-action-call-argument');
      args.push(argument);
      if (this.matchPunctuation(')')) break;
      if (!this.matchPunctuation(',')) {
        this.reject('malformed-action-expression');
        break;
      }
      if (this.peek().type === 'punctuation' && this.peek().text === ')') {
        this.reject('malformed-action-expression');
        break;
      }
    }
    return compactRecord({ kind: 'call', callee, args, callType: this.options.callType ?? this.options.call ?? this.options.returns });
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

function refNode(parts) {
  const [root, ...rest] = parts;
  const scope = root === 'input' || root === 'state' || root === 'patches' ? root : 'local';
  const path = scope === 'local' ? parts : rest;
  return { kind: 'ref', name: parts.join('.'), scope, path };
}

function fail(reason) {
  return { ok: false, reason };
}

function attachCallType(node, callType) {
  if (!node || typeof node !== 'object') return node;
  if (node.kind === 'call') return compactRecord({ ...node, callType });
  if (node.kind === 'binary' || node.kind === 'logical') return { ...node, left: attachCallType(node.left, callType), right: attachCallType(node.right, callType) };
  if (node.kind === 'unary') return { ...node, argument: attachCallType(node.argument, callType) };
  if (node.kind === 'array') return { ...node, elements: (node.elements ?? []).map((element) => attachCallType(element, callType)) };
  if (node.kind === 'object') return { ...node, entries: (node.entries ?? []).map((entry) => ({ ...entry, value: attachCallType(entry.value, callType) })) };
  return node;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
