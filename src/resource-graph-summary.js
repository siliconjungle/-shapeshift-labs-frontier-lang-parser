export function summarizeResourceGraph(graph) {
  return {
    records: allResourceGraphRecords(graph).length,
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
    memoryRegions: graph.memoryRegions.length,
    dataLayouts: graph.dataLayouts.length,
    pointerEdges: graph.pointerEdges.length,
    memoryAccesses: graph.memoryAccesses.length,
    abiBoundaries: graph.abiBoundaries.length,
    synchronizationEdges: graph.synchronizationEdges.length,
    traps: graph.traps.length,
    undefinedBehaviors: graph.undefinedBehaviors.length,
    evidence: graph.evidence.length,
    sourceMaps: graph.sourceMaps.length,
    missingEvidence: graph.missingEvidence.length,
    lowLevelPrimitives: graph.memoryRegions.length + graph.dataLayouts.length + graph.pointerEdges.length + graph.memoryAccesses.length + graph.abiBoundaries.length + graph.synchronizationEdges.length + graph.traps.length + graph.undefinedBehaviors.length,
    conflicts: graph.conflicts.length,
    proofObligations: graph.proofObligations.length,
    unsafeBoundariesWithoutProof: graph.unsafeBoundaries.filter((record) => record.proofStatus !== 'passed').length,
    failClosedTraps: graph.traps.filter((record) => record.failClosed).length,
    trapsWithoutProof: graph.traps.filter((record) => record.proofStatus !== 'passed').length,
    undefinedBehaviorsWithoutProof: graph.undefinedBehaviors.filter((record) => record.proofStatus !== 'passed').length,
    parseErrors: graph.parser?.errors?.length ?? 0,
    synchronizationEdgesWithoutProof: graph.synchronizationEdges.filter((record) => record.proofStatus !== 'passed').length,
    reasonCodes: unique([...graph.conflicts, ...graph.synchronizationEdges, ...graph.traps, ...graph.undefinedBehaviors].map((record) => record.reasonCode))
  };
}

export function deriveResourceGraphStatus(authoredStatus, summary) {
  if (
    summary.conflicts > 0 ||
    summary.unsafeBoundariesWithoutProof > 0 ||
    summary.synchronizationEdgesWithoutProof > 0 ||
    summary.trapsWithoutProof > 0 ||
    summary.undefinedBehaviorsWithoutProof > 0
  ) return 'blocked';
  return authoredStatus ?? 'partial';
}

export function resourceGraphBlockerReasonCodes(graph) {
  const unprovedSynchronizationEdges = graph.synchronizationEdges.filter((record) => record.proofStatus !== 'passed');
  return unique([...graph.conflicts, ...unprovedSynchronizationEdges, ...graph.traps, ...graph.undefinedBehaviors].map((record) => record.reasonCode));
}

export function allResourceGraphRecords(graph) {
  return [
    ...graph.resources, ...graph.owners, ...graph.loans, ...graph.aliases, ...graph.moves, ...graph.drops,
    ...graph.escapes, ...graph.lifetimeRegions, ...graph.lifetimeRelations, ...graph.borrowScopes,
    ...graph.unsafeBoundaries, ...graph.memoryRegions, ...graph.dataLayouts, ...graph.pointerEdges,
    ...graph.memoryAccesses, ...graph.abiBoundaries, ...graph.synchronizationEdges, ...graph.traps,
    ...graph.undefinedBehaviors, ...graph.conflicts, ...graph.proofObligations, ...graph.evidence,
    ...graph.sourceMaps, ...graph.missingEvidence
  ];
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}
