const PARADIGM_GROUPS = [
  'valueSemantics', 'mutationModels', 'effectModels', 'ownershipModels', 'lifetimeModels',
  'bindingScopes', 'bindings', 'patterns', 'dispatchModels', 'typeModels', 'moduleModels',
  'concurrencyModels', 'errorModels', 'memoryModels', 'typeConstraints', 'evaluationModels',
  'metaprogrammingRecords', 'interopRecords', 'memoryLocations', 'effectRegions',
  'controlRegions', 'logicPrograms', 'actorSystems', 'stackEffects', 'arrayShapes', 'numericKernels', 'dataflowNetworks',
  'clockModels', 'objectModels', 'macroExpansions', 'reflectionBoundaries', 'loweringRecords'
];

export function mergeParadigmBlocks(blocks) {
  const paradigm = {
    id: blocks.length === 1 ? blocks[0].id : 'paradigm:source',
    metadata: { authoredParadigmBlockIds: blocks.map((block) => block.id) }
  };
  for (const group of PARADIGM_GROUPS) paradigm[group] = blocks.flatMap((block) => block[group] ?? []);
  paradigm.query = mergeParadigmQueries(blocks);
  return paradigm;
}

function mergeParadigmQueries(blocks) {
  const queries = blocks.map((block) => block.query).filter(Boolean);
  return {
    recordIds: unique(queries.flatMap((query) => query.recordIds ?? [])),
    evidenceIds: unique(queries.flatMap((query) => query.evidenceIds ?? [])),
    proofEvidenceIds: unique(queries.flatMap((query) => query.proofEvidenceIds ?? [])),
    sourceMapIds: unique(queries.flatMap((query) => query.sourceMapIds ?? [])),
    sourceMapMappingIds: unique(queries.flatMap((query) => query.sourceMapMappingIds ?? [])),
    lossIds: unique(queries.flatMap((query) => query.lossIds ?? [])),
    missingEvidence: unique(queries.flatMap((query) => query.missingEvidence ?? [])),
    sourcePaths: unique(queries.flatMap((query) => query.sourcePaths ?? [])),
    rowKinds: unique(queries.flatMap((query) => query.rowKinds ?? [])),
    recordKinds: unique(queries.flatMap((query) => query.recordKinds ?? []))
  };
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}
