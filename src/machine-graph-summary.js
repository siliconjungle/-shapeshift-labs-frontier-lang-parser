const RECORD_GROUPS = [
  'labels',
  'directives',
  'registers',
  'flags',
  'basicBlocks',
  'instructions',
  'operands',
  'memoryEffects',
  'controlEdges',
  'branches',
  'calls',
  'returns',
  'interrupts',
  'traps',
  'undefinedBehaviors',
  'proofObligations',
  'proofGaps',
  'evidence',
  'sourceMaps',
  'missingEvidence',
  'unknownRows'
];

export function summarizeMachineGraph(graph) {
  return {
    records: allMachineRecords(graph).length,
    labels: graph.labels.length,
    directives: graph.directives.length,
    registers: graph.registers.length,
    flags: graph.flags.length,
    basicBlocks: graph.basicBlocks.length,
    instructions: graph.instructions.length,
    operands: graph.operands.length,
    memoryEffects: graph.memoryEffects.length,
    controlEdges: graph.controlEdges.length,
    branches: graph.branches.length,
    calls: graph.calls.length,
    returns: graph.returns.length,
    interrupts: graph.interrupts.length,
    traps: graph.traps.length,
    undefinedBehaviors: graph.undefinedBehaviors.length,
    proofObligations: graph.proofObligations.length,
    proofGaps: graph.proofGaps.length,
    evidence: graph.evidence.length,
    sourceMaps: graph.sourceMaps.length,
    missingEvidence: graph.missingEvidence.length,
    unknownRows: graph.unknownRows.length,
    memoryEffectsWithoutProof: graph.memoryEffects.filter((record) => record.proofStatus !== 'passed').length,
    controlEdgesWithoutProof: graph.controlEdges.filter((record) => record.proofStatus !== 'passed').length,
    branchesWithoutProof: graph.branches.filter((record) => record.proofStatus !== 'passed').length,
    callsWithoutProof: graph.calls.filter((record) => record.proofStatus !== 'passed').length,
    interruptsWithoutProof: graph.interrupts.filter((record) => record.proofStatus !== 'passed').length,
    failClosedTraps: graph.traps.filter((record) => record.failClosed).length,
    trapsWithoutProof: graph.traps.filter((record) => record.proofStatus !== 'passed').length,
    undefinedBehaviorsWithoutProof: graph.undefinedBehaviors.filter((record) => record.proofStatus !== 'passed').length,
    parseErrors: graph.parser?.errors?.length ?? 0,
    reasonCodes: unique([...unprovedMachineRecords(graph), ...graph.proofGaps].map((record) => record.reasonCode ?? record.code))
  };
}

export function deriveMachineGraphStatus(authoredStatus, summary) {
  if (
    summary.proofGaps > 0 ||
    summary.parseErrors > 0 ||
    summary.memoryEffectsWithoutProof > 0 ||
    summary.controlEdgesWithoutProof > 0 ||
    summary.branchesWithoutProof > 0 ||
    summary.callsWithoutProof > 0 ||
    summary.interruptsWithoutProof > 0 ||
    summary.trapsWithoutProof > 0 ||
    summary.undefinedBehaviorsWithoutProof > 0
  ) return 'blocked';
  return authoredStatus ?? 'partial';
}

export function machineBlockerReasonCodes(graph) {
  return unique([...unprovedMachineRecords(graph), ...graph.proofGaps].map((record) => record.reasonCode ?? record.code));
}

export function allMachineRecords(graph) {
  return RECORD_GROUPS.flatMap((group) => graph[group] ?? []);
}

function unprovedMachineRecords(graph) {
  return [
    ...graph.memoryEffects,
    ...graph.controlEdges,
    ...graph.branches,
    ...graph.calls,
    ...graph.interrupts,
    ...graph.traps,
    ...graph.undefinedBehaviors
  ].filter((record) => record.proofStatus !== 'passed');
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}
