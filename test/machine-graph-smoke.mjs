import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const doc = parseFrontierSource(`module MachineProbe @id("mod_machine_probe") {
machineGraph CounterLoop @id("machine_graph_counter_loop") {
  architecture asm-65816
  dialect snes-asm
  sourceLanguage assembly
  sourcePath src/counter.asm
  sourceHash sha256:counter
  evidence evidence_counter_trace
  label loop @id("label_loop") address $808000 exported evidence evidence_counter_trace
  directive bank @id("directive_bank") kind bank value 01 evidence evidence_counter_trace
  register a @id("register_a") kind accumulator widthBits 16 bank m aliases acc|A evidence evidence_counter_trace
  conditionFlag zero @id("flag_zero") kind zero bit 1 register register_p evidence evidence_counter_trace
  block loop @id("basic_block_loop") entryInstruction instruction_lda exitInstruction instruction_bne instruction instruction_lda|instruction_bne successor basic_block_loop proofStatus passed evidence evidence_counter_trace
  instruction lda @id("instruction_lda") mnemonic LDA opcode A9 address $808000 addressMode immediate sizeBytes 3 cycles 2 writes register_a flagsWritten flag_zero memoryEffect memory_effect_counter_load proofStatus passed evidence evidence_counter_trace
  operand ldaValue @id("operand_lda_value") instruction instruction_lda index 0 kind immediate value "#$0001" widthBits 16 evidence evidence_counter_trace
  memoryEffect loadCounter @id("memory_effect_counter_load") instruction instruction_lda resource resource_counter kind load address $7E0010 addressSpace wram widthBits 16 memoryOrder sequential reads counter.value proofStatus missing reasonCode machine-memory-effect-proof-missing evidence evidence_counter_trace
  edge loopBackGeneric @id("control_edge_loop_back") from instruction_bne to label_loop kind conditional condition "Z == 0" conditionFlag flag_zero proofStatus missing reasonCode machine-control-edge-proof-missing evidence evidence_counter_trace
  branch loopBack @id("branch_loop_back") instruction instruction_bne from instruction_bne to label_loop kind conditional condition "Z == 0" conditionFlag flag_zero proofStatus missing reasonCode machine-branch-target-proof-missing evidence evidence_counter_trace
  call draw @id("call_draw") instruction instruction_jsl target drawSprite callingConvention 65816-long stackEffect pushes-return proofStatus passed evidence evidence_counter_trace
  return rtl @id("return_rtl") instruction instruction_rtl from drawSprite stackEffect pops-return proofStatus passed evidence evidence_counter_trace
  interrupt nmi @id("interrupt_nmi") vector nmi handler nmiHandler kind hardware proofStatus missing reasonCode machine-interrupt-proof-missing evidence evidence_counter_trace
  sourceMap machine @id("machine_source_map") sourceRecord instruction_lda targetRecord memory_effect_counter_load generated dist/counter.asm mappingHash sha256:machine-map evidence evidence_counter_trace
  mapping branch @id("machine_mapping_branch") sourceRecord instruction_bne targetRecord control_edge_loop_back generated dist/counter.asm evidence evidence_counter_trace
  sourceMapMapping jump @id("machine_source_map_mapping_jump") sourceRecord instruction_bne targetRecord branch_loop_back generated dist/counter.asm evidence evidence_counter_trace
  missingEvidence timing @id("machine_missing_timing") reason cycle-timing-proof summary "Cycle timing proof is required before admission."
  trap bounds @id("machine_trap_bounds") instruction instruction_lda memoryEffect memory_effect_counter_load kind bounds-check trapCode machine-bounds-trap reasonCode machine-trap-proof-missing proofStatus missing failClosed condition "address exceeds bank" evidence evidence_counter_trace
  ub overflow @id("machine_ub_overflow") instruction instruction_lda kind signed-overflow operation adc reasonCode machine-ub-proof-missing proofStatus missing failClosed evidence evidence_counter_trace
  proof branchTarget @id("proof_obligation_branch_target") subject control_edge_loop_back subjectKind controlEdge kind target-resolution status missing missingEvidence control-flow-trace evidence evidence_counter_trace
  proofGap cycleTiming @id("machine_gap_cycle_timing") code assembly-cycle-timing-boundary status missing summary "Cycle timing needs hardware trace." failClosed evidence evidence_counter_trace
  evidence trace @id("evidence_counter_trace") kind emulator-trace status passed path reports/counter-trace.json traceHash hash_trace
}
}`);

const graphs = doc.metadata.machineGraphs;
assert.equal(graphs.id, 'machine_graph_counter_loop');
assert.equal(graphs.summary.graphCount, 1);
assert.equal(graphs.summary.labelCount, 1);
assert.equal(graphs.summary.directiveCount, 1);
assert.equal(graphs.summary.registerCount, 1);
assert.equal(graphs.summary.flagCount, 1);
assert.equal(graphs.summary.basicBlockCount, 1);
assert.equal(graphs.summary.instructionCount, 1);
assert.equal(graphs.summary.operandCount, 1);
assert.equal(graphs.summary.memoryEffectCount, 1);
assert.equal(graphs.summary.controlEdgeCount, 1);
assert.equal(graphs.summary.branchCount, 1);
assert.equal(graphs.summary.callCount, 1);
assert.equal(graphs.summary.returnCount, 1);
assert.equal(graphs.summary.interruptCount, 1);
assert.equal(graphs.summary.trapCount, 1);
assert.equal(graphs.summary.undefinedBehaviorCount, 1);
assert.equal(graphs.summary.proofObligationCount, 1);
assert.equal(graphs.summary.proofGapCount, 1);
assert.equal(graphs.summary.evidenceCount, 1);
assert.equal(graphs.summary.sourceMapCount, 3);
assert.equal(graphs.summary.missingEvidenceCount, 1);
assert.equal(graphs.summary.memoryEffectsWithoutProof, 1);
assert.equal(graphs.summary.controlEdgesWithoutProof, 1);
assert.equal(graphs.summary.branchesWithoutProof, 1);
assert.equal(graphs.summary.callsWithoutProof, 0);
assert.equal(graphs.summary.interruptsWithoutProof, 1);
assert.equal(graphs.summary.trapWithoutProofCount, 1);
assert.equal(graphs.summary.undefinedBehaviorWithoutProofCount, 1);
assert.equal(graphs.graphIds[0], 'machine_graph_counter_loop');
assert.equal(graphs.labelIds[0], 'label_loop');
assert.equal(graphs.directiveIds[0], 'directive_bank');
assert.equal(graphs.registerIds[0], 'register_a');
assert.equal(graphs.flagIds[0], 'flag_zero');
assert.equal(graphs.basicBlockIds[0], 'basic_block_loop');
assert.equal(graphs.instructionIds[0], 'instruction_lda');
assert.equal(graphs.operandIds[0], 'operand_lda_value');
assert.equal(graphs.memoryEffectIds[0], 'memory_effect_counter_load');
assert.equal(graphs.controlEdgeIds[0], 'control_edge_loop_back');
assert.equal(graphs.branchIds[0], 'branch_loop_back');
assert.equal(graphs.callIds[0], 'call_draw');
assert.equal(graphs.returnIds[0], 'return_rtl');
assert.equal(graphs.interruptIds[0], 'interrupt_nmi');
assert.equal(graphs.trapIds[0], 'machine_trap_bounds');
assert.equal(graphs.undefinedBehaviorIds[0], 'machine_ub_overflow');
assert.equal(graphs.proofObligationIds[0], 'proof_obligation_branch_target');
assert.equal(graphs.proofGapCodes[0], 'assembly-cycle-timing-boundary');
assert.equal(graphs.evidenceIds.includes('evidence_counter_trace'), true);
assert.equal(graphs.sourceMapIds.includes('machine_source_map'), true);
assert.equal(graphs.sourceMapIds.includes('machine_mapping_branch'), true);
assert.equal(graphs.sourceMapIds.includes('machine_source_map_mapping_jump'), true);
assert.equal(graphs.missingEvidenceIds.includes('machine_missing_timing'), true);
assert.equal(graphs.missingEvidence.includes('cycle-timing-proof'), true);

const graph = graphs.graphs[0];
assert.equal(graph.kind, 'frontier.lang.machineGraph');
assert.equal(graph.status, 'blocked');
assert.equal(graph.architecture, 'asm-65816');
assert.equal(graph.dialect, 'snes-asm');
assert.equal(graph.claims.semanticEquivalenceClaim, false);
assert.equal(graph.claims.binaryEquivalenceClaim, false);
assert.equal(graph.labels[0].address, '$808000');
assert.equal(graph.registers[0].widthBits, 16);
assert.deepEqual(graph.registers[0].aliases, ['acc', 'A']);
assert.equal(graph.flags[0].registerId, 'register_p');
assert.equal(graph.basicBlocks[0].entryInstructionId, 'instruction_lda');
assert.equal(graph.instructions[0].mnemonic, 'LDA');
assert.equal(graph.instructions[0].timingEquivalenceClaim, false);
assert.equal(graph.operands[0].value, '#$0001');
assert.equal(graph.memoryEffects[0].proofStatus, 'missing');
assert.equal(graph.controlEdges[0].edgeKind, 'conditional');
assert.equal(graph.branches[0].targetId, 'label_loop');
assert.deepEqual(graph.branches[0].flagIds, ['flag_zero']);
assert.equal(graph.calls[0].proofStatus, 'passed');
assert.equal(graph.interrupts[0].reasonCode, 'machine-interrupt-proof-missing');
assert.equal(graph.sourceMaps[0].id, 'machine_source_map');
assert.equal(graph.sourceMaps[0].generatedPath, 'dist/counter.asm');
assert.equal(graph.sourceMaps[0].mappingHash, 'sha256:machine-map');
assert.equal(graph.sourceMaps[0].sourceSpan.blockKind, 'machineGraph');
assert.equal(graph.sourceMaps[1].id, 'machine_mapping_branch');
assert.equal(graph.sourceMaps[2].id, 'machine_source_map_mapping_jump');
assert.equal(graph.missingEvidence[0].reasonCode, 'cycle-timing-proof');
assert.equal(graph.missingEvidence[0].failClosed, true);
assert.equal(graph.traps[0].trapKind, 'bounds-check');
assert.equal(graph.traps[0].trapCode, 'machine-bounds-trap');
assert.equal(graph.traps[0].failClosed, true);
assert.equal(graph.traps[0].binaryEquivalenceClaim, false);
assert.equal(graph.undefinedBehaviors[0].undefinedBehaviorKind, 'signed-overflow');
assert.equal(graph.undefinedBehaviors[0].reasonCode, 'machine-ub-proof-missing');
assert.equal(graph.undefinedBehaviors[0].timingEquivalenceClaim, false);
assert.equal(graph.proofObligations[0].missingEvidence[0], 'control-flow-trace');
assert.equal(graph.proofGaps[0].failClosed, true);
assert.equal(graph.query.controlFlowEdgeIds.includes('control_edge_loop_back'), true);
assert.equal(graph.query.controlFlowEdgeIds.includes('branch_loop_back'), true);
assert.equal(graph.query.controlFlowEdgeIds.includes('call_draw'), true);
assert.equal(graph.query.trapIds[0], 'machine_trap_bounds');
assert.equal(graph.query.undefinedBehaviorIds[0], 'machine_ub_overflow');
assert.equal(graph.query.failClosedTrapIds[0], 'machine_trap_bounds');
assert.equal(graph.query.sourceMapIds.includes('machine_mapping_branch'), true);
assert.equal(graph.query.missingEvidenceIds[0], 'machine_missing_timing');
assert.equal(graph.query.blockerReasonCodes.includes('machine-memory-effect-proof-missing'), true);
assert.equal(graph.query.blockerReasonCodes.includes('machine-control-edge-proof-missing'), true);
assert.equal(graph.query.blockerReasonCodes.includes('machine-branch-target-proof-missing'), true);
assert.equal(graph.query.blockerReasonCodes.includes('machine-interrupt-proof-missing'), true);
assert.equal(graph.query.blockerReasonCodes.includes('machine-trap-proof-missing'), true);
assert.equal(graph.query.blockerReasonCodes.includes('machine-ub-proof-missing'), true);
assert.equal(graph.query.blockerReasonCodes.includes('assembly-cycle-timing-boundary'), true);
