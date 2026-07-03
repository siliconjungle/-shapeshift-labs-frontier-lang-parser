import { parseActionValue, readActionValue } from './action-expression.js';
import { findActionMatchingBrace } from './action-source-blocks.js';

export function readForInHeaderBlock(source, offset, endOffset, helpers = {}) {
  const match = /^for\b([^{\n]*)\{/.exec(source.slice(offset, endOffset));
  if (!match) return undefined;
  const open = offset + match[0].length - 1;
  const findBrace = helpers.findMatchingBrace ?? findActionMatchingBrace;
  const close = findBrace(source, open);
  if (close < 0 || close > endOffset) return undefined;
  return {
    start: offset,
    header: match[1].trim(),
    open,
    close,
    body: source.slice(open + 1, close),
    end: close + 1
  };
}

export function readActionForInHeader(header, index) {
  const rawText = rawHeader(header, 'for');
  const hasExplicitId = hasId(rawText);
  const text = stripIds(rawText);
  const shape = /^([A-Za-z_$][\w$-]*)\s+in\s+(.+)$/.exec(text);
  const itemName = shape?.[1];
  const collectionText = shape?.[2]?.trim();
  const collection = collectionText ? readActionValue(collectionText) : undefined;
  return cleanRecord({
    id: idFrom(header, `action_body_for_${itemName ?? index}`),
    name: itemName ?? `for_${index}`,
    itemName,
    collection,
    collectionText,
    hasExplicitId,
    malformed: !shape
  });
}

export function validateActionForInHeader(header) {
  const details = readActionForInHeader(header, 0);
  const stripped = stripIds(rawHeader(header, 'for'));
  if (details.malformed && /^in\b/.test(stripped)) return { ok: false, reason: 'missing-action-for-item' };
  if (details.malformed && !/\bin\b/.test(stripped)) return { ok: false, reason: 'missing-action-for-collection' };
  if (details.malformed) return { ok: false, reason: 'malformed-action-for-header' };
  if (!details.itemName) return { ok: false, reason: 'missing-action-for-item' };
  if (!isActionBindingName(details.itemName) || details.itemName === 'in') return { ok: false, reason: 'unsupported-action-for-item' };
  if (!details.hasExplicitId) return { ok: false, reason: 'missing-action-for-id' };
  if (!details.collectionText) return { ok: false, reason: 'missing-action-for-collection' };
  const parsed = parseActionValue(details.collectionText);
  if (!parsed.ok) return { ok: false, reason: 'unsupported-action-for-collection' };
  if (!details.collection) return { ok: false, reason: 'unsupported-action-for-collection' };
  if (!isSupportedCollectionExpression(details.collection)) {
    return { ok: false, reason: 'unsupported-action-for-collection' };
  }
  return { ok: true };
}

function isSupportedCollectionExpression(value) {
  const ast = value?.expressionAst;
  return ast?.kind === 'ref'
    && (ast.scope === 'input' || ast.scope === 'state' || ast.scope === 'local')
    && Array.isArray(ast.path)
    && ast.path.length > 0;
}

function rawHeader(header, keyword) {
  return String(header ?? '').replace(new RegExp('^' + keyword + '\\b'), '').replace(/\{\s*$/, '').trim();
}

function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function hasId(header) { return /@id\(\s*["'][^"']+["']\s*\)/.test(header); }
function stripIds(text) { return String(text ?? '').replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim(); }
function isActionBindingName(value) { return /^[A-Za-z_$][\w$-]*$/.test(String(value ?? '')); }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
