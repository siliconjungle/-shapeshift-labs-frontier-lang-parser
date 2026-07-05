const GROUPS = {
  layer: 'layerRecords',
  constraint: 'constraintEdges',
  edge: 'constraintEdges',
  obligation: 'obligations',
  proofObligation: 'obligations',
  lowering: 'loweringRecords',
  lift: 'liftRecords',
  evidence: 'evidenceRecords'
};

export function parseInterlinguaBlock(block) {
  const name = nameFrom(block.header);
  const record = {
    kind: 'frontier.lang.universalInterlinguaRecord',
    version: 1,
    id: idFrom(block.header, `interlingua_${name}`),
    routeId: readLine('route', block.body) ?? readLine('routeId', block.body),
    sourceLanguage: readLine('sourceLanguage', block.body) ?? readLine('source', block.body),
    target: readLine('target', block.body),
    mode: readLine('mode', block.body),
    layerRecords: [],
    constraintEdges: [],
    obligations: [],
    loweringRecords: [],
    liftRecords: [],
    evidenceRecords: [],
    claims: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    },
    metadata: { name, authoredFrontierInterlingua: true }
  };

  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || isPropertyLine(line)) continue;
    const match = /^([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, rest] = match;
    const normalized = normalizeRowKind(rowKind);
    const parsed = parseInterlinguaRow(normalized, rowName, rest, record);
    const group = GROUPS[normalized];
    if (parsed && group) record[group].push(parsed);
  }

  record.lift = summarizeLift(record);
  record.layers = summarizeLayers(record.layerRecords, record.constraintEdges);
  record.constraints = summarizeConstraints(record.constraintEdges, record.obligations);
  record.lowering = summarizeLowering(record);
  record.query = summarizeQuery(record);
  record.summary = summarize(record);

  return {
    id: record.id,
    record,
    records: [record, ...record.constraintEdges, ...record.obligations, ...record.layerRecords, ...record.loweringRecords, ...record.liftRecords, ...record.evidenceRecords],
    summary: {
      recordCount: 1,
      ...record.summary
    },
    metadata: { name }
  };
}

function parseInterlinguaRow(kind, name, text, parent) {
  const common = commonRecord(kind, name, text, parent);
  if (kind === 'layer') return cleanRecord({ ...common, layerKind: readInlineWord('layerKind', text) ?? readInlineWord('kind', text) ?? name, status: readInlineWord('status', text) ?? 'represented', sourceIds: readInlineList(text, 'source', 'sourceId', 'sourceIds'), targetIds: readInlineList(text, 'target', 'targetId', 'targetIds'), missingEvidence: readInlineList(text, 'missingEvidence'), blockers: readInlineList(text, 'blocker', 'blockers'), review: readInlineList(text, 'review') });
  if (kind === 'constraint') return cleanRecord({ ...common, family: readInlineWord('family', text) ?? readInlineWord('kind', text) ?? name, layerKind: readInlineWord('layer', text) ?? readInlineWord('layerKind', text), status: readInlineWord('status', text) ?? 'required', action: readInlineWord('action', text), sourceId: readInlineWord('source', text) ?? readInlineWord('sourceId', text), requiredKinds: readInlineList(text, 'required', 'requiredKind', 'requiredKinds'), representedKinds: readInlineList(text, 'represented', 'representedKind', 'representedKinds'), missingKinds: readInlineList(text, 'missing', 'missingKind', 'missingKinds'), missingEvidence: readInlineList(text, 'missingEvidence'), blockers: readInlineList(text, 'blocker', 'blockers'), review: readInlineList(text, 'review'), obligationIds: readInlineList(text, 'obligation', 'obligationId', 'obligationIds') });
  if (kind === 'obligation') return cleanRecord({ ...common, edgeId: readInlineWord('edge', text) ?? readInlineWord('edgeId', text), family: readInlineWord('family', text), obligationKind: readInlineWord('obligationKind', text) ?? readInlineWord('kind', text) ?? name, status: readInlineWord('status', text) ?? 'required', sourceId: readInlineWord('source', text) ?? readInlineWord('sourceId', text), sourceNodeIds: readInlineList(text, 'sourceNode', 'sourceNodeIds'), targetNodeIds: readInlineList(text, 'targetNode', 'targetNodeIds'), missingEvidence: readInlineList(text, 'missingEvidence'), severity: readInlineWord('severity', text) });
  if (kind === 'lowering') return cleanRecord({ ...common, disposition: readInlineWord('disposition', text) ?? readInlineWord('kind', text), adapterId: readInlineWord('adapter', text) ?? readInlineWord('adapterId', text), adapterKind: readInlineWord('adapterKind', text), readiness: readInlineWord('readiness', text), routeAction: readInlineWord('routeAction', text), lossClass: readInlineWord('lossClass', text), runtimeReadiness: readInlineWord('runtimeReadiness', text), dialectReadiness: readInlineWord('dialectReadiness', text), lossIds: readInlineList(text, 'loss', 'lossId', 'lossIds'), proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'), runtimeRequiredCapabilities: readInlineList(text, 'runtimeRequiredCapability', 'runtimeRequiredCapabilities'), runtimeAdapterRequirementIds: readInlineList(text, 'runtimeAdapterRequirement', 'runtimeAdapterRequirementId', 'runtimeAdapterRequirementIds'), dialectRecordIds: readInlineList(text, 'dialectRecord', 'dialectRecordId', 'dialectRecordIds'), dialectProjectionDispositions: readInlineList(text, 'dialectProjectionDisposition', 'dialectDisposition', 'dialectProjectionDispositions'), missingEvidence: readInlineList(text, 'missingEvidence'), blockers: readInlineList(text, 'blocker', 'blockers'), review: readInlineList(text, 'review') });
  if (kind === 'lift') return cleanRecord({ ...common, sourceImportIds: readInlineList(text, 'sourceImport', 'sourceImportId', 'sourceImportIds'), sourcePaths: readInlineList(text, 'sourcePath', 'sourcePaths', 'path', 'paths'), sourceHashes: readInlineList(text, 'sourceHash', 'sourceHashes'), sourceMapIds: readInlineList(text, 'sourceMap', 'sourceMapId', 'sourceMapIds'), sourceMapMappingIds: readInlineList(text, 'sourceMapMapping', 'sourceMapMappingId', 'sourceMapMappingIds'), ownershipKeys: readInlineList(text, 'ownership', 'ownershipKey', 'ownershipKeys'), conflictKeys: readInlineList(text, 'conflict', 'conflictKey', 'conflictKeys'), proofIds: readInlineList(text, 'proof', 'proofId', 'proofIds') });
  if (kind === 'evidence') return cleanRecord({ ...common, evidenceKind: readInlineWord('evidenceKind', text) ?? readInlineWord('kind', text), status: readInlineWord('status', text), path: readInlineWord('path', text), command: readInlineQuoted('command', text) ?? readInlineWord('command', text) });
  return undefined;
}

function commonRecord(kind, name, text, parent) {
  return cleanRecord({
    id: idFrom(text, `${recordPrefix(kind)}_${name}`),
    recordKind: `frontier.lang.universalInterlingua.${recordKind(kind)}`,
    name,
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text) ?? parent.routeId,
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? parent.sourceLanguage,
    target: readInlineWord('target', text) ?? parent.target,
    evidenceIds: readInlineList(text, 'evidence', 'evidenceId', 'evidenceIds'),
    metadata: { authoredName: name }
  });
}

function summarizeLift(record) {
  return cleanRecord({
    sourceLanguage: record.sourceLanguage,
    sourceImportIds: unique(record.liftRecords.flatMap((entry) => entry.sourceImportIds ?? [])),
    sourcePaths: unique(record.liftRecords.flatMap((entry) => entry.sourcePaths ?? [])),
    sourceHashes: unique(record.liftRecords.flatMap((entry) => entry.sourceHashes ?? [])),
    sourceMapIds: unique(record.liftRecords.flatMap((entry) => entry.sourceMapIds ?? [])),
    sourceMapMappingIds: unique(record.liftRecords.flatMap((entry) => entry.sourceMapMappingIds ?? [])),
    ownershipKeys: unique(record.liftRecords.flatMap((entry) => entry.ownershipKeys ?? [])),
    conflictKeys: unique(record.liftRecords.flatMap((entry) => entry.conflictKeys ?? [])),
    evidenceIds: unique(allEvidence(record)),
    proofIds: unique(record.liftRecords.flatMap((entry) => entry.proofIds ?? []))
  });
}

function summarizeLayers(layers, edges) {
  const byStatus = (status) => unique(layers.filter((layer) => layer.status === status).map((layer) => layer.layerKind));
  return {
    kinds: unique([...layers.map((layer) => layer.layerKind), ...edges.map((edge) => edge.layerKind)]),
    representedKinds: byStatus('represented'),
    missingKinds: unique([...byStatus('missing'), ...edges.filter((edge) => (edge.missingKinds ?? []).length || (edge.missingEvidence ?? []).length).map((edge) => edge.layerKind)]),
    reviewKinds: byStatus('review'),
    blockedKinds: byStatus('blocked'),
    constructCount: layers.length,
    representedCount: byStatus('represented').length,
    missingCount: byStatus('missing').length,
    reviewCount: byStatus('review').length,
    blockedCount: byStatus('blocked').length
  };
}

function summarizeConstraints(edges, obligations) {
  const normalizedObligations = obligations.map((obligation) => cleanRecord({ ...obligation, kind: obligation.obligationKind ?? obligation.kind }));
  return {
    edges,
    edgeCount: edges.length,
    obligations: normalizedObligations,
    obligationCount: normalizedObligations.length,
    families: unique(edges.map((edge) => edge.family)),
    statuses: unique(edges.map((edge) => edge.status)),
    actions: unique(edges.map((edge) => edge.action)),
    sourceIds: unique(edges.map((edge) => edge.sourceId)),
    evidenceIds: unique(edges.flatMap((edge) => edge.evidenceIds ?? [])),
    requiredKinds: unique(edges.flatMap((edge) => edge.requiredKinds ?? [])),
    representedKinds: unique(edges.flatMap((edge) => edge.representedKinds ?? [])),
    missingKinds: unique(edges.flatMap((edge) => edge.missingKinds ?? [])),
    missingEvidence: unique(edges.flatMap((edge) => edge.missingEvidence ?? [])),
    obligationKinds: unique(normalizedObligations.map((obligation) => obligation.kind)),
    obligationStatuses: unique(normalizedObligations.map((obligation) => obligation.status)),
    obligationEvidenceIds: unique(normalizedObligations.flatMap((obligation) => obligation.evidenceIds ?? [])),
    obligationMissingEvidence: unique(normalizedObligations.flatMap((obligation) => obligation.missingEvidence ?? [])),
    blockers: unique(edges.flatMap((edge) => edge.blockers ?? [])),
    review: unique(edges.flatMap((edge) => edge.review ?? []))
  };
}

function summarizeLowering(record) {
  const latest = record.loweringRecords.at(-1) ?? {};
  return cleanRecord({
    disposition: latest.disposition,
    mode: record.mode,
    routeAction: latest.routeAction,
    lossClass: latest.lossClass,
    adapterId: latest.adapterId,
    adapterKind: latest.adapterKind,
    readiness: latest.readiness,
    runtimeReadiness: latest.runtimeReadiness,
    runtimeRequiredCapabilities: unique(record.loweringRecords.flatMap((entry) => entry.runtimeRequiredCapabilities ?? [])),
    runtimeAdapterRequirementIds: unique(record.loweringRecords.flatMap((entry) => entry.runtimeAdapterRequirementIds ?? [])),
    dialectReadiness: latest.dialectReadiness,
    dialectRecordIds: unique(record.loweringRecords.flatMap((entry) => entry.dialectRecordIds ?? [])),
    dialectProjectionDispositions: unique(record.loweringRecords.flatMap((entry) => entry.dialectProjectionDispositions ?? [])),
    proofEvidenceIds: unique(record.loweringRecords.flatMap((entry) => entry.proofEvidenceIds ?? [])),
    evidenceIds: unique(allEvidence(record)),
    missingEvidence: unique(record.loweringRecords.flatMap((entry) => entry.missingEvidence ?? [])),
    lossIds: unique(record.loweringRecords.flatMap((entry) => entry.lossIds ?? [])),
    blockers: unique(record.loweringRecords.flatMap((entry) => entry.blockers ?? [])),
    review: unique(record.loweringRecords.flatMap((entry) => entry.review ?? []))
  });
}

function summarizeQuery(record) {
  return {
    layerKinds: record.layers.kinds,
    representedLayerKinds: record.layers.representedKinds,
    missingLayerKinds: record.layers.missingKinds,
    reviewLayerKinds: record.layers.reviewKinds,
    blockedLayerKinds: record.layers.blockedKinds,
    constraintFamilies: record.constraints.families,
    constraintStatuses: record.constraints.statuses,
    constraintActions: record.constraints.actions,
    constraintSourceIds: record.constraints.sourceIds,
    constraintEvidenceIds: record.constraints.evidenceIds,
    constraintRequiredKinds: record.constraints.requiredKinds,
    constraintRepresentedKinds: record.constraints.representedKinds,
    constraintMissingKinds: record.constraints.missingKinds,
    constraintMissingEvidence: record.constraints.missingEvidence,
    constraintObligationKinds: record.constraints.obligationKinds,
    constraintObligationStatuses: record.constraints.obligationStatuses,
    constraintObligationEvidenceIds: record.constraints.obligationEvidenceIds,
    constraintObligationMissingEvidence: record.constraints.obligationMissingEvidence,
    loweringDisposition: record.lowering.disposition,
    loweringRuntimeReadiness: record.lowering.runtimeReadiness,
    loweringRuntimeRequiredCapabilities: record.lowering.runtimeRequiredCapabilities ?? [],
    loweringRuntimeAdapterRequirementIds: record.lowering.runtimeAdapterRequirementIds ?? [],
    loweringDialectReadiness: record.lowering.dialectReadiness,
    loweringDialectRecordIds: record.lowering.dialectRecordIds ?? [],
    loweringDialectProjectionDispositions: record.lowering.dialectProjectionDispositions ?? [],
    missingEvidence: unique([...(record.lowering.missingEvidence ?? []), ...(record.constraints.missingEvidence ?? [])]),
    proofEvidenceIds: record.lowering.proofEvidenceIds ?? [],
    targetAdapterId: record.lowering.adapterId
  };
}

function summarize(record) {
  return {
    layerCount: record.layers.constructCount,
    constraintCount: record.constraints.edgeCount,
    obligationCount: record.constraints.obligationCount,
    loweringCount: record.loweringRecords.length,
    liftCount: record.liftRecords.length,
    evidenceCount: record.evidenceRecords.length,
    missingEvidenceCount: record.query.missingEvidence.length,
    blockerCount: (record.lowering.blockers ?? []).length + (record.constraints.blockers ?? []).length
  };
}

function allEvidence(record) {
  return [...record.evidenceRecords.map((entry) => entry.id), ...record.layerRecords.flatMap((entry) => entry.evidenceIds ?? []), ...record.constraintEdges.flatMap((entry) => entry.evidenceIds ?? []), ...record.obligations.flatMap((entry) => entry.evidenceIds ?? []), ...record.liftRecords.flatMap((entry) => entry.evidenceIds ?? [])];
}

function normalizeRowKind(kind) {
  if (kind === 'constraintEdge' || kind === 'edge') return 'constraint';
  if (kind === 'proof' || kind === 'proofObligation') return 'obligation';
  if (kind === 'lower' || kind === 'lowering') return 'lowering';
  if (kind === 'source' || kind === 'sourceLift') return 'lift';
  return kind;
}

function recordKind(kind) {
  if (kind === 'constraint') return 'constraintEdge';
  if (kind === 'obligation') return 'constraintObligation';
  return kind;
}

function recordPrefix(kind) { return recordKind(kind).replace(/[A-Z]/g, (value) => `_${value.toLowerCase()}`); }
function isPropertyLine(line) { return /^(route|routeId|sourceLanguage|source|target|mode)\s+/.test(line); }
function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Interlingua'; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function unique(values = []) { return [...new Set(values.filter(Boolean))]; }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
