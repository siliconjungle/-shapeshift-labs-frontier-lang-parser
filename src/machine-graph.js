import { createRowIdentityTracker } from './row-identity.js';
import { pushSemanticUnknownRow } from './semantic-unknown-row.js';

const GROUPS = {
  label: 'labels',
  directive: 'directives',
  register: 'registers',
  flag: 'flags',
  basicBlock: 'basicBlocks',
  instruction: 'instructions',
  operand: 'operands',
  memoryEffect: 'memoryEffects',
  controlEdge: 'controlEdges',
  branch: 'branches',
  call: 'calls',
  return: 'returns',
  interrupt: 'interrupts',
  proofObligation: 'proofObligations',
  proofGap: 'proofGaps',
  evidence: 'evidence'
};
const RECORD_GROUPS = Object.values(GROUPS).concat('unknownRows');

export function parseMachineGraphBlock(block) {
  const name = nameFrom(block.header);
  const rowIdentity = createRowIdentityTracker();
  const graph = {
    kind: 'frontier.lang.machineGraph',
    version: 1,
    id: idFrom(block.header, `machine_graph_${name}`),
    architecture: readLine('architecture', block.body) ?? readLine('arch', block.body),
    dialect: readLine('dialect', block.body),
    sourceLanguage: readLine('sourceLanguage', block.body) ?? readLine('language', block.body),
    sourcePath: readLine('sourcePath', block.body) ?? readLine('path', block.body),
    sourceHash: readLine('sourceHash', block.body),
    status: readLine('status', block.body) ?? 'partial',
    evidenceIds: readListLine('evidence', block.body) ?? readListLine('evidenceIds', block.body) ?? [],
    labels: [],
    directives: [],
    registers: [],
    flags: [],
    basicBlocks: [],
    instructions: [],
    operands: [],
    memoryEffects: [],
    controlEdges: [],
    branches: [],
    calls: [],
    returns: [],
    interrupts: [],
    proofObligations: [],
    proofGaps: [],
    evidence: [],
    unknownRows: [],
    parser: { status: 'authored', errors: rowIdentity.errors },
    claims: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      binaryEquivalenceClaim: false,
      timingEquivalenceClaim: false,
      runtimeEquivalenceClaim: false
    },
    metadata: { name }
  };

  for (const authoredLine of readAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#') || isGraphPropertyLine(line)) continue;
    const match = /^([A-Za-z_$][\w$-]*)\s+([A-Za-z_$@./:*+-][\w$./@:*+-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, rest] = match;
    const normalized = normalizeMachineRowKind(rowKind);
    const record = parseMachineRecord(normalized, rowName, rest, graph, authoredLine);
    const group = GROUPS[normalized];
    if (record && group) {
      rowIdentity.push(graph[group], record, { rowKind, normalizedRowKind: normalized, name: rowName });
    } else {
      pushUnsupportedMachineRow(graph, rowKind, normalized, rowName, rest, authoredLine);
    }
  }

  graph.summary = summarizeMachineGraph(graph);
  graph.status = deriveMachineGraphStatus(graph.status, graph.summary);
  graph.query = {
    labelIds: ids(graph.labels),
    directiveIds: ids(graph.directives),
    registerIds: ids(graph.registers),
    flagIds: ids(graph.flags),
    basicBlockIds: ids(graph.basicBlocks),
    instructionIds: ids(graph.instructions),
    operandIds: ids(graph.operands),
    memoryEffectIds: ids(graph.memoryEffects),
    controlEdgeIds: ids(graph.controlEdges),
    branchIds: ids(graph.branches),
    callIds: ids(graph.calls),
    returnIds: ids(graph.returns),
    interruptIds: ids(graph.interrupts),
    controlFlowEdgeIds: ids([...graph.controlEdges, ...graph.branches, ...graph.calls, ...graph.returns, ...graph.interrupts]),
    proofObligationIds: ids(graph.proofObligations),
    proofGapCodes: unique(graph.proofGaps.map((record) => record.code)),
    unknownRowIds: ids(graph.unknownRows),
    missingEvidence: unique(graph.proofGaps.map((record) => record.code)),
    evidenceIds: unique([...graph.evidenceIds, ...ids(graph.evidence), ...allMachineRecords(graph).flatMap((record) => record.evidenceIds ?? [])]),
    proofEvidenceIds: unique(allMachineRecords(graph).flatMap((record) => record.proofEvidenceIds ?? [])),
    sourceMapIds: unique(allMachineRecords(graph).flatMap((record) => record.sourceMapIds ?? [])),
    sourceMapMappingIds: unique(allMachineRecords(graph).flatMap((record) => record.sourceMapMappingIds ?? [])),
    conflictKeys: unique(allMachineRecords(graph).map((record) => record.conflictKey)),
    blockerReasonCodes: machineBlockerReasonCodes(graph)
  };

  return {
    id: graph.id,
    graph,
    records: allMachineRecords(graph),
    summary: {
      graphCount: 1,
      ...graph.summary
    },
    metadata: { name }
  };
}

function pushUnsupportedMachineRow(graph, rowKind, normalized, rowName, rest, authoredLine) {
  pushSemanticUnknownRow(graph, {
    surfaceKind: 'frontier.lang.machineGraph',
    idPrefix: 'machine_graph',
    reason: 'unsupported-machine-graph-row',
    rowKind,
    normalizedRowKind: normalized,
    rowName,
    text: rest,
    authoredLine,
    rowLabel: 'machineGraph'
  });
}

function parseMachineRecord(kind, name, text, graph, authoredLine = {}) {
  const common = commonRecord(kind, name, text, graph, authoredLine);
  if (kind === 'label') return cleanRecord({ ...common, labelKind: word('kind', text) ?? 'label', address: word('address', text) ?? word('addr', text), symbol: word('symbol', text) ?? name, exported: flag('exported', text) });
  if (kind === 'directive') return cleanRecord({ ...common, directiveKind: word('kind', text) ?? word('directiveKind', text) ?? name, value: quoted('value', text) ?? word('value', text), arguments: list(text, 'argument', 'arguments', 'arg', 'args') });
  if (kind === 'register') return cleanRecord({ ...common, registerName: word('register', text) ?? word('registerName', text) ?? name, registerKind: word('kind', text) ?? word('registerKind', text), widthBits: number('widthBits', text) ?? number('width', text), bank: word('bank', text), aliases: list(text, 'alias', 'aliases'), role: word('role', text) });
  if (kind === 'flag') return cleanRecord({ ...common, flagName: word('flag', text) ?? word('flagName', text) ?? name, flagKind: word('kind', text) ?? word('flagKind', text), bit: number('bit', text), registerId: word('register', text) ?? word('registerId', text) });
  if (kind === 'basicBlock') return cleanRecord({ ...common, blockKind: word('kind', text) ?? word('blockKind', text), entryInstructionId: word('entryInstruction', text) ?? word('entryInstructionId', text), exitInstructionId: word('exitInstruction', text) ?? word('exitInstructionId', text), instructionIds: list(text, 'instruction', 'instructions', 'instructionId', 'instructionIds'), successorIds: list(text, 'successor', 'successors', 'successorId', 'successorIds'), predecessorIds: list(text, 'predecessor', 'predecessors', 'predecessorId', 'predecessorIds'), address: word('address', text) ?? word('addr', text), proofStatus: word('proofStatus', text) ?? word('status', text) });
  if (kind === 'instruction') return cleanRecord({ ...common, mnemonic: word('mnemonic', text) ?? word('op', text) ?? name, opcode: word('opcode', text), instructionKind: word('kind', text) ?? word('instructionKind', text), operationKind: word('operation', text) ?? word('operationKind', text), address: word('address', text) ?? word('addr', text), addressMode: word('addressMode', text) ?? word('mode', text), sizeBytes: number('sizeBytes', text) ?? number('size', text), cycles: number('cycles', text), reads: list(text, 'read', 'reads'), writes: list(text, 'write', 'writes'), flagsRead: list(text, 'flagRead', 'flagsRead'), flagsWritten: list(text, 'flagWrite', 'flagsWritten'), registerIds: list(text, 'register', 'registers', 'registerId', 'registerIds'), memoryEffectIds: list(text, 'memoryEffect', 'memoryEffects', 'memoryEffectId', 'memoryEffectIds'), controlFlow: word('controlFlow', text), branchTarget: word('branchTarget', text), callTarget: word('callTarget', text), proofStatus: word('proofStatus', text) ?? word('status', text), semanticEquivalenceClaim: false, binaryEquivalenceClaim: false, timingEquivalenceClaim: false });
  if (kind === 'operand') return cleanRecord({ ...common, instructionId: word('instruction', text) ?? word('instructionId', text), operandIndex: number('index', text) ?? number('operandIndex', text), operandKind: word('kind', text) ?? word('operandKind', text), value: quoted('value', text) ?? word('value', text), registerIds: list(text, 'register', 'registers', 'registerId', 'registerIds'), memoryReference: quoted('memoryReference', text) ?? word('memoryReference', text) ?? word('memory', text), address: word('address', text) ?? word('addr', text), addressMode: word('addressMode', text) ?? word('mode', text), immediate: word('immediate', text), widthBits: number('widthBits', text) ?? number('width', text) });
  if (kind === 'memoryEffect') return cleanRecord({ ...common, instructionId: word('instruction', text) ?? word('instructionId', text), resourceId: word('resource', text) ?? word('resourceId', text), memoryKind: word('memoryKind', text), effectKind: word('effectKind', text) ?? word('kind', text) ?? name, address: word('address', text) ?? word('addr', text), addressSpace: word('addressSpace', text) ?? word('space', text), widthBits: number('widthBits', text) ?? number('width', text), memoryOrder: word('memoryOrder', text) ?? word('ordering', text), reads: list(text, 'read', 'reads'), writes: list(text, 'write', 'writes'), bank: word('bank', text), volatile: flag('volatile', text), atomic: flag('atomic', text), io: flag('io', text), proofStatus: word('proofStatus', text) ?? word('status', text) ?? 'missing', semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'controlEdge') return cleanRecord({ ...common, instructionId: word('instruction', text) ?? word('instructionId', text), fromInstructionId: word('fromInstruction', text) ?? word('fromInstructionId', text) ?? word('from', text), toInstructionId: word('toInstruction', text) ?? word('toInstructionId', text) ?? word('to', text), fromBlockId: word('fromBlock', text) ?? word('fromBlockId', text), toBlockId: word('toBlock', text) ?? word('toBlockId', text), targetId: word('target', text) ?? word('targetId', text), edgeKind: word('edgeKind', text) ?? word('kind', text) ?? name, condition: quoted('condition', text) ?? word('condition', text), flagIds: list(text, 'flag', 'flags', 'flagId', 'flagIds', 'conditionFlag', 'conditionFlags'), callTarget: word('callTarget', text), returnTarget: word('returnTarget', text), proofStatus: word('proofStatus', text) ?? word('status', text) ?? 'missing', semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'branch') return cleanRecord({ ...common, instructionId: word('instruction', text) ?? word('instructionId', text), fromInstructionId: word('fromInstruction', text) ?? word('fromInstructionId', text) ?? word('from', text), toInstructionId: word('toInstruction', text) ?? word('toInstructionId', text), targetId: word('target', text) ?? word('targetId', text) ?? word('to', text), branchKind: word('kind', text) ?? word('branchKind', text), condition: quoted('condition', text) ?? word('condition', text), flagIds: list(text, 'flag', 'flags', 'flagId', 'flagIds'), proofStatus: word('proofStatus', text) ?? word('status', text) ?? 'missing', semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'call') return cleanRecord({ ...common, instructionId: word('instruction', text) ?? word('instructionId', text), targetId: word('target', text) ?? word('targetId', text), callableId: word('callable', text) ?? word('callableId', text), callingConvention: word('callingConvention', text) ?? word('convention', text), stackEffect: word('stackEffect', text), proofStatus: word('proofStatus', text) ?? word('status', text) ?? 'missing', semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'return') return cleanRecord({ ...common, instructionId: word('instruction', text) ?? word('instructionId', text), fromCallableId: word('fromCallable', text) ?? word('fromCallableId', text) ?? word('from', text), stackEffect: word('stackEffect', text), proofStatus: word('proofStatus', text) ?? word('status', text) });
  if (kind === 'interrupt') return cleanRecord({ ...common, vector: word('vector', text), handlerId: word('handler', text) ?? word('handlerId', text), interruptKind: word('kind', text) ?? word('interruptKind', text), proofStatus: word('proofStatus', text) ?? word('status', text) ?? 'missing', semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'proofObligation') return cleanRecord({ ...common, subjectId: word('subject', text) ?? word('subjectId', text), subjectKind: word('subjectKind', text), obligationKind: word('obligationKind', text) ?? word('kind', text) ?? name, status: word('status', text) ?? 'missing', statement: quoted('statement', text) ?? quoted('summary', text), evidenceIds: list(text, 'evidence', 'evidenceIds') ?? common.evidenceIds, missingEvidence: list(text, 'missingEvidence') ?? common.missingEvidence, semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'proofGap') return cleanRecord({ ...common, code: word('code', text) ?? word('reasonCode', text) ?? name, status: word('status', text) ?? 'missing', summary: quoted('summary', text) ?? quoted('message', text), failClosed: common.failClosed ?? true, semanticEquivalenceClaim: false, binaryEquivalenceClaim: false, timingEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'evidence') return cleanRecord({ ...common, evidenceKind: word('kind', text) ?? word('evidenceKind', text), status: word('status', text) ?? 'unknown', path: word('path', text), command: quoted('command', text) ?? word('command', text), sourceHash: word('sourceHash', text), traceHash: word('traceHash', text), binaryHash: word('binaryHash', text) });
  return undefined;
}

function commonRecord(kind, name, text, graph, authoredLine = {}) {
  return cleanRecord({
    recordKind: recordKind(kind),
    id: idFrom(text, `${recordPrefix(kind)}_${name}`),
    name,
    sourcePath: word('sourcePath', text) ?? word('path', text) ?? graph.sourcePath,
    sourceHash: word('sourceHash', text) ?? graph.sourceHash,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    evidenceIds: list(text, 'evidence', 'evidenceIds') ?? graph.evidenceIds,
    proofEvidenceIds: list(text, 'proofEvidence', 'proofEvidenceId', 'proofEvidenceIds'),
    proofObligationIds: list(text, 'proofObligation', 'proofObligations', 'proofObligationId', 'proofObligationIds', 'obligation', 'obligations'),
    missingEvidence: list(text, 'missingEvidence'),
    sourceMapIds: list(text, 'sourceMap', 'sourceMaps', 'sourceMapId', 'sourceMapIds'),
    sourceMapMappingIds: list(text, 'sourceMapMapping', 'sourceMapMappings', 'sourceMapMappingId', 'sourceMapMappingIds'),
    semanticNodeId: word('semanticNode', text) ?? word('semanticNodeId', text),
    semanticSymbolId: word('semanticSymbol', text) ?? word('semanticSymbolId', text),
    conflictKey: word('conflictKey', text),
    reasonCode: word('reasonCode', text) ?? word('code', text),
    failClosed: flag('failClosed', text),
    metadata: { authoredName: name }
  });
}

function summarizeMachineGraph(graph) {
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
    proofObligations: graph.proofObligations.length,
    proofGaps: graph.proofGaps.length,
    evidence: graph.evidence.length,
    unknownRows: graph.unknownRows.length,
    memoryEffectsWithoutProof: graph.memoryEffects.filter((record) => record.proofStatus !== 'passed').length,
    controlEdgesWithoutProof: graph.controlEdges.filter((record) => record.proofStatus !== 'passed').length,
    branchesWithoutProof: graph.branches.filter((record) => record.proofStatus !== 'passed').length,
    callsWithoutProof: graph.calls.filter((record) => record.proofStatus !== 'passed').length,
    interruptsWithoutProof: graph.interrupts.filter((record) => record.proofStatus !== 'passed').length,
    parseErrors: graph.parser?.errors?.length ?? 0,
    reasonCodes: unique([...unprovedMachineRecords(graph), ...graph.proofGaps].map((record) => record.reasonCode ?? record.code))
  };
}

function deriveMachineGraphStatus(authoredStatus, summary) {
  if (
    summary.proofGaps > 0 ||
    summary.parseErrors > 0 ||
    summary.memoryEffectsWithoutProof > 0 ||
    summary.controlEdgesWithoutProof > 0 ||
    summary.branchesWithoutProof > 0 ||
    summary.callsWithoutProof > 0 ||
    summary.interruptsWithoutProof > 0
  ) return 'blocked';
  return authoredStatus ?? 'partial';
}

function machineBlockerReasonCodes(graph) {
  return unique([...unprovedMachineRecords(graph), ...graph.proofGaps].map((record) => record.reasonCode ?? record.code));
}

function unprovedMachineRecords(graph) {
  return [
    ...graph.memoryEffects,
    ...graph.controlEdges,
    ...graph.branches,
    ...graph.calls,
    ...graph.interrupts
  ].filter((record) => record.proofStatus !== 'passed');
}

function allMachineRecords(graph) {
  return RECORD_GROUPS.flatMap((group) => graph[group] ?? []);
}

export function normalizeMachineRowKind(kind) {
  if (kind === 'reg') return 'register';
  if (kind === 'conditionFlag') return 'flag';
  if (kind === 'block') return 'basicBlock';
  if (kind === 'inst' || kind === 'instr' || kind === 'op' || kind === 'opcode') return 'instruction';
  if (kind === 'arg') return 'operand';
  if (kind === 'mem' || kind === 'memory' || kind === 'memoryAccess' || kind === 'effect' || kind === 'load' || kind === 'store' || kind === 'atomic' || kind === 'fence' || kind === 'memoryEffect') return 'memoryEffect';
  if (kind === 'edge') return 'controlEdge';
  if (kind === 'ret') return 'return';
  if (kind === 'irq' || kind === 'exception') return 'interrupt';
  if (kind === 'proof' || kind === 'obligation') return 'proofObligation';
  if (kind === 'gap' || kind === 'proofGap') return 'proofGap';
  if (kind === 'proofEvidence') return 'evidence';
  return kind;
}

function recordKind(kind) {
  if (kind === 'memoryEffect') return 'memory-effect';
  if (kind === 'proofGap') return 'proof-gap';
  return kind;
}

function recordPrefix(kind) {
  return recordKind(kind).replace(/-/g, '_');
}

function isGraphPropertyLine(line) {
  const property = /^(architecture|arch|dialect|sourceLanguage|language|sourcePath|path|sourceHash|status|evidence|evidenceIds)\s+/.exec(line)?.[1];
  if (!property) return false;
  if ((property === 'evidence' || property === 'evidenceIds') && /@id\(/.test(line)) return false;
  return true;
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'MachineGraph'; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readListLine(label, body) {
  const line = readLine(label, body);
  return line ? line.split(/[|,]/).map((item) => item.trim()).filter(Boolean) : undefined;
}
function word(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function quoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function flag(label, text) { return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(text) || undefined; }
function number(label, text) {
  const value = word(label, text);
  return value === undefined ? undefined : Number(value);
}
function list(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function unique(values = []) { return [...new Set(values.filter(Boolean))]; }
function readAuthoredLines(block) {
  const lines = block.body.split('\n');
  const records = [];
  let lineStart = block.syntax?.bodyStartOffset ?? 0;
  for (const rawLine of lines) {
    const rawEnd = lineStart + rawLine.length;
    const leading = /^\s*/.exec(rawLine)?.[0].length ?? 0;
    const trailing = /\s*$/.exec(rawLine)?.[0].length ?? 0;
    const startOffset = lineStart + leading;
    const endOffset = Math.max(startOffset, rawEnd - trailing);
    records.push({ text: rawLine.trim(), startOffset, endOffset, sourceSpan: typeof block.sourceSpan === 'function' ? block.sourceSpan(startOffset, endOffset) : undefined });
    lineStart = rawEnd + 1;
  }
  return records;
}
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
