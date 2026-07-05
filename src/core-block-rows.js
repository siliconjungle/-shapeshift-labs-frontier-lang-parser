export function readAdapters(block) {
  const adapters = [];
  for (const authoredLine of readAuthoredLines(block)) {
    const match = /^adapter\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(authoredLine.text);
    if (!match) continue;
    const [, adapterName, rest = ''] = match;
    adapters.push(cleanRecord({
      id: explicitIdFrom(rest),
      name: adapterName,
      target: {
        language: readInlineWord('target', rest) ?? readInlineWord('language', rest) ?? adapterName,
        platform: readInlineWord('platform', rest),
        framework: readInlineWord('framework', rest),
        packageName: readInlineWord('package', rest) ?? readInlineWord('packageName', rest),
        adapterPackage: readInlineWord('adapterPackage', rest)
      },
      symbol: readInlineWord('symbol', rest) ?? adapterName,
      kind: readInlineWord('kind', rest),
      packageName: readInlineWord('package', rest) ?? readInlineWord('packageName', rest),
      importPath: readInlineWord('import', rest) ?? readInlineWord('importPath', rest),
      requires: readInlineWord('requires', rest)?.split('|').map((item) => item.trim()).filter(Boolean),
      sourceSpan: authoredLine.sourceSpan,
      authoredSourceSpan: authoredLine.sourceSpan,
      metadata: { authoredName: adapterName }
    }));
  }
  return adapters.length ? adapters : undefined;
}

export function readUnsupportedTargets(block) {
  const unsupported = [];
  for (const authoredLine of readAuthoredLines(block)) {
    const match = /^(unsupported|unsupportedTarget)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(authoredLine.text);
    if (!match) continue;
    const [, , targetName, rest = ''] = match;
    unsupported.push(cleanRecord({
      id: explicitIdFrom(rest),
      name: targetName,
      target: { language: readInlineWord('target', rest) ?? readInlineWord('language', rest) ?? targetName, platform: readInlineWord('platform', rest), framework: readInlineWord('framework', rest) },
      reason: readInlineQuoted('reason', rest) ?? readInlineWord('reason', rest) ?? leadingPositionalStatement(rest) ?? 'Unsupported by this target.',
      sourceSpan: authoredLine.sourceSpan,
      authoredSourceSpan: authoredLine.sourceSpan,
      metadata: { authoredName: targetName }
    }));
  }
  return unsupported.length ? unsupported : undefined;
}

export function readChangeRecords(block) {
  const changes = [];
  for (const authoredLine of readAuthoredLines(block)) {
    const match = /^change\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(authoredLine.text);
    if (!match) continue;
    const [, changeName, rest = ''] = match;
    const positional = leadingPositionalStatement(rest);
    const path = readInlineWord('path', rest);
    changes.push(cleanRecord({
      id: explicitIdFrom(rest) ?? `change_${changes.length}`,
      name: changeName,
      kind: readInlineWord('kind', rest) ?? readInlineWord('changeKind', rest) ?? changeName,
      target: readInlineWord('target', rest) ?? path ?? positional,
      path,
      from: readInlineWord('from', rest),
      to: readInlineWord('to', rest),
      statement: readInlineQuoted('statement', rest) ?? readInlineQuoted('summary', rest) ?? positional,
      sourceSpan: authoredLine.sourceSpan,
      authoredSourceSpan: authoredLine.sourceSpan,
      metadata: { authoredName: changeName }
    }));
  }
  return changes;
}

function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function explicitIdFrom(text) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1]; }
function stripInlineId(text) { return String(text ?? '').replace(/@id\(\s*["'][^"']+["']\s*\)/g, ''); }
function leadingPositionalStatement(text) {
  const labels = new Set(['kind', 'changeKind', 'path', 'target', 'from', 'to', 'statement', 'summary', 'sourcePath', 'sourceHash', 'platform', 'framework', 'package', 'packageName', 'adapterPackage', 'symbol', 'language', 'import', 'importPath', 'requires', 'reason']);
  const positional = [];
  for (const token of stripInlineId(text).trim().split(/\s+/).filter(Boolean)) { if (labels.has(token)) break; positional.push(token); }
  return positional.length ? positional.join(' ') : undefined;
}
function readAuthoredLines(block) {
  const records = []; let lineStart = block.syntax?.bodyStartOffset ?? 0;
  for (const rawLine of block.body.split('\n')) {
    const rawEnd = lineStart + rawLine.length, leading = /^\s*/.exec(rawLine)?.[0].length ?? 0, trailing = /\s*$/.exec(rawLine)?.[0].length ?? 0;
    const startOffset = lineStart + leading, endOffset = Math.max(startOffset, rawEnd - trailing);
    records.push({ text: rawLine.trim(), sourceSpan: typeof block.sourceSpan === 'function' ? block.sourceSpan(startOffset, endOffset) : undefined });
    lineStart = rawEnd + 1;
  }
  return records;
}
function cleanRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
