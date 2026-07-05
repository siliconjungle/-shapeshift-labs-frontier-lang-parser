export function semanticUnknownRowRecord(options) {
  const {
    surfaceKind,
    idPrefix,
    reason,
    rowKind,
    normalizedRowKind,
    rowName,
    text = '',
    authoredLine = {}
  } = options;
  return cleanRecord({
    kind: `${surfaceKind}.unknownRow`,
    version: 1,
    recordKind: 'unknown-row',
    id: idFrom(text, `${idPrefix}_unknown_${safeId(rowKind)}_${authoredLine.startOffset ?? 0}`),
    rowKind,
    normalizedRowKind: normalizedRowKind ?? 'unknown',
    name: rowName ?? rowKind ?? 'unknown',
    status: 'unsupported',
    reason,
    code: reason,
    failClosed: true,
    ...falseClaims(),
    authoredText: authoredLine.text,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({
      authoredRowKind: rowKind,
      authoredName: rowName,
      ...falseClaims()
    })
  });
}

export function unsupportedSemanticRowProofGap(options) {
  const { surfaceKind, idPrefix, reason, unknownRow, authoredLine = {}, rowLabel } = options;
  return cleanRecord({
    kind: `${surfaceKind}.proofGap`,
    version: 1,
    recordKind: 'proof-gap',
    id: `${idPrefix}_gap_unsupported_${authoredLine.startOffset ?? 0}`,
    name: unknownRow.name,
    code: reason,
    reasonCode: reason,
    status: 'missing',
    evidenceIds: [unknownRow.id],
    summary: `Unsupported ${rowLabel ?? 'semantic'} row "${unknownRow.rowKind ?? 'unknown'}" requires parser support before admission.`,
    failClosed: true,
    ...falseClaims(),
    authoredText: authoredLine.text,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({
      unknownRowId: unknownRow.id,
      authoredRowKind: unknownRow.rowKind,
      ...falseClaims()
    })
  });
}

export function parserUnsupportedSemanticRowError(unknownRow, reason, rowLabel) {
  return cleanRecord({
    id: `parser_error_${safeId(reason)}_${safeId(unknownRow.id)}`,
    code: reason,
    reason,
    severity: 'error',
    failClosed: true,
    action: 'requires-parser-support',
    message: `Unsupported ${rowLabel ?? 'semantic'} row "${unknownRow.rowKind ?? 'unknown'}" must be reviewed before admission.`,
    rowId: unknownRow.id,
    nodeId: unknownRow.id,
    rowKind: unknownRow.rowKind,
    normalizedRowKind: unknownRow.normalizedRowKind,
    name: unknownRow.name,
    sourceSpan: unknownRow.sourceSpan
  });
}

export function pushSemanticUnknownRow(graph, options) {
  const unknownRow = semanticUnknownRowRecord(options);
  graph.unknownRows.push(unknownRow);
  graph.proofGaps.push(unsupportedSemanticRowProofGap({ ...options, unknownRow }));
  graph.parser.status = 'needs-review';
  graph.parser.errors.push(parserUnsupportedSemanticRowError(unknownRow, options.reason, options.rowLabel));
  return unknownRow;
}

export function readSemanticAuthoredLines(block) {
  const lines = block.body.split('\n');
  const records = [];
  let lineStart = block.syntax?.bodyStartOffset ?? 0;
  for (const rawLine of lines) {
    const rawEnd = lineStart + rawLine.length;
    const leading = /^\s*/.exec(rawLine)?.[0].length ?? 0;
    const trailing = /\s*$/.exec(rawLine)?.[0].length ?? 0;
    const startOffset = lineStart + leading;
    const endOffset = Math.max(startOffset, rawEnd - trailing);
    records.push({
      text: rawLine.trim(),
      startOffset,
      endOffset,
      sourceSpan: typeof block.sourceSpan === 'function' ? block.sourceSpan(startOffset, endOffset) : undefined
    });
    lineStart = rawEnd + 1;
  }
  return records;
}

function falseClaims() {
  return {
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    binaryEquivalenceClaim: false,
    timingEquivalenceClaim: false,
    targetAdapterReadinessClaim: false
  };
}

function idFrom(text, fallback) {
  return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback;
}

function safeId(value) {
  return String(value ?? 'unknown').replace(/[^A-Za-z0-9_$-]+/g, '_');
}

function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => {
    if (value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }));
}
