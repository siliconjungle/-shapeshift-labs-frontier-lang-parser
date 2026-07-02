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

export function createParsedMetadata({ proofBlocks = [], paradigmBlocks = [], operationBlocks = [], conversionBlocks = [], constraintSpaceBlocks = [], nativeSourceBlocks = [] } = {}) {
  const metadata = {};
  if (proofBlocks.length) metadata.proof = mergeProofBlocks(proofBlocks);
  if (paradigmBlocks.length) metadata.paradigmSemantics = mergeParadigmBlocks(paradigmBlocks);
  if (operationBlocks.length) metadata.semanticOperations = mergeOperationBlocks(operationBlocks);
  if (conversionBlocks.length) metadata.universalConversionPlan = mergeConversionBlocks(conversionBlocks);
  if (constraintSpaceBlocks.length) metadata.constraintSpaces = mergeConstraintSpaceBlocks(constraintSpaceBlocks);
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

function ids(records = []) {
  return records.map((record) => record?.id).filter(Boolean);
}

function sum(blocks, key) {
  return blocks.reduce((total, block) => total + (block.summary?.[key] ?? 0), 0);
}
