export function readElseHeaderBlock(source, offset, endOffset = source.length, helpers = {}) {
  const skipWhitespace = helpers.skipWhitespace;
  const findMatchingBrace = helpers.findMatchingBrace;
  if (typeof skipWhitespace !== 'function' || typeof findMatchingBrace !== 'function') return undefined;
  const elseOffset = skipWhitespace(source, offset, endOffset);
  const elseIfHeader = /^else\s+if\b([^{\n]*)\{/.exec(source.slice(elseOffset, endOffset));
  if (elseIfHeader) return readBlock(source, elseOffset, elseIfHeader, endOffset, findMatchingBrace, true, helpers);
  const elseHeader = /^else\b([^{\n]*)\{/.exec(source.slice(elseOffset, endOffset));
  if (!elseHeader) return undefined;
  return readBlock(source, elseOffset, elseHeader, endOffset, findMatchingBrace, false, helpers);
}

function readBlock(source, elseOffset, elseHeader, endOffset, findMatchingBrace, isElseIf, helpers) {
  const header = elseHeader[1].trim();
  const open = elseOffset + elseHeader[0].length - 1;
  const close = findMatchingBrace(source, open);
  if (close < 0 || close > endOffset) return undefined;
  const tail = isElseIf ? readElseHeaderBlock(source, close + 1, endOffset, helpers) : undefined;
  return { header, start: elseOffset, open, close, end: tail?.end ?? close + 1, body: source.slice(open + 1, close), isElseIf, tail, supported: isElseIf ? isSupportedElseIfHeader(header) : isSupportedElseHeader(header) };
}

export function isSupportedElseHeader(header) {
  const withoutId = String(header ?? '').replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim();
  return !withoutId || /^[A-Za-z_$][\w$-]*$/.test(withoutId);
}

function isSupportedElseIfHeader(header) {
  return String(header ?? '').replace(/@id\(\s*["'][^"']+["']\s*\)/g, '').trim().length > 0;
}
