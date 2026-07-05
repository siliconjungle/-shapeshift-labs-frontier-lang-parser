import { createRowIdentityTracker } from './row-identity.js';
import { parseLowLevelResourceRecord } from './resource-graph-low-level.js';
import { allResourceGraphRecords, deriveResourceGraphStatus, resourceGraphBlockerReasonCodes, summarizeResourceGraph } from './resource-graph-summary.js';

const GROUPS = {
  resource: 'resources',
  owner: 'owners',
  loan: 'loans',
  alias: 'aliases',
  move: 'moves',
  drop: 'drops',
  escape: 'escapes',
  lifetimeRegion: 'lifetimeRegions',
  lifetimeRelation: 'lifetimeRelations',
  borrowScope: 'borrowScopes',
  unsafeBoundary: 'unsafeBoundaries',
  memoryRegion: 'memoryRegions',
  dataLayout: 'dataLayouts',
  pointerEdge: 'pointerEdges',
  memoryAccess: 'memoryAccesses',
  abiBoundary: 'abiBoundaries',
  synchronizationEdge: 'synchronizationEdges',
  trap: 'traps',
  undefinedBehavior: 'undefinedBehaviors',
  conflict: 'conflicts',
  proofObligation: 'proofObligations',
  evidence: 'evidence',
  sourceMap: 'sourceMaps',
  missingEvidence: 'missingEvidence'
};

export function parseResourceGraphBlock(block) {
  const name = nameFrom(block.header);
  const rowIdentity = createRowIdentityTracker();
  const graph = {
    kind: 'frontier.lang.semanticResourceGraph',
    version: 1,
    id: idFrom(block.header, `resource_graph_${name}`),
    sourceLanguage: readLine('sourceLanguage', block.body) ?? readLine('language', block.body),
    sourcePath: readLine('sourcePath', block.body) ?? readLine('path', block.body),
    sourceHash: readLine('sourceHash', block.body),
    status: readLine('status', block.body) ?? 'partial',
    evidenceIds: readListLine('evidence', block.body) ?? readListLine('evidenceIds', block.body) ?? [],
    resources: [],
    owners: [],
    loans: [],
    aliases: [],
    moves: [],
    drops: [],
    escapes: [],
    lifetimeRegions: [],
    lifetimeRelations: [],
    outlives: [],
    borrowScopes: [],
    borrowScopeRegions: [],
    unsafeBoundaries: [],
    memoryRegions: [],
    dataLayouts: [],
    pointerEdges: [],
    memoryAccesses: [],
    abiBoundaries: [],
    synchronizationEdges: [],
    traps: [],
    undefinedBehaviors: [],
    conflicts: [],
    proofObligations: [],
    evidence: [],
    sourceMaps: [],
    missingEvidence: [],
    parser: { status: 'authored', errors: rowIdentity.errors },
    claims: {
      borrowCheckerClaim: false,
      aliasSafetyClaim: false,
      lifetimeSoundnessClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: { name }
  };

  for (const authoredLine of readAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#') || isGraphPropertyLine(line)) continue;
    const match = /^([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, rest] = match;
    const normalized = normalizeRowKind(rowKind);
    const record = parseResourceRecord(normalized, rowName, rest, graph, authoredLine);
    const group = GROUPS[normalized];
    if (record && group) rowIdentity.push(graph[group], record, { rowKind, normalizedRowKind: normalized, name: rowName });
  }

  graph.outlives = graph.lifetimeRelations;
  graph.borrowScopeRegions = graph.borrowScopes;
  graph.summary = summarizeResourceGraph(graph);
  graph.status = deriveResourceGraphStatus(graph.status, graph.summary);
  graph.query = {
    resourceIds: ids(graph.resources),
    ownerIds: ids(graph.owners),
    lifetimeRegionIds: ids(graph.lifetimeRegions),
    trapIds: ids(graph.traps),
    undefinedBehaviorIds: ids(graph.undefinedBehaviors),
    failClosedTrapIds: ids(graph.traps.filter((record) => record.failClosed)),
    synchronizationEdgeIds: ids(graph.synchronizationEdges),
    lowLevelPrimitiveIds: ids([...graph.memoryRegions, ...graph.dataLayouts, ...graph.pointerEdges, ...graph.memoryAccesses, ...graph.abiBoundaries, ...graph.synchronizationEdges, ...graph.traps, ...graph.undefinedBehaviors]),
    sourcePaths: unique(allResourceGraphRecords(graph).map((record) => record.sourcePath)),
    evidenceIds: unique([...graph.evidenceIds, ...ids(graph.evidence), ...allResourceGraphRecords(graph).flatMap((record) => record.evidenceIds ?? [])]),
    proofEvidenceIds: unique(allResourceGraphRecords(graph).flatMap((record) => record.proofEvidenceIds ?? [])),
    sourceMapIds: unique([...ids(graph.sourceMaps), ...allResourceGraphRecords(graph).flatMap((record) => record.sourceMapIds ?? [])]),
    sourceMapMappingIds: unique(allResourceGraphRecords(graph).flatMap((record) => record.sourceMapMappingIds ?? [])),
    missingEvidenceIds: ids(graph.missingEvidence),
    missingEvidence: unique([...graph.missingEvidence.map((record) => record.reasonCode), ...allResourceGraphRecords(graph).flatMap((record) => record.missingEvidence ?? [])]),
    blockerReasonCodes: resourceGraphBlockerReasonCodes(graph)
  };

  return {
    id: graph.id,
    graph,
    records: allResourceGraphRecords(graph),
    summary: {
      graphCount: 1,
      ...graph.summary
    },
    metadata: { name }
  };
}

function parseResourceRecord(kind, name, text, graph, authoredLine = {}) {
  const common = commonRecord(kind, name, text, graph, authoredLine);
  if (kind === 'resource') return cleanRecord({ ...common, resourceKind: readInlineWord('resourceKind', text) ?? readInlineWord('kind', text) ?? name, ownerId: readInlineWord('owner', text) ?? readInlineWord('ownerId', text), ownerName: readInlineWord('ownerName', text) });
  if (kind === 'owner') return cleanRecord({ ...common, ownerKind: readInlineWord('ownerKind', text) ?? readInlineWord('kind', text) ?? 'owner' });
  if (kind === 'loan') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), ownerId: readInlineWord('owner', text) ?? readInlineWord('ownerId', text), lifetimeRegionId: readInlineWord('lifetime', text) ?? readInlineWord('lifetimeRegion', text) ?? readInlineWord('lifetimeRegionId', text), mode: readInlineWord('mode', text) ?? 'unknown', access: readInlineWord('access', text) });
  if (kind === 'alias') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), ownerId: readInlineWord('owner', text) ?? readInlineWord('ownerId', text), aliasId: readInlineWord('alias', text) ?? readInlineWord('aliasId', text), aliasKind: readInlineWord('aliasKind', text) ?? readInlineWord('kind', text) ?? 'alias' });
  if (kind === 'move') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), fromOwnerId: readInlineWord('fromOwner', text) ?? readInlineWord('fromOwnerId', text), toOwnerId: readInlineWord('toOwner', text) ?? readInlineWord('toOwnerId', text), moveKind: readInlineWord('moveKind', text) ?? readInlineWord('kind', text) });
  if (kind === 'drop') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), ownerId: readInlineWord('owner', text) ?? readInlineWord('ownerId', text), lifetimeRegionId: readInlineWord('lifetime', text) ?? readInlineWord('lifetimeRegion', text) ?? readInlineWord('lifetimeRegionId', text), dropKind: readInlineWord('dropKind', text) ?? readInlineWord('kind', text) ?? 'drop', line: readInlineNumber('line', text), order: readInlineNumber('order', text) });
  if (kind === 'escape') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), ownerId: readInlineWord('owner', text) ?? readInlineWord('ownerId', text), lifetimeRegionId: readInlineWord('lifetime', text) ?? readInlineWord('lifetimeRegion', text) ?? readInlineWord('lifetimeRegionId', text), loanId: readInlineWord('loan', text) ?? readInlineWord('loanId', text), escapeKind: readInlineWord('escapeKind', text) ?? readInlineWord('kind', text) ?? 'escape', status: readInlineWord('status', text) ?? 'needs-proof' });
  if (kind === 'lifetimeRegion') return cleanRecord({ ...common, lifetimeKind: readInlineWord('lifetimeKind', text) ?? readInlineWord('kind', text) ?? 'lexical', startLine: readInlineNumber('startLine', text), endLine: readInlineNumber('endLine', text) });
  if (kind === 'lifetimeRelation') return cleanRecord({ ...common, relationKind: readInlineWord('relationKind', text) ?? readInlineWord('kind', text) ?? 'outlives', fromLifetimeId: readInlineWord('fromLifetime', text) ?? readInlineWord('fromLifetimeId', text) ?? readInlineWord('from', text), toLifetimeId: readInlineWord('toLifetime', text) ?? readInlineWord('toLifetimeId', text) ?? readInlineWord('to', text), from: readInlineWord('from', text), to: readInlineWord('to', text) });
  if (kind === 'borrowScope') return cleanRecord({ ...common, scopeKind: readInlineWord('scopeKind', text) ?? readInlineWord('kind', text) ?? 'borrow-scope', constraintKind: readInlineWord('constraintKind', text), constraintKinds: readInlineList(text, 'constraint', 'constraints', 'constraintKind', 'constraintKinds') ?? [], ownershipKind: readInlineWord('ownershipKind', text), lifetimeKind: readInlineWord('lifetimeKind', text), controlFlowKind: readInlineWord('controlFlowKind', text), sourceControlFlowId: readInlineWord('sourceControlFlow', text) ?? readInlineWord('sourceControlFlowId', text), lifetimeRegionId: readInlineWord('lifetime', text) ?? readInlineWord('lifetimeRegion', text) ?? readInlineWord('lifetimeRegionId', text), resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text) });
  if (kind === 'unsafeBoundary') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), unsafeBoundary: true, proofStatus: readInlineWord('proofStatus', text) ?? readInlineWord('status', text) ?? 'missing', kind: readInlineWord('kind', text) });
  const lowLevelRecord = parseLowLevelResourceRecord(kind, common, name, text);
  if (lowLevelRecord) return lowLevelRecord;
  if (kind === 'conflict') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), ownerId: readInlineWord('owner', text) ?? readInlineWord('ownerId', text), loanId: readInlineWord('loan', text) ?? readInlineWord('loanId', text), aliasId: readInlineWord('alias', text) ?? readInlineWord('aliasId', text), unsafeBoundaryId: readInlineWord('unsafeBoundary', text) ?? readInlineWord('unsafeBoundaryId', text), reasonCode: readInlineWord('reasonCode', text), message: readInlineQuoted('message', text), status: readInlineWord('status', text) ?? 'open', severity: readInlineWord('severity', text) ?? 'error' });
  if (kind === 'proofObligation') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), conflictId: readInlineWord('conflict', text) ?? readInlineWord('conflictId', text), kind: readInlineWord('kind', text), status: readInlineWord('status', text) ?? 'open', statement: readInlineQuoted('statement', text) });
  if (kind === 'evidence') return cleanRecord({ ...common, evidenceKind: readInlineWord('kind', text) ?? readInlineWord('evidenceKind', text) ?? 'resource-proof', status: readInlineWord('status', text) ?? 'unknown', path: readInlineWord('path', text), command: readInlineQuoted('command', text) ?? readInlineWord('command', text), sourceHash: readInlineWord('sourceHash', text), outputHash: readInlineWord('outputHash', text), traceHash: readInlineWord('traceHash', text), summary: readInlineQuoted('summary', text) });
  if (kind === 'sourceMap') return cleanRecord({ ...common, sourceRecordId: readInlineWord('sourceRecord', text) ?? readInlineWord('sourceRecordId', text), targetRecordId: readInlineWord('targetRecord', text) ?? readInlineWord('targetRecordId', text), generatedPath: readInlineWord('generated', text) ?? readInlineWord('generatedPath', text) ?? readInlineWord('targetPath', text), originalPath: readInlineWord('original', text) ?? readInlineWord('originalPath', text), mappingHash: readInlineWord('mappingHash', text), status: readInlineWord('status', text) ?? 'authored' });
  if (kind === 'missingEvidence') return cleanRecord({ ...common, reasonCode: readInlineWord('reason', text) ?? readInlineWord('reasonCode', text) ?? readInlineWord('code', text) ?? name, status: readInlineWord('status', text) ?? 'missing', severity: readInlineWord('severity', text) ?? 'warning', summary: readInlineQuoted('summary', text) ?? readInlineQuoted('message', text), failClosed: common.failClosed ?? true, semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  return undefined;
}

function commonRecord(kind, name, text, graph, authoredLine = {}) {
  return cleanRecord({
    recordKind: recordKind(kind),
    id: idFrom(text, `${recordPrefix(kind)}_${name}`),
    name,
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text) ?? graph.sourcePath,
    sourceHash: readInlineWord('sourceHash', text) ?? graph.sourceHash,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    sourceMapIds: readInlineList(text, 'sourceMap', 'sourceMaps', 'sourceMapId', 'sourceMapIds'),
    sourceMapMappingIds: readInlineList(text, 'sourceMapMapping', 'sourceMapMappings', 'sourceMapMappingId', 'sourceMapMappingIds'),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceId', 'proofEvidenceIds'),
    proofObligationIds: readInlineList(text, 'proofObligation', 'proofObligations', 'proofObligationId', 'proofObligationIds', 'obligation', 'obligations'),
    missingEvidence: readInlineList(text, 'missingEvidence'),
    failClosed: readInlineFlag('failClosed', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds') ?? graph.evidenceIds,
    metadata: { authoredName: name }
  });
}

function normalizeRowKind(kind) {
  if (kind === 'lifetime' || kind === 'life') return 'lifetimeRegion';
  if (kind === 'outlives' || kind === 'lifetimeRelation' || kind === 'lifeRelation') return 'lifetimeRelation';
  if (kind === 'borrow' || kind === 'borrowScope' || kind === 'borrowRegion') return 'borrowScope';
  if (kind === 'unsafe' || kind === 'unsafeBoundary') return 'unsafeBoundary';
  if (kind === 'memory' || kind === 'memoryRegion' || kind === 'region') return 'memoryRegion';
  if (kind === 'layout' || kind === 'dataLayout') return 'dataLayout';
  if (kind === 'pointer' || kind === 'ptr' || kind === 'address') return 'pointerEdge';
  if (kind === 'access' || kind === 'memoryAccess' || kind === 'atomic' || kind === 'volatile') return 'memoryAccess';
  if (kind === 'abi' || kind === 'abiBoundary' || kind === 'callBoundary') return 'abiBoundary';
  if (kind === 'sync' || kind === 'synchronization' || kind === 'synchronisation' || kind === 'synchronizationEdge' || kind === 'synchronisationEdge' || kind === 'happensBefore' || kind === 'happens-before' || kind === 'hb' || kind === 'fence' || kind === 'fenceEdge' || kind === 'barrier' || kind === 'barrierEdge') return 'synchronizationEdge';
  if (kind === 'traps') return 'trap';
  if (kind === 'undefined' || kind === 'ub' || kind === 'undefinedBehavior' || kind === 'undefinedBehaviour') return 'undefinedBehavior';
  if (kind === 'proof' || kind === 'obligation' || kind === 'proofObligation') return 'proofObligation';
  if (kind === 'evidence' || kind === 'evidenceIds' || kind === 'proofEvidence') return 'evidence';
  if (kind === 'sourcemap' || kind === 'mapping' || kind === 'sourceMapMapping') return 'sourceMap';
  return kind;
}

function recordKind(kind) {
  if (kind === 'lifetimeRegion') return 'lifetime-region';
  if (kind === 'lifetimeRelation') return 'lifetime-relation';
  if (kind === 'borrowScope') return 'borrow-scope';
  if (kind === 'unsafeBoundary') return 'unsafe-boundary';
  if (kind === 'memoryRegion') return 'memory-region';
  if (kind === 'dataLayout') return 'data-layout';
  if (kind === 'pointerEdge') return 'pointer-edge';
  if (kind === 'memoryAccess') return 'memory-access';
  if (kind === 'abiBoundary') return 'abi-boundary';
  if (kind === 'synchronizationEdge') return 'synchronization-edge';
  if (kind === 'undefinedBehavior') return 'undefined-behavior';
  if (kind === 'proofObligation') return 'proof-obligation';
  if (kind === 'sourceMap') return 'source-map';
  if (kind === 'missingEvidence') return 'missing-evidence';
  return kind;
}

function recordPrefix(kind) {
  return recordKind(kind).replace(/-/g, '_');
}

function isGraphPropertyLine(line) {
  const property = /^(sourceLanguage|language|sourcePath|path|sourceHash|status|evidence|evidenceIds)\s+/.exec(line)?.[1];
  if (!property) return false;
  if ((property === 'evidence' || property === 'evidenceIds') && /@id\(/.test(line)) return false;
  return true;
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'ResourceGraph'; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readListLine(label, body) {
  const line = readLine(label, body);
  return line ? line.split(/[|,]/).map((item) => item.trim()).filter(Boolean) : undefined;
}
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineFlag(label, text) { return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(text) || undefined; }
function readInlineNumber(label, text) {
  const value = readInlineWord(label, text);
  return value === undefined ? undefined : Number(value);
}
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function unique(values = []) { return [...new Set(values.filter(Boolean))]; }
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
    records.push({ text: rawLine.trim(), sourceSpan: typeof block.sourceSpan === 'function' ? block.sourceSpan(startOffset, endOffset) : undefined });
    lineStart = rawEnd + 1;
  }
  return records;
}
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
