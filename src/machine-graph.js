import { createRowIdentityTracker } from './row-identity.js';
import { pushSemanticUnknownRow } from './semantic-unknown-row.js';
import { allMachineRecords, deriveMachineGraphStatus, machineBlockerReasonCodes, summarizeMachineGraph } from './machine-graph-summary.js';

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
  trap: 'traps',
  undefinedBehavior: 'undefinedBehaviors',
  proofObligation: 'proofObligations',
  proofGap: 'proofGaps',
  evidence: 'evidence',
  sourceMap: 'sourceMaps',
  missingEvidence: 'missingEvidence'
};

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
    traps: [],
    undefinedBehaviors: [],
    proofObligations: [],
    proofGaps: [],
    evidence: [],
    sourceMaps: [],
    missingEvidence: [],
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
    trapIds: ids(graph.traps),
    undefinedBehaviorIds: ids(graph.undefinedBehaviors),
    controlFlowEdgeIds: ids([...graph.controlEdges, ...graph.branches, ...graph.calls, ...graph.returns, ...graph.interrupts]),
    proofObligationIds: ids(graph.proofObligations),
    proofGapCodes: unique(graph.proofGaps.map((record) => record.code)),
    unknownRowIds: ids(graph.unknownRows),
    missingEvidenceIds: ids(graph.missingEvidence),
    missingEvidence: unique([...graph.missingEvidence.map((record) => record.reasonCode), ...graph.proofGaps.map((record) => record.code), ...allMachineRecords(graph).flatMap((record) => record.missingEvidence ?? [])]),
    evidenceIds: unique([...graph.evidenceIds, ...ids(graph.evidence), ...allMachineRecords(graph).flatMap((record) => record.evidenceIds ?? [])]),
    proofEvidenceIds: unique(allMachineRecords(graph).flatMap((record) => record.proofEvidenceIds ?? [])),
    sourceMapIds: unique([...ids(graph.sourceMaps), ...allMachineRecords(graph).flatMap((record) => record.sourceMapIds ?? [])]),
    sourceMapMappingIds: unique(allMachineRecords(graph).flatMap((record) => record.sourceMapMappingIds ?? [])),
    failClosedTrapIds: ids(graph.traps.filter((record) => record.failClosed)),
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
  if (kind === 'branch') return cleanRecord({ ...common, instructionId: word('instruction', text) ?? word('instructionId', text), fromInstructionId: word('fromInstruction', text) ?? word('fromInstructionId', text) ?? word('from', text), toInstructionId: word('toInstruction', text) ?? word('toInstructionId', text), targetId: word('target', text) ?? word('targetId', text) ?? word('to', text), branchKind: word('kind', text) ?? word('branchKind', text), condition: quoted('condition', text) ?? word('condition', text), flagIds: list(text, 'flag', 'flags', 'flagId', 'flagIds', 'conditionFlag', 'conditionFlags'), proofStatus: word('proofStatus', text) ?? word('status', text) ?? 'missing', semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'call') return cleanRecord({ ...common, instructionId: word('instruction', text) ?? word('instructionId', text), targetId: word('target', text) ?? word('targetId', text), callableId: word('callable', text) ?? word('callableId', text), callingConvention: word('callingConvention', text) ?? word('convention', text), stackEffect: word('stackEffect', text), proofStatus: word('proofStatus', text) ?? word('status', text) ?? 'missing', semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'return') return cleanRecord({ ...common, instructionId: word('instruction', text) ?? word('instructionId', text), fromCallableId: word('fromCallable', text) ?? word('fromCallableId', text) ?? word('from', text), stackEffect: word('stackEffect', text), proofStatus: word('proofStatus', text) ?? word('status', text) });
  if (kind === 'interrupt') return cleanRecord({ ...common, vector: word('vector', text), handlerId: word('handler', text) ?? word('handlerId', text), interruptKind: word('kind', text) ?? word('interruptKind', text), proofStatus: word('proofStatus', text) ?? word('status', text) ?? 'missing', semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'trap') return cleanRecord({ ...common, trapKind: word('kind', text) ?? word('trapKind', text) ?? name, instructionId: word('instruction', text) ?? word('instructionId', text), memoryEffectId: word('memoryEffect', text) ?? word('memoryEffectId', text), trapCode: word('trapCode', text) ?? word('code', text), condition: quoted('condition', text) ?? word('condition', text), vector: word('vector', text), status: word('status', text) ?? 'open', severity: word('severity', text) ?? 'error', reasonCode: word('reasonCode', text) ?? word('code', text) ?? common.reasonCode ?? `${name}-trap-proof-missing`, proofStatus: word('proofStatus', text) ?? 'missing', failClosed: common.failClosed ?? true, semanticEquivalenceClaim: false, binaryEquivalenceClaim: false, timingEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'undefinedBehavior') return cleanRecord({ ...common, undefinedBehaviorKind: word('kind', text) ?? word('undefinedBehaviorKind', text) ?? word('behaviorKind', text) ?? name, instructionId: word('instruction', text) ?? word('instructionId', text), memoryEffectId: word('memoryEffect', text) ?? word('memoryEffectId', text), operation: word('operation', text), condition: quoted('condition', text) ?? word('condition', text), language: word('language', text) ?? graph.sourceLanguage, status: word('status', text) ?? 'blocked', severity: word('severity', text) ?? 'error', reasonCode: word('reasonCode', text) ?? word('code', text) ?? common.reasonCode ?? `${name}-undefined-behavior-proof-missing`, proofStatus: word('proofStatus', text) ?? 'missing', failClosed: common.failClosed ?? true, semanticEquivalenceClaim: false, binaryEquivalenceClaim: false, timingEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'proofObligation') return cleanRecord({ ...common, subjectId: word('subject', text) ?? word('subjectId', text), subjectKind: word('subjectKind', text), obligationKind: word('obligationKind', text) ?? word('kind', text) ?? name, status: word('status', text) ?? 'missing', statement: quoted('statement', text) ?? quoted('summary', text), evidenceIds: list(text, 'evidence', 'evidenceIds') ?? common.evidenceIds, missingEvidence: list(text, 'missingEvidence') ?? common.missingEvidence, semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'proofGap') return cleanRecord({ ...common, code: word('code', text) ?? word('reasonCode', text) ?? name, status: word('status', text) ?? 'missing', summary: quoted('summary', text) ?? quoted('message', text), failClosed: common.failClosed ?? true, semanticEquivalenceClaim: false, binaryEquivalenceClaim: false, timingEquivalenceClaim: false, runtimeEquivalenceClaim: false });
  if (kind === 'evidence') return cleanRecord({ ...common, evidenceKind: word('kind', text) ?? word('evidenceKind', text), status: word('status', text) ?? 'unknown', path: word('path', text), command: quoted('command', text) ?? word('command', text), sourceHash: word('sourceHash', text), traceHash: word('traceHash', text), binaryHash: word('binaryHash', text) });
  if (kind === 'sourceMap') return cleanRecord({ ...common, sourceRecordId: word('sourceRecord', text) ?? word('sourceRecordId', text), targetRecordId: word('targetRecord', text) ?? word('targetRecordId', text), generatedPath: word('generated', text) ?? word('generatedPath', text) ?? word('targetPath', text), originalPath: word('original', text) ?? word('originalPath', text) ?? word('sourcePath', text), mappingHash: word('mappingHash', text), status: word('status', text) ?? 'authored' });
  if (kind === 'missingEvidence') return cleanRecord({ ...common, reasonCode: word('reason', text) ?? word('reasonCode', text) ?? word('code', text) ?? name, status: word('status', text) ?? 'missing', severity: word('severity', text) ?? 'warning', summary: quoted('summary', text) ?? quoted('message', text), failClosed: common.failClosed ?? true, semanticEquivalenceClaim: false, binaryEquivalenceClaim: false, timingEquivalenceClaim: false, runtimeEquivalenceClaim: false });
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
  if (kind === 'traps') return 'trap';
  if (kind === 'undefined' || kind === 'undefinedBehaviour' || kind === 'ub') return 'undefinedBehavior';
  if (kind === 'proof' || kind === 'obligation') return 'proofObligation';
  if (kind === 'gap' || kind === 'proofGap') return 'proofGap';
  if (kind === 'proofEvidence') return 'evidence';
  if (kind === 'sourcemap' || kind === 'mapping' || kind === 'sourceMapMapping') return 'sourceMap';
  return kind;
}

function recordKind(kind) {
  if (kind === 'memoryEffect') return 'memory-effect';
  if (kind === 'undefinedBehavior') return 'undefined-behavior';
  if (kind === 'proofGap') return 'proof-gap';
  if (kind === 'sourceMap') return 'source-map';
  if (kind === 'missingEvidence') return 'missing-evidence';
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
