import { parseActionValue, readActionValue } from './action-expression.js';
import { findActionMatchingBrace } from './action-source-blocks.js';

export function readRepeatHeaderBlock(source, offset, endOffset, helpers = {}) {
  const match = /^repeat\b([^{\n]*)\{/.exec(source.slice(offset, endOffset));
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

export function readActionRepeatHeader(header, index) {
  const rawText = rawHeader(header, 'repeat');
  const hasExplicitId = hasId(rawText);
  const shape = /^([A-Za-z_$][\w$-]*)\s+@id\(\s*["'][^"']+["']\s*\)\s+times\s+(.+)$/.exec(rawText);
  const indexName = shape?.[1];
  const countText = shape?.[2]?.trim();
  const count = countText ? readActionValue(countText) : undefined;
  return cleanRecord({
    id: idFrom(header, `action_body_repeat_${indexName ?? index}`),
    name: indexName ?? `repeat_${index}`,
    indexName,
    count,
    countText,
    hasExplicitId,
    malformed: !shape
  });
}

export function validateActionRepeatHeader(header) {
  const details = readActionRepeatHeader(header, 0);
  const stripped = stripIds(rawHeader(header, 'repeat'));
  if (details.malformed && /^times\b/.test(stripped)) return { ok: false, reason: 'missing-action-repeat-index' };
  if (details.malformed && /\btimes\s*$/.test(stripped)) return { ok: false, reason: 'missing-action-repeat-count' };
  if (details.malformed && !/\btimes\b/.test(stripped)) return { ok: false, reason: 'missing-action-repeat-count' };
  if (details.malformed && !details.hasExplicitId && /^[A-Za-z_$][\w$-]*\s+times\s+.+$/.test(stripped)) {
    return { ok: false, reason: 'missing-action-repeat-id' };
  }
  if (details.malformed) return { ok: false, reason: 'malformed-action-repeat-header' };
  if (!details.indexName) return { ok: false, reason: 'missing-action-repeat-index' };
  if (!isActionBindingName(details.indexName) || details.indexName === 'times') return { ok: false, reason: 'unsupported-action-repeat-index' };
  if (!details.hasExplicitId) return { ok: false, reason: 'missing-action-repeat-id' };
  if (!details.countText) return { ok: false, reason: 'missing-action-repeat-count' };
  const parsed = parseActionValue(details.countText);
  if (!parsed.ok) return { ok: false, reason: 'unsupported-action-repeat-count' };
  if (!details.count) return { ok: false, reason: 'unsupported-action-repeat-count' };
  if (!isSupportedCountExpression(details.count)) return { ok: false, reason: 'unsupported-action-repeat-count' };
  return { ok: true };
}

function isSupportedCountExpression(value) {
  if (Object.hasOwn(value ?? {}, 'value')) {
    return typeof value.value === 'number' && Number.isInteger(value.value) && value.value >= 0;
  }
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
