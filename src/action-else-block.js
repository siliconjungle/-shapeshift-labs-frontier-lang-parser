export function readElseHeaderBlock(source, offset, endOffset = source.length, helpers = {}) {
  const skipWhitespace = helpers.skipWhitespace;
  const findMatchingBrace = helpers.findMatchingBrace;
  if (typeof skipWhitespace !== 'function' || typeof findMatchingBrace !== 'function') return undefined;
  const elseOffset = skipWhitespace(source, offset, endOffset);
  const elseHeader = /^else\b([^{\n]*)\{/.exec(source.slice(elseOffset, endOffset));
  if (!elseHeader) return undefined;
  const header = elseHeader[1].trim();
  const open = elseOffset + elseHeader[0].length - 1;
  const close = findMatchingBrace(source, open);
  if (close < 0 || close > endOffset) return undefined;
  return { header, start: elseOffset, open, close, body: source.slice(open + 1, close), supported: isSupportedElseHeader(header) };
}

export function isSupportedElseHeader(header) {
  const withoutId = String(header ?? '').replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim();
  return !withoutId || /^[A-Za-z_$][\w$-]*$/.test(withoutId);
}
