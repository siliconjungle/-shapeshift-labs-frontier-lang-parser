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
  conflict: 'conflicts',
  proofObligation: 'proofObligations'
};

export function parseResourceGraphBlock(block) {
  const name = nameFrom(block.header);
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
    conflicts: [],
    proofObligations: [],
    claims: {
      borrowCheckerClaim: false,
      aliasSafetyClaim: false,
      lifetimeSoundnessClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: { name }
  };

  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || isGraphPropertyLine(line)) continue;
    const match = /^([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, rest] = match;
    const normalized = normalizeRowKind(rowKind);
    const record = parseResourceRecord(normalized, rowName, rest, graph);
    const group = GROUPS[normalized];
    if (record && group) graph[group].push(record);
  }

  graph.outlives = graph.lifetimeRelations;
  graph.borrowScopeRegions = graph.borrowScopes;
  graph.summary = summarize(graph);
  graph.query = {
    resourceIds: ids(graph.resources),
    ownerIds: ids(graph.owners),
    lifetimeRegionIds: ids(graph.lifetimeRegions),
    sourcePaths: unique(allRecords(graph).map((record) => record.sourcePath)),
    evidenceIds: unique([...graph.evidenceIds, ...allRecords(graph).flatMap((record) => record.evidenceIds ?? [])]),
    blockerReasonCodes: unique(graph.conflicts.map((record) => record.reasonCode))
  };

  return {
    id: graph.id,
    graph,
    records: allRecords(graph),
    summary: {
      graphCount: 1,
      ...graph.summary
    },
    metadata: { name }
  };
}

function parseResourceRecord(kind, name, text, graph) {
  const common = commonRecord(kind, name, text, graph);
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
  if (kind === 'conflict') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), ownerId: readInlineWord('owner', text) ?? readInlineWord('ownerId', text), loanId: readInlineWord('loan', text) ?? readInlineWord('loanId', text), aliasId: readInlineWord('alias', text) ?? readInlineWord('aliasId', text), unsafeBoundaryId: readInlineWord('unsafeBoundary', text) ?? readInlineWord('unsafeBoundaryId', text), reasonCode: readInlineWord('reasonCode', text), message: readInlineQuoted('message', text), status: readInlineWord('status', text) ?? 'open', severity: readInlineWord('severity', text) ?? 'error' });
  if (kind === 'proofObligation') return cleanRecord({ ...common, resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text), conflictId: readInlineWord('conflict', text) ?? readInlineWord('conflictId', text), kind: readInlineWord('kind', text), status: readInlineWord('status', text) ?? 'open', statement: readInlineQuoted('statement', text) });
  return undefined;
}

function commonRecord(kind, name, text, graph) {
  return cleanRecord({
    recordKind: recordKind(kind),
    id: idFrom(text, `${recordPrefix(kind)}_${name}`),
    name,
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text) ?? graph.sourcePath,
    sourceHash: readInlineWord('sourceHash', text) ?? graph.sourceHash,
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds') ?? graph.evidenceIds,
    metadata: { authoredName: name }
  });
}

function summarize(graph) {
  return {
    records: allRecords(graph).length,
    resources: graph.resources.length,
    owners: graph.owners.length,
    loans: graph.loans.length,
    aliases: graph.aliases.length,
    moves: graph.moves.length,
    drops: graph.drops.length,
    escapes: graph.escapes.length,
    lifetimeRegions: graph.lifetimeRegions.length,
    lifetimeRelations: graph.lifetimeRelations.length,
    borrowScopes: graph.borrowScopes.length,
    unsafeBoundaries: graph.unsafeBoundaries.length,
    conflicts: graph.conflicts.length,
    proofObligations: graph.proofObligations.length,
    unsafeBoundariesWithoutProof: graph.unsafeBoundaries.filter((record) => record.proofStatus !== 'passed').length,
    reasonCodes: unique(graph.conflicts.map((record) => record.reasonCode))
  };
}

function allRecords(graph) {
  return [
    ...graph.resources,
    ...graph.owners,
    ...graph.loans,
    ...graph.aliases,
    ...graph.moves,
    ...graph.drops,
    ...graph.escapes,
    ...graph.lifetimeRegions,
    ...graph.lifetimeRelations,
    ...graph.borrowScopes,
    ...graph.unsafeBoundaries,
    ...graph.conflicts,
    ...graph.proofObligations
  ];
}

function normalizeRowKind(kind) {
  if (kind === 'lifetime' || kind === 'life') return 'lifetimeRegion';
  if (kind === 'outlives' || kind === 'lifetimeRelation' || kind === 'lifeRelation') return 'lifetimeRelation';
  if (kind === 'borrow' || kind === 'borrowScope' || kind === 'borrowRegion') return 'borrowScope';
  if (kind === 'unsafe' || kind === 'unsafeBoundary') return 'unsafeBoundary';
  if (kind === 'proof' || kind === 'obligation' || kind === 'proofObligation') return 'proofObligation';
  return kind;
}

function recordKind(kind) {
  if (kind === 'lifetimeRegion') return 'lifetime-region';
  if (kind === 'lifetimeRelation') return 'lifetime-relation';
  if (kind === 'borrowScope') return 'borrow-scope';
  if (kind === 'unsafeBoundary') return 'unsafe-boundary';
  if (kind === 'proofObligation') return 'proof-obligation';
  return kind;
}

function recordPrefix(kind) {
  return recordKind(kind).replace(/-/g, '_');
}

function isGraphPropertyLine(line) {
  return /^(sourceLanguage|language|sourcePath|path|sourceHash|status|evidence|evidenceIds)\s+/.test(line);
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
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
