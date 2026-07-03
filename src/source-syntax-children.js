export function readSourceSyntaxChildren(source, block, options = {}) {
  if (block.malformed) return [];
  if (block.kind === 'conversion' || block.kind === 'universalConversionPlan') {
    return readConversionSyntaxChildren(source, block, options);
  }
  return [];
}

function readConversionSyntaxChildren(source, block, options) {
  const children = [];
  for (const line of readBodyLines(source, block)) {
    if (!line.text || line.text.startsWith('#')) continue;
    const constraint = /^constraint\s+([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line.text);
    if (!constraint) continue;
    const [, family, name, rest] = constraint;
    children.push(cleanRecord({
      kind: 'conversionConstraint',
      name,
      id: idFrom(rest, `conversion_constraint_${family}_${name}`),
      family,
      role: readInlineWord('role', rest) ?? 'source',
      header: line.text,
      startOffset: line.startOffset,
      endOffset: line.endOffset,
      location: sourcePosition(source, line.startOffset),
      parentKind: block.kind,
      parentId: block.id,
      parentName: block.name,
      moduleId: block.moduleId,
      moduleName: block.moduleName,
      sourceSpan: sourceSpan(source, block, line.startOffset, line.endOffset, options),
      recognized: true
    }));
  }
  return children;
}

function readBodyLines(source, block) {
  const body = source.slice(block.bodyStartOffset, block.bodyEndOffset);
  const lines = body.split('\n');
  const records = [];
  let lineStart = block.bodyStartOffset;
  for (const rawLine of lines) {
    const rawEnd = lineStart + rawLine.length;
    const leading = /^\s*/.exec(rawLine)?.[0].length ?? 0;
    const trailing = /\s*$/.exec(rawLine)?.[0].length ?? 0;
    const startOffset = lineStart + leading;
    const endOffset = Math.max(startOffset, rawEnd - trailing);
    records.push({ text: rawLine.trim(), startOffset, endOffset });
    lineStart = rawEnd + 1;
  }
  return records;
}

function sourcePosition(source, offset) {
  const lines = source.slice(0, offset).split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1, offset };
}

function sourceSpan(source, block, startOffset, endOffset, options = {}) {
  return cleanRecord({
    sourceId: options.documentId,
    path: options.sourcePath,
    blockId: block.id,
    blockKind: block.kind,
    startOffset,
    endOffset,
    start: sourcePosition(source, startOffset),
    end: sourcePosition(source, endOffset)
  });
}

function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
