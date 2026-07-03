export function parseGateAdmissionEvidenceBlock(block) {
  const name = nameFrom(block.header);
  const surface = {
    kind: 'frontier.lang.authoredGateAdmissionEvidenceInput',
    version: 1,
    schema: 'frontier.lang.authoredGateAdmissionEvidenceInput.v1',
    id: idFrom(block.header, `gate_admission_${safeId(name)}`),
    name,
    gates: [],
    evidence: [],
    admissions: [],
    proofGaps: [],
    parser: { status: 'authored', errors: [] },
    claims: falseClaims(),
    metadata: { authoredName: name, authoredBlockKind: block.kind }
  };
  for (const authoredLine of readAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#')) continue;
    const match = /^(gate|evidence|proofEvidence|admission|admissionDecision|gap|proofGap)\s+([A-Za-z_$@/.:*-][\w$./@:*+-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, text] = match;
    if (rowKind === 'gate') surface.gates.push(gateRecord(rowName, text, authoredLine));
    else if (rowKind === 'evidence' || rowKind === 'proofEvidence') surface.evidence.push(evidenceRecord(rowName, text, authoredLine, rowKind));
    else if (rowKind === 'admission' || rowKind === 'admissionDecision') surface.admissions.push(admissionRecord(rowName, text, authoredLine));
    else surface.proofGaps.push(proofGapRecord(rowName, text, authoredLine));
  }
  surface.gateIds = ids(surface.gates);
  surface.evidenceIds = ids(surface.evidence);
  surface.proofEvidenceIds = surface.evidence.filter((record) => record.proof).map((record) => record.id).filter(Boolean);
  surface.admissionIds = ids(surface.admissions);
  surface.proofGapCodes = uniqueStrings(surface.proofGaps.map((record) => record.code));
  surface.missingEvidence = uniqueStrings([
    ...surface.gates.flatMap((record) => record.missingEvidence ?? []),
    ...surface.admissions.flatMap((record) => record.missingEvidence ?? []),
    ...surface.proofGaps.map((record) => record.code)
  ]);
  surface.summary = {
    gateCount: surface.gates.length,
    evidenceCount: surface.evidence.length,
    proofEvidenceCount: surface.proofEvidenceIds.length,
    admissionCount: surface.admissions.length,
    proofGapCount: surface.proofGaps.length,
    missingEvidenceCount: surface.missingEvidence.length,
    passedGateCount: surface.gates.filter((record) => record.status === 'passed').length,
    failedGateCount: surface.gates.filter((record) => record.status === 'failed').length,
    blockedAdmissionCount: surface.admissions.filter((record) => /blocked|missing|failed|review/.test(record.status ?? '')).length
  };
  return surface;
}

export function mergeGateAdmissionEvidenceBlocks(blocks) {
  const gates = uniqueRecords(blocks.flatMap((block) => block.gates ?? []));
  const evidence = uniqueRecords(blocks.flatMap((block) => block.evidence ?? []));
  const admissions = uniqueRecords(blocks.flatMap((block) => block.admissions ?? []));
  const proofGaps = uniqueRecords(blocks.flatMap((block) => block.proofGaps ?? []));
  const proofEvidenceIds = evidence.filter((record) => record.proof).map((record) => record.id).filter(Boolean);
  const missingEvidence = uniqueStrings([
    ...gates.flatMap((record) => record.missingEvidence ?? []),
    ...admissions.flatMap((record) => record.missingEvidence ?? []),
    ...proofGaps.map((record) => record.code)
  ]);
  return {
    kind: 'frontier.lang.authoredGateAdmissionEvidenceInput',
    version: 1,
    schema: 'frontier.lang.authoredGateAdmissionEvidenceInput.v1',
    id: blocks.length === 1 ? blocks[0].id : 'gateAdmissionEvidence:source',
    blocks,
    blockIds: ids(blocks),
    gates,
    evidence,
    admissions,
    proofGaps,
    gateIds: ids(gates),
    evidenceIds: ids(evidence),
    proofEvidenceIds,
    admissionIds: ids(admissions),
    proofGapCodes: uniqueStrings(proofGaps.map((record) => record.code)),
    missingEvidence,
    summary: {
      blockCount: blocks.length,
      gateCount: gates.length,
      evidenceCount: evidence.length,
      proofEvidenceCount: proofEvidenceIds.length,
      admissionCount: admissions.length,
      proofGapCount: proofGaps.length,
      missingEvidenceCount: missingEvidence.length,
      passedGateCount: gates.filter((record) => record.status === 'passed').length,
      failedGateCount: gates.filter((record) => record.status === 'failed').length,
      blockedAdmissionCount: admissions.filter((record) => /blocked|missing|failed|review/.test(record.status ?? '')).length
    },
    claims: falseClaims(),
    metadata: { authoredGateAdmissionBlockIds: ids(blocks) }
  };
}

function gateRecord(name, text, authoredLine) {
  const evidenceIds = readInlineList(text, 'evidence', 'evidenceIds');
  return cleanRecord({
    kind: 'frontier.lang.gateAdmissionEvidence.gate',
    version: 1,
    id: idFrom(text, `gate_${safeId(name)}`),
    name,
    gateKind: readInlineWord('kind', text) ?? readInlineWord('gateKind', text) ?? 'gate',
    status: readInlineWord('status', text) ?? 'unknown',
    required: readInlineFlag('required', text),
    command: readInlineQuoted('command', text) ?? readInlineWord('command', text),
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    routeIds: readInlineList(text, 'routeIds'),
    language: readInlineWord('language', text) ?? readInlineWord('sourceLanguage', text),
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? readInlineWord('language', text),
    target: readInlineWord('target', text) ?? readInlineWord('targetLanguage', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    sourceHash: readInlineWord('sourceHash', text),
    outputHash: readInlineWord('outputHash', text),
    telemetryHash: readInlineWord('telemetryHash', text),
    subjectIds: readInlineList(text, 'subject', 'subjects', 'subjectId', 'subjectIds'),
    semanticChangeIds: readInlineList(text, 'semanticChange', 'semanticChangeId', 'semanticChangeIds'),
    semanticEditScriptIds: readInlineList(text, 'semanticEditScript', 'semanticEditScriptId', 'semanticEditScriptIds', 'script', 'scriptIds'),
    semanticEditReplayIds: readInlineList(text, 'semanticEditReplay', 'semanticEditReplayId', 'semanticEditReplayIds', 'replay', 'replayIds'),
    evidenceIds,
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'),
    missingEvidence: readInlineList(text, 'missingEvidence'),
    reasonCodes: readInlineList(text, 'reasonCode', 'reasonCodes'),
    failClosed: true,
    claims: falseClaims(),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({ authoredName: name, summary: readInlineQuoted('summary', text), ...falseClaims() })
  });
}

function evidenceRecord(name, text, authoredLine, rowKind) {
  return cleanRecord({
    kind: 'frontier.lang.gateAdmissionEvidence.evidence',
    version: 1,
    id: idFrom(text, `evidence_${safeId(name)}`),
    name,
    evidenceKind: readInlineWord('kind', text) ?? 'evidence',
    status: readInlineWord('status', text) ?? 'unknown',
    proof: rowKind === 'proofEvidence' || readInlineFlag('proof', text),
    path: readInlineWord('path', text),
    hash: readInlineWord('hash', text),
    command: readInlineQuoted('command', text) ?? readInlineWord('command', text),
    probeId: readInlineWord('probeId', text) ?? readInlineWord('probe', text),
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    routeIds: readInlineList(text, 'routeIds'),
    language: readInlineWord('language', text) ?? readInlineWord('sourceLanguage', text),
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? readInlineWord('language', text),
    target: readInlineWord('target', text) ?? readInlineWord('targetLanguage', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    sourceHash: readInlineWord('sourceHash', text),
    outputHash: readInlineWord('outputHash', text),
    telemetryHash: readInlineWord('telemetryHash', text),
    gateIds: readInlineList(text, 'gate', 'gateId', 'gateIds'),
    admissionIds: readInlineList(text, 'admission', 'admissionId', 'admissionIds'),
    summary: readInlineQuoted('summary', text),
    failClosed: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({ authoredName: name, authoredRowKind: rowKind, ...falseClaims() })
  });
}

function admissionRecord(name, text, authoredLine) {
  const status = readInlineWord('status', text) ?? readInlineWord('admissionStatus', text) ?? 'review';
  return cleanRecord({
    kind: 'frontier.lang.gateAdmissionEvidence.admission',
    version: 1,
    id: idFrom(text, `admission_${safeId(name)}`),
    name,
    status,
    action: readInlineWord('action', text) ?? readInlineWord('admissionAction', text) ?? 'review',
    readiness: readInlineWord('readiness', text) ?? readInlineWord('admissionReadiness', text),
    decision: readInlineWord('decision', text),
    classification: readInlineWord('classification', text),
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    routeIds: readInlineList(text, 'routeIds'),
    language: readInlineWord('language', text) ?? readInlineWord('sourceLanguage', text),
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? readInlineWord('language', text),
    target: readInlineWord('target', text) ?? readInlineWord('targetLanguage', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    baseHash: readInlineWord('baseHash', text),
    targetHash: readInlineWord('targetHash', text),
    gateIds: readInlineList(text, 'gate', 'gateId', 'gateIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'),
    missingEvidence: readInlineList(text, 'missingEvidence'),
    conflictKeys: readInlineList(text, 'conflictKey', 'conflictKeys'),
    reasonCodes: readInlineList(text, 'reasonCode', 'reasonCodes', 'reason', 'reasons'),
    semanticEditScriptIds: readInlineList(text, 'semanticEditScript', 'semanticEditScriptId', 'semanticEditScriptIds', 'script', 'scriptIds'),
    semanticEditReplayIds: readInlineList(text, 'semanticEditReplay', 'semanticEditReplayId', 'semanticEditReplayIds', 'replay', 'replayIds'),
    reviewRequired: true,
    failClosed: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({ authoredName: name, summary: readInlineQuoted('summary', text), ...falseClaims() })
  });
}

function proofGapRecord(name, text, authoredLine) {
  const code = readInlineWord('code', text) ?? name;
  return cleanRecord({
    kind: 'frontier.lang.gateAdmissionEvidence.proofGap',
    version: 1,
    id: idFrom(text, `gate_admission_gap_${safeId(code)}`),
    name,
    code,
    status: readInlineWord('status', text) ?? 'missing',
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    routeIds: readInlineList(text, 'routeIds'),
    gateIds: readInlineList(text, 'gate', 'gateId', 'gateIds'),
    admissionIds: readInlineList(text, 'admission', 'admissionId', 'admissionIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    summary: readInlineQuoted('summary', text) ?? readInlineQuoted('message', text),
    failClosed: true,
    ...falseClaims(),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({ authoredName: name, ...falseClaims() })
  });
}

function readAuthoredLines(block) {
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
    gatePassImpliesAdmissionClaim: false
  };
}

function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record?.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function uniqueStrings(values = []) { return [...new Set(values.filter(Boolean).map(String))]; }
function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'GateAdmissionEvidence'; }
function safeId(value) { return String(value ?? 'record').replace(/[^A-Za-z0-9_$-]+/g, '_'); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(unquotedText(text))?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineFlag(label, text) { return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(unquotedText(text)) || undefined; }
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
