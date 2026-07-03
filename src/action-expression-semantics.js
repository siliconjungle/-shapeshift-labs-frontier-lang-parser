export const NUMERIC_OPERATORS = new Set(['+', '-', '*', '/', '%']);

const ORDERED_COMPARISON_OPERATORS = new Set(['>', '>=', '<', '<=']);
const NUMERIC_TYPES = new Set(['number', 'numeric', 'int', 'integer', 'float', 'double', 'decimal']);
const CALL_TYPES = new Set(['text', 'string', 'bool', 'boolean', 'number', 'numeric', 'int', 'integer', 'float', 'double', 'decimal', 'json']);

export function hasNumericOperator(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.kind === 'binary') return NUMERIC_OPERATORS.has(node.op) || hasNumericOperator(node.left) || hasNumericOperator(node.right);
  if (node.kind === 'logical') return hasNumericOperator(node.left) || hasNumericOperator(node.right);
  if (node.kind === 'unary') return hasNumericOperator(node.argument);
  if (node.kind === 'array') return (node.elements ?? []).some(hasNumericOperator);
  if (node.kind === 'object') return (node.entries ?? []).some((entry) => hasNumericOperator(entry.value));
  return false;
}

export function hasNonLiteralOrderedComparison(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.kind === 'binary') {
    const current = ORDERED_COMPARISON_OPERATORS.has(node.op) && !isLiteralNumericComparison(node);
    return current || hasNonLiteralOrderedComparison(node.left) || hasNonLiteralOrderedComparison(node.right);
  }
  if (node.kind === 'logical') return hasNonLiteralOrderedComparison(node.left) || hasNonLiteralOrderedComparison(node.right);
  if (node.kind === 'unary') return hasNonLiteralOrderedComparison(node.argument);
  if (node.kind === 'array') return (node.elements ?? []).some(hasNonLiteralOrderedComparison);
  if (node.kind === 'object') return (node.entries ?? []).some((entry) => hasNonLiteralOrderedComparison(entry.value));
  return false;
}

export function hasCallExpression(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.kind === 'call') return true;
  if (node.kind === 'binary' || node.kind === 'logical') return hasCallExpression(node.left) || hasCallExpression(node.right);
  if (node.kind === 'unary') return hasCallExpression(node.argument);
  if (node.kind === 'array') return (node.elements ?? []).some(hasCallExpression);
  if (node.kind === 'object') return (node.entries ?? []).some((entry) => hasCallExpression(entry.value));
  return false;
}

export function isNumericType(value) {
  return NUMERIC_TYPES.has(String(value ?? '').trim().toLowerCase());
}

export function isSupportedCallType(value) {
  return CALL_TYPES.has(String(value ?? '').trim().toLowerCase());
}

function isLiteralNumericComparison(node) {
  return node.left?.kind === 'literal' && typeof node.left.value === 'number' && node.right?.kind === 'literal' && typeof node.right.value === 'number';
}
