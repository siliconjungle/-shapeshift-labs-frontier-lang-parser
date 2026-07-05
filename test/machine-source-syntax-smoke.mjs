import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax } from '../dist/index.js';

const machineGraphSyntaxSource = `module MachineSyntaxProbe @id("mod_machine_syntax_probe") {
machineGraph Counter @id("machine_graph_counter") {
  architecture asm-65816
  dialect snes-asm
  language assembly
  path src/counter.asm
  sourceHash sha256:counter
  status partial
  evidenceIds evidence_trace
  label loop @id("label_loop") address $808000
  directive bank @id("directive_bank") kind bank value 01
  reg a @id("register_a") widthBits 16
  flag z @id("flag_z") bit 1
  block loop @id("basic_block_loop") entryInstruction instruction_lda exitInstruction instruction_bne
  inst lda @id("instruction_lda") mnemonic LDA
  arg value @id("operand_value") instruction instruction_lda index 0
  load counter @id("memory_effect_load") instruction instruction_lda proofStatus missing
  edge loop @id("control_edge_loop") from instruction_bne to label_loop proofStatus missing
  branch loop @id("branch_loop") from instruction_bne to label_loop proofStatus missing
  call draw @id("call_draw") target drawSprite proofStatus passed
  ret draw @id("return_draw") instruction instruction_rtl proofStatus passed
  irq nmi @id("interrupt_nmi") vector nmi proofStatus missing
  sourceMap machine @id("machine_source_map") generated dist/counter.asm
  mapping branch @id("machine_mapping_branch") sourceRecord instruction_bne targetRecord control_edge_loop generated dist/counter.asm
  sourceMapMapping jump @id("machine_source_map_mapping_jump") sourceRecord instruction_bne targetRecord branch_loop generated dist/counter.asm
  missingEvidence timing @id("machine_missing_timing") reason cycle-timing-proof
  trap bounds @id("machine_trap_bounds") instruction instruction_lda kind bounds-check code machine-trap-proof-missing failClosed
  ub overflow @id("machine_ub_overflow") instruction instruction_lda kind signed-overflow code machine-ub-proof-missing failClosed
  proof branchTarget @id("proof_obligation_branch_target") subject control_edge_loop status missing
  gap timing @id("machine_gap_timing") code assembly-cycle-timing-boundary
  proofEvidence trace @id("evidence_trace") kind emulator-trace status passed
}
}`;

const report = inspectFrontierSourceSyntax(machineGraphSyntaxSource, { sourcePath: 'machine-syntax.frontier' });
assert.equal(report.summary.unknownBlockCount, 0);
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.childCount, 29);
assert.equal(report.summary.recognizedChildCount, 29);
assert.equal(report.summary.recognizedChildKinds.includes('machineGraphRow'), true);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.architecture, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.dialect, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.sourceLanguage, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.sourcePath, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.sourceHash, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.status, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.evidence, 2);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.sourceMap, 3);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.missingEvidence, 1);

function machineChild(id) {
  const block = report.recognizedBlocks.find((candidate) => candidate.id === 'machine_graph_counter');
  assert.ok(block);
  const child = block.children.find((candidate) => candidate.id === id);
  assert.ok(child, id);
  assert.equal(child.sourceSpan.path, 'machine-syntax.frontier');
  assert.equal(child.sourceSpan.blockId, 'machine_graph_counter');
  return child;
}

assert.equal(machineChild('register_a').normalizedRowKind, 'register');
assert.equal(machineChild('basic_block_loop').normalizedRowKind, 'basicBlock');
assert.equal(machineChild('instruction_lda').normalizedRowKind, 'instruction');
assert.equal(machineChild('operand_value').normalizedRowKind, 'operand');
assert.equal(machineChild('memory_effect_load').normalizedRowKind, 'memoryEffect');
assert.equal(machineChild('control_edge_loop').normalizedRowKind, 'controlEdge');
assert.equal(machineChild('branch_loop').normalizedRowKind, 'branch');
assert.equal(machineChild('return_draw').normalizedRowKind, 'return');
assert.equal(machineChild('interrupt_nmi').normalizedRowKind, 'interrupt');
assert.equal(machineChild('machine_source_map').normalizedRowKind, 'sourceMap');
assert.equal(machineChild('machine_mapping_branch').normalizedRowKind, 'sourceMap');
assert.equal(machineChild('machine_source_map_mapping_jump').normalizedRowKind, 'sourceMap');
assert.equal(machineChild('machine_missing_timing').normalizedRowKind, 'missingEvidence');
assert.equal(machineChild('machine_trap_bounds').normalizedRowKind, 'trap');
assert.equal(machineChild('machine_ub_overflow').normalizedRowKind, 'undefinedBehavior');
assert.equal(machineChild('proof_obligation_branch_target').normalizedRowKind, 'proofObligation');
assert.equal(machineChild('machine_gap_timing').normalizedRowKind, 'proofGap');
assert.equal(machineChild('evidence_trace').normalizedRowKind, 'evidence');

const unknownReport = inspectFrontierSourceSyntax(`module UnknownMachineSyntax @id("mod_unknown_machine_syntax") {
machineGraph Unknown @id("machine_graph_unknown") {
  mysteryFact lowLevel @id("machine_unknown_low_level")
}
}`);

assert.equal(unknownReport.summary.failClosed, true);
assert.equal(unknownReport.summary.unknownChildCount, 1);
assert.equal(unknownReport.unknownChildren[0].reason, 'unsupported-machine-graph-row');
