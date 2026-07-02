const PROOF_GROUPS = ['contracts', 'refinements', 'invariants', 'termination', 'temporal', 'obligations', 'artifacts', 'assumptions'];
const PARADIGM_GROUPS = [
  'bindingScopes',
  'bindings',
  'patterns',
  'typeConstraints',
  'evaluationModels',
  'memoryLocations',
  'effectRegions',
  'controlRegions',
  'logicPrograms',
  'actorSystems',
  'stackEffects',
  'arrayShapes',
  'numericKernels',
  'dataflowNetworks',
  'clockModels',
  'objectModels',
  'macroExpansions',
  'reflectionBoundaries',
  'loweringRecords'
];

export function createParsedMetadata({ proofBlocks = [], paradigmBlocks = [], operationBlocks = [], conversionBlocks = [], constraintSpaceBlocks = [], decisionGraphBlocks = [], interlinguaBlocks = [], resourceGraphBlocks = [], nativeSourceBlocks = [] } = {}) {
  const metadata = {};
  if (proofBlocks.length) metadata.proof = mergeProofBlocks(proofBlocks);
  if (paradigmBlocks.length) metadata.paradigmSemantics = mergeParadigmBlocks(paradigmBlocks);
  if (operationBlocks.length) metadata.semanticOperations = mergeOperationBlocks(operationBlocks);
  if (conversionBlocks.length) metadata.universalConversionPlan = mergeConversionBlocks(conversionBlocks);
  if (constraintSpaceBlocks.length) metadata.constraintSpaces = mergeConstraintSpaceBlocks(constraintSpaceBlocks);
  if (decisionGraphBlocks.length) metadata.decisionGraph = mergeDecisionGraphBlocks(decisionGraphBlocks);
  if (interlinguaBlocks.length) metadata.universalInterlingua = mergeInterlinguaBlocks(interlinguaBlocks);
  if (resourceGraphBlocks.length) metadata.semanticResourceGraphs = mergeResourceGraphBlocks(resourceGraphBlocks);
  if (nativeSourceBlocks.some((block) => block.sourceMaps.length || block.mergeCandidates.length || block.evidence.length)) {
    metadata.universalAst = mergeNativeSourceBlocks(nativeSourceBlocks);
  }
  return Object.keys(metadata).length ? metadata : undefined;
}

function mergeProofBlocks(blocks) {
  const proof = {
    id: blocks.length === 1 ? blocks[0].id : 'proof:source',
    metadata: { authoredProofBlockIds: blocks.map((block) => block.id) }
  };
  for (const group of PROOF_GROUPS) proof[group] = blocks.flatMap((block) => block[group] ?? []);
  return proof;
}

function mergeParadigmBlocks(blocks) {
  const paradigm = {
    id: blocks.length === 1 ? blocks[0].id : 'paradigm:source',
    metadata: { authoredParadigmBlockIds: blocks.map((block) => block.id) }
  };
  for (const group of PARADIGM_GROUPS) paradigm[group] = blocks.flatMap((block) => block[group] ?? []);
  return paradigm;
}

function mergeOperationBlocks(blocks) {
  return {
    id: blocks.length === 1 ? blocks[0].id : 'semanticOperations:source',
    operations: blocks.flatMap((block) => block.operations ?? []),
    metadata: { authoredSemanticOperationBlockIds: blocks.map((block) => block.id) }
  };
}

function mergeConversionBlocks(blocks) {
  const plan = {
    id: blocks.length === 1 ? blocks[0].id : 'universalConversionPlan:source',
    targets: [...new Set(blocks.flatMap((block) => block.targets ?? []))],
    metadata: { authoredConversionBlockIds: blocks.map((block) => block.id) }
  };
  for (const block of blocks) {
    if (block.sourceLanguage && !plan.sourceLanguage) plan.sourceLanguage = block.sourceLanguage;
    for (const [key, value] of Object.entries(block)) {
      if (Array.isArray(value) && key !== 'targets') plan[key] = [...(plan[key] ?? []), ...value];
      else if ((key === 'sourceRuntimes' || key === 'targetRuntimes') && value && typeof value === 'object') {
        plan[key] = { ...(plan[key] ?? {}), ...value };
      }
    }
  }
  return plan;
}

function mergeConstraintSpaceBlocks(blocks) {
  return {
    id: blocks.length === 1 ? blocks[0].id : 'constraintSpaces:source',
    spaces: blocks,
    targets: [...new Set(blocks.flatMap((block) => block.targets ?? []))],
    variableIds: blocks.flatMap((block) => ids(block.variables)),
    constraintIds: blocks.flatMap((block) => ids(block.constraints)),
    preferenceIds: blocks.flatMap((block) => ids(block.preferences)),
    collapseStrategyIds: blocks.flatMap((block) => ids(block.collapseStrategies)),
    admissionIds: blocks.flatMap((block) => ids(block.admissions)),
    summary: {
      spaceCount: blocks.length,
      variableCount: sum(blocks, 'variableCount'),
      constraintCount: sum(blocks, 'constraintCount'),
      preferenceCount: sum(blocks, 'preferenceCount'),
      collapseStrategyCount: sum(blocks, 'collapseStrategyCount'),
      admissionCount: sum(blocks, 'admissionCount')
    },
    metadata: { authoredConstraintSpaceBlockIds: blocks.map((block) => block.id) }
  };
}

function mergeNativeSourceBlocks(blocks) {
  return {
    id: blocks.length === 1 ? `universalAst:${blocks[0].node.id}` : 'universalAst:source',
    nativeSourceIds: blocks.map((block) => block.node.id),
    sourceMaps: blocks.flatMap((block) => block.sourceMaps ?? []),
    mergeCandidates: blocks.flatMap((block) => block.mergeCandidates ?? []),
    evidence: blocks.flatMap((block) => block.evidence ?? []),
    losses: blocks.flatMap((block) => block.losses ?? []),
    metadata: { authoredNativeSourceIds: blocks.map((block) => block.node.id) }
  };
}

function mergeDecisionGraphBlocks(blocks) {
  const records = blocks.flatMap((block) => block.records ?? []);
  const graphs = blocks.map((block) => block.graph).filter(Boolean);
  return {
    id: blocks.length === 1 ? blocks[0].id : 'decisionGraph:source',
    graphs,
    records,
    nodes: blocks.flatMap((block) => block.nodes ?? []),
    edges: blocks.flatMap((block) => block.edges ?? []),
    graphIds: ids(graphs),
    recordIds: ids(records),
    gateIds: idsByKind(records, 'frontier.lang.decisionGraph.gate'),
    evidenceIds: idsByKind(records, 'frontier.lang.decisionGraph.evidence'),
    semanticChangeIds: idsByKind(records, 'frontier.lang.decisionGraph.semanticChange'),
    patchEventIds: idsByKind(records, 'frontier.lang.decisionGraph.patchEvent'),
    admissionDecisionIds: idsByKind(records, 'frontier.lang.decisionGraph.admissionDecision'),
    decisionIds: idsByKind(records, 'frontier.lang.decisionGraph.candidateDecision').concat(idsByKind(records, 'frontier.lang.decisionGraph.mergeDecision')),
    replayRecordIds: idsByKind(records, 'frontier.lang.decisionGraph.replay'),
    tournamentRecordIds: idsByKind(records, 'frontier.lang.decisionGraph.tournament').concat(idsByKind(records, 'frontier.lang.decisionGraph.tournamentCandidate')),
    rsiLoopIds: idsByKind(records, 'frontier.lang.decisionGraph.rsiLoop'),
    summary: {
      graphCount: blocks.length,
      recordCount: records.length,
      nodeCount: sum(blocks, 'nodeCount'),
      edgeCount: sum(blocks, 'edgeCount'),
      semanticChangeCount: sum(blocks, 'semanticChangeCount'),
      gateCount: sum(blocks, 'gateCount'),
      evidenceCount: sum(blocks, 'evidenceCount'),
      admissionDecisionCount: sum(blocks, 'admissionDecisionCount'),
      decisionCount: sum(blocks, 'decisionCount'),
      patchEventCount: sum(blocks, 'patchEventCount'),
      replayCount: sum(blocks, 'replayCount'),
      tournamentCount: sum(blocks, 'tournamentCount'),
      rsiLoopCount: sum(blocks, 'rsiLoopCount')
    },
    metadata: { authoredDecisionGraphBlockIds: blocks.map((block) => block.id) }
  };
}

function mergeInterlinguaBlocks(blocks) {
  const interlinguaRecords = blocks.map((block) => block.record).filter(Boolean);
  const records = blocks.flatMap((block) => block.records ?? []);
  return {
    id: blocks.length === 1 ? blocks[0].id : 'universalInterlingua:source',
    interlinguaRecords,
    records,
    recordIds: ids(records),
    interlinguaRecordIds: ids(interlinguaRecords),
    layerIds: blocks.flatMap((block) => ids(block.record?.layerRecords)),
    constraintIds: blocks.flatMap((block) => ids(block.record?.constraintEdges)),
    obligationIds: blocks.flatMap((block) => ids(block.record?.obligations)),
    loweringIds: blocks.flatMap((block) => ids(block.record?.loweringRecords)),
    liftIds: blocks.flatMap((block) => ids(block.record?.liftRecords)),
    evidenceIds: [...new Set(blocks.flatMap((block) => block.record?.lowering?.evidenceIds ?? []).concat(blocks.flatMap((block) => block.record?.query?.proofEvidenceIds ?? []), blocks.flatMap((block) => block.record?.query?.constraintEvidenceIds ?? [])))],
    routeIds: [...new Set(interlinguaRecords.map((record) => record.routeId).filter(Boolean))],
    summary: {
      interlinguaCount: interlinguaRecords.length,
      recordCount: records.length,
      layerCount: sum(blocks, 'layerCount'),
      constraintCount: sum(blocks, 'constraintCount'),
      obligationCount: sum(blocks, 'obligationCount'),
      loweringCount: sum(blocks, 'loweringCount'),
      liftCount: sum(blocks, 'liftCount'),
      evidenceCount: sum(blocks, 'evidenceCount'),
      missingEvidenceCount: sum(blocks, 'missingEvidenceCount'),
      blockerCount: sum(blocks, 'blockerCount')
    },
    metadata: { authoredInterlinguaBlockIds: blocks.map((block) => block.id) }
  };
}

function mergeResourceGraphBlocks(blocks) {
  const graphs = blocks.map((block) => block.graph).filter(Boolean);
  const records = blocks.flatMap((block) => block.records ?? []);
  return {
    id: blocks.length === 1 ? blocks[0].id : 'semanticResourceGraphs:source',
    graphs,
    resourceGraphs: graphs,
    records,
    graphIds: ids(graphs),
    recordIds: ids(records),
    resourceIds: blocks.flatMap((block) => ids(block.graph?.resources)),
    ownerIds: blocks.flatMap((block) => ids(block.graph?.owners)),
    loanIds: blocks.flatMap((block) => ids(block.graph?.loans)),
    aliasIds: blocks.flatMap((block) => ids(block.graph?.aliases)),
    moveIds: blocks.flatMap((block) => ids(block.graph?.moves)),
    dropIds: blocks.flatMap((block) => ids(block.graph?.drops)),
    escapeIds: blocks.flatMap((block) => ids(block.graph?.escapes)),
    lifetimeRegionIds: blocks.flatMap((block) => ids(block.graph?.lifetimeRegions)),
    lifetimeRelationIds: blocks.flatMap((block) => ids(block.graph?.lifetimeRelations)),
    borrowScopeIds: blocks.flatMap((block) => ids(block.graph?.borrowScopes)),
    unsafeBoundaryIds: blocks.flatMap((block) => ids(block.graph?.unsafeBoundaries)),
    conflictIds: blocks.flatMap((block) => ids(block.graph?.conflicts)),
    proofObligationIds: blocks.flatMap((block) => ids(block.graph?.proofObligations)),
    summary: {
      graphCount: blocks.length,
      recordCount: records.length,
      resourceCount: sum(blocks, 'resources'),
      ownerCount: sum(blocks, 'owners'),
      loanCount: sum(blocks, 'loans'),
      aliasCount: sum(blocks, 'aliases'),
      moveCount: sum(blocks, 'moves'),
      dropCount: sum(blocks, 'drops'),
      escapeCount: sum(blocks, 'escapes'),
      lifetimeRegionCount: sum(blocks, 'lifetimeRegions'),
      lifetimeRelationCount: sum(blocks, 'lifetimeRelations'),
      borrowScopeCount: sum(blocks, 'borrowScopes'),
      unsafeBoundaryCount: sum(blocks, 'unsafeBoundaries'),
      conflictCount: sum(blocks, 'conflicts'),
      proofObligationCount: sum(blocks, 'proofObligations'),
      unsafeBoundariesWithoutProof: sum(blocks, 'unsafeBoundariesWithoutProof')
    },
    metadata: { authoredResourceGraphBlockIds: blocks.map((block) => block.id) }
  };
}

function ids(records = []) {
  return records.map((record) => record?.id).filter(Boolean);
}

function idsByKind(records = [], kind) {
  return ids(records.filter((record) => record?.recordKind === kind || record?.kind === kind));
}

function sum(blocks, key) {
  return blocks.reduce((total, block) => total + (block.summary?.[key] ?? 0), 0);
}
