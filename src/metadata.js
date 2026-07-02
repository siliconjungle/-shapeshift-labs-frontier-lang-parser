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

export function createParsedMetadata({ proofBlocks = [], paradigmBlocks = [], operationBlocks = [], conversionBlocks = [] } = {}) {
  const metadata = {};
  if (proofBlocks.length) metadata.proof = mergeProofBlocks(proofBlocks);
  if (paradigmBlocks.length) metadata.paradigmSemantics = mergeParadigmBlocks(paradigmBlocks);
  if (operationBlocks.length) metadata.semanticOperations = mergeOperationBlocks(operationBlocks);
  if (conversionBlocks.length) metadata.universalConversionPlan = mergeConversionBlocks(conversionBlocks);
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
