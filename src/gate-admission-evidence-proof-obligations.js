export function proofObligationRecord(name, text, authoredLine, rowKind) {
  return cleanRecord({
    kind: 'frontier.lang.gateAdmissionEvidence.proofObligation',
    version: 1,
    id: idFrom(text, `gate_admission_obligation_${safeId(name)}`),
    name,
    obligationKind: readInlineWord('kind', text) ?? readInlineWord('obligationKind', text) ?? 'proof',
    status: readInlineWord('status', text) ?? 'missing',
    readiness: readInlineWord('readiness', text),
    capability: readInlineWord('capability', text),
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    routeIds: readInlineList(text, 'routeIds'),
    language: readInlineWord('language', text) ?? readInlineWord('sourceLanguage', text),
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? readInlineWord('language', text),
    target: readInlineWord('target', text) ?? readInlineWord('targetLanguage', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    sourceHash: readInlineWord('sourceHash', text),
    targetHash: readInlineWord('targetHash', text),
    outputHash: readInlineWord('outputHash', text),
    telemetryHash: readInlineWord('telemetryHash', text),
    gateIds: readInlineList(text, 'gate', 'gateId', 'gateIds'),
    admissionIds: readInlineList(text, 'admission', 'admissionId', 'admissionIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'),
    requiredSignals: readInlineList(text, 'requiredSignal', 'requiredSignals'),
    providedSignals: readInlineList(text, 'providedSignal', 'providedSignals'),
    missingSignals: readInlineList(text, 'missingSignal', 'missingSignals'),
    missingEvidence: readInlineList(text, 'missingEvidence'),
    reasonCodes: readInlineList(text, 'reasonCode', 'reasonCodes', 'reason', 'reasons'),
    summary: readInlineQuoted('summary', text) ?? readInlineQuoted('message', text),
    failClosed: true,
    ...falseClaims(),
    authoredText: authoredLine.text,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({ authoredName: name, authoredRowKind: rowKind, ...falseClaims() })
  });
}

export function unknownRowRecord(line, authoredLine) {
  const rowKind = /^([A-Za-z_$][\w$-]*)\b/.exec(line)?.[1];
  const name = new RegExp('^[A-Za-z_$][\\w$-]*\\s+([A-Za-z_$@/.:*-][\\w$./@:*+-]*)').exec(line)?.[1];
  return cleanRecord({
    kind: 'frontier.lang.gateAdmissionEvidence.unknownRow',
    version: 1,
    id: `gate_admission_unknown_${safeId(rowKind ?? 'row')}_${authoredLine.startOffset}`,
    rowKind,
    normalizedRowKind: 'unknown',
    name: name ?? rowKind ?? 'unknown',
    status: 'unsupported',
    reason: 'unsupported-gate-admission-row',
    code: 'unsupported-gate-admission-row',
    failClosed: true,
    ...falseClaims(),
    authoredText: line,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({ authoredRowKind: rowKind, ...falseClaims() })
  });
}

export function unsupportedRowProofGapRecord(unknownRow, authoredLine) {
  return cleanRecord({
    kind: 'frontier.lang.gateAdmissionEvidence.proofGap',
    version: 1,
    id: `gate_admission_gap_unsupported_${authoredLine.startOffset}`,
    name: unknownRow.name,
    code: 'unsupported-gate-admission-row',
    status: 'missing',
    evidenceIds: [unknownRow.id],
    summary: `Unsupported gateEvidence row "${unknownRow.rowKind ?? 'unknown'}" requires parser support before admission.`,
    failClosed: true,
    ...falseClaims(),
    authoredText: authoredLine.text,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({ unknownRowId: unknownRow.id, authoredRowKind: unknownRow.rowKind, ...falseClaims() })
  });
}

export function parserUnsupportedRowError(unknownRow) {
  return cleanRecord({
    code: 'unsupported-gate-admission-row',
    message: `Unsupported gateEvidence row "${unknownRow.rowKind ?? 'unknown'}" must be reviewed before admission.`,
    rowId: unknownRow.id,
    rowKind: unknownRow.rowKind,
    sourceSpan: unknownRow.sourceSpan
  });
}

function falseClaims() {
  return {
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    gatePassImpliesAdmissionClaim: false,
    targetAdapterReadinessClaim: false
  };
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function safeId(value) { return String(value ?? 'record').replace(/[^A-Za-z0-9_$-]+/g, '_'); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(unquotedText(text))?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineList(text, ...labels) {
  const source = unquotedText(text);
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(source)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function unquotedText(text) { return text.replace(/"[^"]*"|'[^']*'/g, (match) => ' '.repeat(match.length)); }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0) && !(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)));
}
