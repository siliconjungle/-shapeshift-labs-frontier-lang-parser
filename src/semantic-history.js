import { createRowIdentityTracker } from './row-identity.js';
import { pushSemanticUnknownRow, readSemanticAuthoredLines } from './semantic-unknown-row.js';
import { allSemanticHistoryRecords, semanticHistoryQuery, summarizeSemanticHistory } from './semantic-history-query.js';

const GROUPS = {
  actor: 'actors',
  recordSource: 'recordSources',
  source: 'sources',
  ownershipRegion: 'ownershipRegions',
  semanticCandidate: 'semanticCandidates',
  claim: 'semanticClaims',
  acceptedFact: 'acceptedFacts',
  rejectedTheory: 'rejectedTheories',
  importedParserEvidence: 'importedParserEvidence',
  proofAttempt: 'proofAttempts',
  proofId: 'proofRefs',
  reviewer: 'reviewers',
  admission: 'admissions',
  lineage: 'lineageEvents',
  patchAncestry: 'patchAncestry',
  mergeDecision: 'mergeDecisions',
  replay: 'replayLinks',
  evidence: 'evidence',
  missingEvidence: 'missingEvidence',
  proofGap: 'proofGaps'
};

export function parseSemanticHistoryBlock(block) {
  const name = nameFrom(block.header);
  const rowIdentity = createRowIdentityTracker();
  const history = {
    kind: 'frontier.lang.authoredSemanticHistory',
    version: 1,
    id: idFrom(block.header, `semantic_history_${safeId(name)}`),
    createdAt: readLine('createdAt', block.body),
    language: readLine('language', block.body) ?? readLine('sourceLanguage', block.body),
    sourcePath: readLine('sourcePath', block.body) ?? readLine('path', block.body),
    sourceHash: readLine('sourceHash', block.body),
    baseHash: readLine('baseHash', block.body) ?? readLine('beforeHash', block.body),
    targetHash: readLine('targetHash', block.body) ?? readLine('afterHash', block.body),
    evidenceIds: readListLine('evidence', block.body) ?? readListLine('evidenceIds', block.body) ?? [],
    proofIds: readListLine('proof', block.body) ?? readListLine('proofIds', block.body) ?? [],
    actors: [],
    recordSources: [],
    sources: [],
    ownershipRegions: [],
    semanticCandidates: [],
    semanticClaims: [],
    acceptedFacts: [],
    rejectedTheories: [],
    importedParserEvidence: [],
    proofAttempts: [],
    proofRefs: [],
    reviewers: [],
    admissions: [],
    lineageEvents: [],
    patchAncestry: [],
    mergeDecisions: [],
    replayLinks: [],
    evidence: [],
    missingEvidence: [],
    proofGaps: [],
    unknownRows: [],
    parser: { status: 'authored', errors: rowIdentity.errors },
    metadata: { name, authoredFrontierSource: true, authoredSemanticHistory: true }
  };

  for (const authoredLine of readSemanticAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#') || isHistoryPropertyLine(line)) continue;
    const match = /^([A-Za-z_$][\w$-]*)\s+([^\s{}]+)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, rest] = match;
    const normalized = normalizeSemanticHistoryRowKind(rowKind);
    const record = parseSemanticHistoryRow(normalized, rowName, rest, history, authoredLine);
    const group = GROUPS[normalized];
    if (record && group) {
      rowIdentity.push(history[group], record, { rowKind, normalizedRowKind: normalized, name: rowName });
    } else {
      pushUnsupportedHistoryRow(history, rowKind, normalized, rowName, rest, authoredLine);
    }
  }

  history.actor = history.actors[0];
  history.recordSource = history.recordSources[0];
  history.reviewer = history.reviewers[0];
  history.admission = history.admissions[0];
  history.semanticClaims.push(
    ...history.acceptedFacts.map((claim) => ({ ...claim, status: claim.status ?? 'accepted' })),
    ...history.rejectedTheories.map((claim) => ({ ...claim, status: claim.status ?? 'rejected' }))
  );
  history.evidenceIds = unique([
    ...history.evidenceIds,
    ...ids(history.evidence),
    ...history.semanticCandidates.flatMap((record) => record.evidenceIds ?? []),
    ...history.semanticClaims.flatMap((record) => record.evidenceIds ?? []),
    ...history.importedParserEvidence.flatMap((record) => [record.evidenceId, ...(record.evidenceIds ?? [])]),
    ...history.proofAttempts.flatMap((record) => record.evidenceIds ?? []),
    ...history.reviewers.flatMap((record) => record.evidenceIds ?? []),
    ...history.admissions.flatMap((record) => record.evidenceIds ?? []),
    ...history.lineageEvents.flatMap((record) => record.evidenceIds ?? []),
    ...history.mergeDecisions.flatMap((record) => record.evidenceIds ?? [])
  ]);
  history.proofIds = unique([
    ...history.proofIds,
    ...history.semanticCandidates.flatMap((record) => record.proofIds ?? []),
    ...history.semanticClaims.flatMap((record) => record.proofIds ?? []),
    ...history.proofRefs.flatMap((record) => [record.proofId, ...(record.proofIds ?? [])]),
    ...history.proofAttempts.flatMap((record) => [record.proofId, ...(record.proofIds ?? [])]),
    ...history.reviewers.flatMap((record) => record.proofIds ?? []),
    ...history.admissions.flatMap((record) => record.proofIds ?? []),
    ...history.lineageEvents.flatMap((record) => record.proofIds ?? []),
    ...history.mergeDecisions.flatMap((record) => record.proofIds ?? [])
  ]);
  history.summary = summarizeSemanticHistory(history);
  history.query = semanticHistoryQuery(history);

  return {
    id: history.id,
    history,
    record: history,
    records: allSemanticHistoryRecords(history),
    summary: {
      historyCount: 1,
      ...history.summary
    },
    metadata: { name }
  };
}

export function normalizeSemanticHistoryRowKind(kind) {
  if (kind === 'record' || kind === 'historySource' || kind === 'recordSource') return 'recordSource';
  if (kind === 'region' || kind === 'ownership' || kind === 'ownershipRegion') return 'ownershipRegion';
  if (kind === 'candidate' || kind === 'semanticCandidate') return 'semanticCandidate';
  if (kind === 'semanticClaim') return 'claim';
  if (kind === 'fact' || kind === 'accepted' || kind === 'acceptedFact') return 'acceptedFact';
  if (kind === 'theory' || kind === 'rejected' || kind === 'rejectedTheory') return 'rejectedTheory';
  if (kind === 'parser' || kind === 'parserEvidence' || kind === 'importedParserEvidence') return 'importedParserEvidence';
  if (kind === 'proof' || kind === 'proofAttempt') return 'proofAttempt';
  if (kind === 'lineage' || kind === 'lineageEvent') return 'lineage';
  if (kind === 'patch' || kind === 'ancestry' || kind === 'patchAncestry') return 'patchAncestry';
  if (kind === 'decision' || kind === 'merge' || kind === 'mergeDecision') return 'mergeDecision';
  if (kind === 'replay' || kind === 'replayLink') return 'replay';
  if (kind === 'gap') return 'proofGap';
  if (kind === 'missing') return 'missingEvidence';
  return kind;
}

function parseSemanticHistoryRow(kind, name, text, history, authoredLine) {
  const common = commonRecord(kind, name, text, history, authoredLine);
  if (kind === 'actor') return cleanRecord({ ...common, id: idFrom(text, name), kind: word('kind', text) ?? word('actorKind', text), role: word('role', text), displayName: quoted('displayName', text) ?? quoted('name', text) ?? word('displayName', text), runId: word('run', text) ?? word('runId', text), lane: word('lane', text), taskId: word('task', text) ?? word('taskId', text) });
  if (kind === 'recordSource') return cleanRecord({ ...common, id: idFrom(text, name), sourceId: word('source', text) ?? word('sourceId', text) ?? name, sourceKind: word('kind', text) ?? word('sourceKind', text), sourcePath: word('sourcePath', text) ?? word('path', text), sourceHash: word('sourceHash', text) ?? word('hash', text), href: word('href', text) ?? word('url', text), importId: word('import', text) ?? word('importId', text), runId: word('run', text) ?? word('runId', text), jobId: word('job', text) ?? word('jobId', text), lane: word('lane', text), taskId: word('task', text) ?? word('taskId', text) });
  if (kind === 'source') return cleanRecord({ ...common, id: idFrom(text, name), importId: word('import', text) ?? word('importId', text), language: word('language', text) ?? history.language, sourcePath: word('sourcePath', text) ?? word('path', text) ?? history.sourcePath, sourceHash: word('sourceHash', text) ?? word('hash', text) ?? history.sourceHash, baseHash: word('baseHash', text) ?? word('beforeHash', text) ?? history.baseHash, targetHash: word('targetHash', text) ?? word('afterHash', text) ?? history.targetHash });
  if (kind === 'ownershipRegion') return cleanRecord({ ...common, key: word('key', text) ?? word('ownershipKey', text) ?? word('conflictKey', text) ?? name, regionKind: word('regionKind', text) ?? word('kind', text), granularity: word('granularity', text), language: word('language', text) ?? history.language, sourcePath: word('sourcePath', text) ?? word('path', text) ?? history.sourcePath, sourceHash: word('sourceHash', text) ?? history.sourceHash, symbolId: word('symbol', text) ?? word('symbolId', text), symbolName: word('symbolName', text) ?? word('name', text) });
  if (kind === 'semanticCandidate') return cleanRecord({ ...common, importResultId: word('import', text) ?? word('importResultId', text), patchId: word('patch', text) ?? word('patchId', text), sourcePath: word('sourcePath', text) ?? word('path', text) ?? history.sourcePath, baseHash: word('baseHash', text) ?? history.baseHash, targetHash: word('targetHash', text) ?? history.targetHash, readiness: word('readiness', text), ownershipKeys: list(text, 'ownership', 'ownershipKey', 'ownershipKeys'), replayIds: list(text, 'replay', 'replayIds') });
  if (kind === 'claim' || kind === 'acceptedFact' || kind === 'rejectedTheory') return cleanRecord({ ...common, claimKind: word('claimKind', text) ?? word('kind', text) ?? (kind === 'rejectedTheory' ? 'theory' : 'fact'), status: word('status', text) ?? (kind === 'acceptedFact' ? 'accepted' : kind === 'rejectedTheory' ? 'rejected' : undefined), subject: word('subject', text) ?? word('symbol', text) ?? word('semanticNode', text) ?? word('conflictKey', text) ?? name, predicate: word('predicate', text) ?? word('relation', text), object: quoted('object', text) ?? word('object', text) ?? word('value', text) ?? word('expected', text), text: quoted('text', text) ?? quoted('summary', text), replayIds: list(text, 'replay', 'replayIds') });
  if (kind === 'importedParserEvidence') return cleanRecord({ ...common, evidenceId: word('evidence', text) ?? word('evidenceId', text) ?? common.id, importId: word('import', text) ?? word('importId', text), parserId: word('parser', text) ?? word('parserId', text), parserKind: word('parserKind', text) ?? word('kind', text), language: word('language', text) ?? history.language, sourcePath: word('sourcePath', text) ?? word('path', text) ?? history.sourcePath, sourceHash: word('sourceHash', text) ?? history.sourceHash, astHash: word('astHash', text), semanticIndexHash: word('semanticIndexHash', text), status: word('status', text) ?? 'unknown', replayIds: list(text, 'replay', 'replayIds') });
  if (kind === 'proofAttempt') return cleanRecord({ ...common, proofId: word('proof', text) ?? word('proofId', text) ?? common.id, proofKind: word('proofKind', text) ?? word('kind', text), status: word('status', text) ?? 'unknown', proverId: word('prover', text) ?? word('proverId', text), claimIds: list(text, 'claim', 'claimIds'), replayIds: list(text, 'replay', 'replayIds'), command: quoted('command', text) ?? word('command', text), resultHash: word('resultHash', text) ?? word('proofHash', text) });
  if (kind === 'proofId') return cleanRecord({ ...common, proofId: word('proof', text) ?? word('proofId', text) ?? name, proofKind: word('proofKind', text) ?? word('kind', text), status: word('status', text), path: word('path', text), command: quoted('command', text) ?? word('command', text), resultHash: word('resultHash', text) ?? word('proofHash', text) });
  if (kind === 'reviewer') return cleanRecord({ ...common, reviewerId: word('reviewer', text) ?? word('reviewerId', text) ?? name, reviewerKind: word('kind', text) ?? word('reviewerKind', text), status: word('status', text), reviewedAt: word('reviewedAt', text), decisionIds: list(text, 'decision', 'decisionIds'), claimIds: list(text, 'claim', 'claimIds'), patchIds: list(text, 'patch', 'patchIds'), replayIds: list(text, 'replay', 'replayIds') });
  if (kind === 'admission') return cleanRecord({ ...common, admissionId: word('admission', text) ?? word('admissionId', text) ?? common.id, status: word('status', text) ?? 'review', readiness: word('readiness', text), decision: word('decision', text), action: word('action', text), admittedAt: word('admittedAt', text), reviewerId: word('reviewer', text) ?? word('reviewerId', text), claimIds: list(text, 'claim', 'claimIds'), patchIds: list(text, 'patch', 'patchIds'), reasonCodes: list(text, 'reason', 'reasonCode', 'reasonCodes'), missingEvidence: list(text, 'missing', 'missingEvidence') });
  if (kind === 'lineage') return cleanRecord({ ...common, eventKind: word('event', text) ?? word('eventKind', text) ?? word('kind', text), from: anchorFrom(text, 'from', history), to: anchorsFrom(text, history), confidence: number('confidence', text), operationId: word('operation', text) ?? word('operationId', text), actorId: word('actor', text) ?? word('actorId', text), seq: number('seq', text), deps: list(text, 'dep', 'deps'), heads: list(text, 'head', 'heads') });
  if (kind === 'patchAncestry') return cleanRecord({ ...common, patchId: word('patch', text) ?? word('patchId', text) ?? common.id ?? name, parentPatchIds: list(text, 'parent', 'parents', 'parentPatch', 'parentPatchIds'), ancestorPatchIds: list(text, 'ancestor', 'ancestors', 'ancestorPatch', 'ancestorPatchIds'), baseHash: word('baseHash', text) ?? history.baseHash, targetHash: word('targetHash', text) ?? history.targetHash, parentHashes: list(text, 'parentHash', 'parentHashes'), ancestorHashes: list(text, 'ancestorHash', 'ancestorHashes') });
  if (kind === 'mergeDecision') return cleanRecord({ ...common, decision: word('decision', text) ?? word('status', text), status: word('status', text) ?? word('decision', text), decidedAt: word('decidedAt', text), claimIds: list(text, 'claim', 'claimIds'), acceptedClaimIds: list(text, 'acceptedClaim', 'acceptedClaimIds'), rejectedClaimIds: list(text, 'rejectedClaim', 'rejectedClaimIds'), patchIds: list(text, 'patch', 'patchIds'), reasonCodes: list(text, 'reason', 'reasonCode', 'reasonCodes') });
  if (kind === 'replay') return cleanRecord({ ...common, kind: word('kind', text) ?? 'replay', href: word('href', text) ?? word('url', text), path: word('path', text), command: quoted('command', text) ?? word('command', text), hash: word('hash', text), targetId: word('target', text) ?? word('targetId', text) });
  if (kind === 'evidence') return cleanRecord({ ...common, evidenceKind: word('kind', text) ?? word('evidenceKind', text), status: word('status', text) ?? 'unknown', path: word('path', text), command: quoted('command', text) ?? word('command', text), summary: quoted('summary', text) });
  if (kind === 'missingEvidence') return cleanRecord({ ...common, reasonCode: word('reason', text) ?? word('reasonCode', text) ?? word('code', text) ?? name, status: word('status', text) ?? 'missing', summary: quoted('summary', text) });
  if (kind === 'proofGap') return cleanRecord({ ...common, code: word('code', text) ?? word('reasonCode', text) ?? name, status: word('status', text) ?? 'missing', summary: quoted('summary', text), failClosed: true, autoMergeClaim: false, semanticEquivalenceClaim: false });
  return undefined;
}

function commonRecord(kind, name, text, history, authoredLine) {
  return cleanRecord({
    id: idFrom(text, `${recordPrefix(kind)}_${safeId(name)}`),
    name,
    sourcePath: word('sourcePath', text) ?? word('path', text) ?? history.sourcePath,
    sourceHash: word('sourceHash', text) ?? history.sourceHash,
    conflictKeys: list(text, 'conflict', 'conflictKey', 'conflictKeys'),
    evidenceIds: list(text, 'evidence', 'evidenceIds'),
    proofIds: list(text, 'proof', 'proofIds', 'proofEvidence', 'proofEvidenceIds'),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: { authoredName: name, authoredRowKind: kind, autoMergeClaim: false, semanticEquivalenceClaim: false }
  });
}

function pushUnsupportedHistoryRow(history, rowKind, normalized, rowName, rest, authoredLine) {
  pushSemanticUnknownRow(history, {
    surfaceKind: 'frontier.lang.authoredSemanticHistory',
    idPrefix: 'semantic_history',
    reason: 'unsupported-semantic-history-row',
    rowKind,
    normalizedRowKind: normalized,
    rowName,
    text: rest,
    authoredLine,
    rowLabel: 'semanticHistory'
  });
}

function isHistoryPropertyLine(line) {
  const property = /^(createdAt|language|sourceLanguage|sourcePath|path|sourceHash|baseHash|beforeHash|targetHash|afterHash|evidence|evidenceIds|proof|proofIds)\s+/.exec(line)?.[1];
  if (!property) return false;
  if ((property === 'evidence' || property === 'evidenceIds' || property === 'proof' || property === 'proofIds') && /@id\(/.test(line)) return false;
  return true;
}

function anchorFrom(text, label, history) {
  const key = word(label, text) ?? word(`${label}Key`, text);
  if (!key) return undefined;
  return cleanRecord({
    key,
    id: word(`${label}Id`, text),
    kind: word(`${label}Kind`, text) ?? word('anchorKind', text),
    language: word('language', text) ?? history.language,
    sourcePath: word(`${label}Path`, text) ?? word('sourcePath', text) ?? history.sourcePath,
    sourceHash: word(`${label}Hash`, text) ?? word('sourceHash', text) ?? history.sourceHash,
    symbolId: word(`${label}Symbol`, text) ?? word(`${label}SymbolId`, text),
    symbolName: word(`${label}SymbolName`, text)
  });
}

function anchorsFrom(text, history) {
  return (list(text, 'to', 'toKey', 'toKeys') ?? []).map((key) => cleanRecord({
    key,
    kind: word('toKind', text) ?? word('anchorKind', text),
    language: word('language', text) ?? history.language,
    sourcePath: word('toPath', text) ?? word('sourcePath', text) ?? history.sourcePath,
    sourceHash: word('toHash', text) ?? word('sourceHash', text) ?? history.sourceHash,
    symbolId: word('toSymbol', text) ?? word('toSymbolId', text),
    symbolName: word('toSymbolName', text)
  }));
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'SemanticHistory'; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readListLine(label, body) {
  const line = readLine(label, body);
  return line ? splitList(line) : undefined;
}
function word(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(unquotedText(text))?.[1]?.trim(); }
function quoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function number(label, text) {
  const value = word(label, text);
  return value === undefined ? undefined : Number(value);
}
function list(text, ...labels) {
  const source = unquotedText(text);
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(source)?.[1]?.trim();
    if (value) return splitList(value);
  }
  return undefined;
}
function splitList(value) { return String(value ?? '').split(/[|,]/).map((item) => item.trim()).filter(Boolean); }
function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function unique(values = []) { return [...new Set(values.filter(Boolean))]; }
function recordPrefix(kind) { return String(kind).replace(/[A-Z]/g, (value) => `_${value.toLowerCase()}`).replace(/^-/, ''); }
function safeId(value) { return String(value ?? 'value').replace(/[^A-Za-z0-9_$-]+/g, '_'); }
function unquotedText(text) { return text.replace(/"[^"]*"|'[^']*'/g, (match) => ' '.repeat(match.length)); }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0) && !(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)));
}
