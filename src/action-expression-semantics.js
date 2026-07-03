export const NUMERIC_OPERATORS = new Set(['+', '-', '*', '/', '%']);

const ORDERED_COMPARISON_OPERATORS = new Set(['>', '>=', '<', '<=']);
const NUMERIC_TYPES = new Set(['number', 'numeric', 'int', 'integer', 'float', 'double', 'decimal']);

export function hasNumericOperator(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.kind === 'binary') return NUMERIC_OPERATORS.has(node.op) || hasNumericOperator(node.left) || hasNumericOperator(node.right);
  if (node.kind === 'logical') return hasNumericOperator(node.left) || hasNumericOperator(node.right);
  if (node.kind === 'unary') return hasNumericOperator(node.argument);
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
  return false;
}

export function isNumericType(value) {
  return NUMERIC_TYPES.has(String(value ?? '').trim().toLowerCase());
}

function isLiteralNumericComparison(node) {
  return node.left?.kind === 'literal' && typeof node.left.value === 'number' && node.right?.kind === 'literal' && typeof node.right.value === 'number';
}
