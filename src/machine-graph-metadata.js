export function mergeMachineGraphBlocks(blocks) {
  const graphs = blocks.map((block) => block.graph).filter(Boolean);
  const records = blocks.flatMap((block) => block.records ?? []);
  return {
    id: blocks.length === 1 ? blocks[0].id : 'machineGraphs:source',
    graphs,
    machineGraphs: graphs,
    records,
    graphIds: ids(graphs),
    recordIds: ids(records),
    labelIds: blocks.flatMap((block) => ids(block.graph?.labels)),
    directiveIds: blocks.flatMap((block) => ids(block.graph?.directives)),
    registerIds: blocks.flatMap((block) => ids(block.graph?.registers)),
    flagIds: blocks.flatMap((block) => ids(block.graph?.flags)),
    basicBlockIds: blocks.flatMap((block) => ids(block.graph?.basicBlocks)),
    instructionIds: blocks.flatMap((block) => ids(block.graph?.instructions)),
    operandIds: blocks.flatMap((block) => ids(block.graph?.operands)),
    memoryEffectIds: blocks.flatMap((block) => ids(block.graph?.memoryEffects)),
    controlEdgeIds: blocks.flatMap((block) => ids(block.graph?.controlEdges)),
    branchIds: blocks.flatMap((block) => ids(block.graph?.branches)),
    callIds: blocks.flatMap((block) => ids(block.graph?.calls)),
    returnIds: blocks.flatMap((block) => ids(block.graph?.returns)),
    interruptIds: blocks.flatMap((block) => ids(block.graph?.interrupts)),
    trapIds: blocks.flatMap((block) => ids(block.graph?.traps)),
    undefinedBehaviorIds: blocks.flatMap((block) => ids(block.graph?.undefinedBehaviors)),
    proofObligationIds: blocks.flatMap((block) => ids(block.graph?.proofObligations)),
    proofGapCodes: unique(blocks.flatMap((block) => block.graph?.query?.proofGapCodes ?? [])),
    unknownRowIds: blocks.flatMap((block) => ids(block.graph?.unknownRows)),
    missingEvidenceIds: blocks.flatMap((block) => ids(block.graph?.missingEvidence)),
    missingEvidence: unique(blocks.flatMap((block) => block.graph?.query?.missingEvidence ?? [])),
    evidenceIds: unique(blocks.flatMap((block) => block.graph?.query?.evidenceIds ?? [])),
    proofEvidenceIds: unique(blocks.flatMap((block) => block.graph?.query?.proofEvidenceIds ?? [])),
    sourceMapIds: unique(blocks.flatMap((block) => block.graph?.query?.sourceMapIds ?? [])),
    sourceMapMappingIds: unique(blocks.flatMap((block) => block.graph?.query?.sourceMapMappingIds ?? [])),
    failClosedTrapIds: blocks.flatMap((block) => block.graph?.query?.failClosedTrapIds ?? []),
    conflictKeys: unique(blocks.flatMap((block) => block.graph?.query?.conflictKeys ?? [])),
    summary: summary(blocks, records),
    metadata: { authoredMachineGraphBlockIds: blocks.map((block) => block.id) }
  };
}

function summary(blocks, records) {
  return {
    graphCount: blocks.length,
    recordCount: records.length,
    labelCount: sum(blocks, 'labels'),
    directiveCount: sum(blocks, 'directives'),
    registerCount: sum(blocks, 'registers'),
    flagCount: sum(blocks, 'flags'),
    basicBlockCount: sum(blocks, 'basicBlocks'),
    instructionCount: sum(blocks, 'instructions'),
    operandCount: sum(blocks, 'operands'),
    memoryEffectCount: sum(blocks, 'memoryEffects'),
    controlEdgeCount: sum(blocks, 'controlEdges'),
    branchCount: sum(blocks, 'branches'),
    callCount: sum(blocks, 'calls'),
    returnCount: sum(blocks, 'returns'),
    interruptCount: sum(blocks, 'interrupts'),
    trapCount: sum(blocks, 'traps'),
    undefinedBehaviorCount: sum(blocks, 'undefinedBehaviors'),
    proofObligationCount: sum(blocks, 'proofObligations'),
    proofGapCount: sum(blocks, 'proofGaps'),
    evidenceCount: sum(blocks, 'evidence'),
    sourceMapCount: sum(blocks, 'sourceMaps'),
    missingEvidenceCount: sum(blocks, 'missingEvidence'),
    unknownRowCount: sum(blocks, 'unknownRows'),
    parseErrorCount: sum(blocks, 'parseErrors'),
    memoryEffectsWithoutProof: sum(blocks, 'memoryEffectsWithoutProof'),
    controlEdgesWithoutProof: sum(blocks, 'controlEdgesWithoutProof'),
    branchesWithoutProof: sum(blocks, 'branchesWithoutProof'),
    callsWithoutProof: sum(blocks, 'callsWithoutProof'),
    interruptsWithoutProof: sum(blocks, 'interruptsWithoutProof'),
    failClosedTrapCount: sum(blocks, 'failClosedTraps'),
    trapWithoutProofCount: sum(blocks, 'trapsWithoutProof'),
    undefinedBehaviorWithoutProofCount: sum(blocks, 'undefinedBehaviorsWithoutProof')
  };
}

function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function unique(values = []) { return [...new Set(values.filter(Boolean))]; }
function sum(blocks, key) { return blocks.reduce((total, block) => total + (block.summary?.[key] ?? 0), 0); }
