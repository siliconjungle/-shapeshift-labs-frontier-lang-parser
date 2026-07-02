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

export function createParsedMetadata({ proofBlocks = [], paradigmBlocks = [], operationBlocks = [] } = {}) {
  const metadata = {};
  if (proofBlocks.length) metadata.proof = mergeProofBlocks(proofBlocks);
  if (paradigmBlocks.length) metadata.paradigmSemantics = mergeParadigmBlocks(paradigmBlocks);
  if (operationBlocks.length) metadata.semanticOperations = mergeOperationBlocks(operationBlocks);
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
