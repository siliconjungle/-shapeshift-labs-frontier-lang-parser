export function readActionNestedBlocks(kind, source) {
  const blocks = [];
  const header = new RegExp('\\b' + escapeRegExp(kind) + '(?:\\s+([^{}\\n]+?))?\\s*\\{', 'g');
  let match;
  while ((match = header.exec(source))) {
    const open = header.lastIndex - 1;
    const close = findActionMatchingBrace(source, open);
    if (close < 0) continue;
    blocks.push({
      header: (match[1] ?? '').trim(),
      start: match.index,
      bodyStart: open + 1,
      bodyEnd: close,
      end: close + 1
    });
    header.lastIndex = close + 1;
  }
  return blocks;
}

export function skipActionWhitespaceAndComments(source, offset, endOffset = source.length) {
  let index = offset;
  while (index < endOffset) {
    while (index < endOffset && /\s/.test(source[index])) index++;
    if (source[index] !== '#') return index;
    const lineEnd = source.indexOf('\n', index);
    index = lineEnd < 0 || lineEnd > endOffset ? endOffset : lineEnd + 1;
  }
  return index;
}

export function findActionMatchingBrace(source, open) {
  let depth = 0;
  let state = 'code';
  let quote = '';
  for (let index = open; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];
    if (state === 'line-comment') {
      if (char === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        index++;
        state = 'code';
      }
      continue;
    }
    if (state === 'string') {
      if (char === '\\') {
        index++;
        continue;
      }
      if (char === quote) {
        state = 'code';
        quote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      index++;
      state = 'line-comment';
      continue;
    }
    if (char === '/' && next === '*') {
      index++;
      state = 'block-comment';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      state = 'string';
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
