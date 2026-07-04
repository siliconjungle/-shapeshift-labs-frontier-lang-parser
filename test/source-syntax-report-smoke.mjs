import assert from 'node:assert/strict';
import { FrontierSourceBlockKinds, inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const syntaxReport = inspectFrontierSourceSyntax(`module SyntaxProbe @id("mod_syntax_probe") {
entity Todo @id("ent_todo") {
  title @id("field_title"): Text
}
view TodoView @id("view_todo") {
  render Button @id("render_todo_button") {
    text "{"
  }
}
futureSurface Experimental @id("future_surface") {
  value test
}
}
possibilitySpace ProjectionSpace @id("space_projection") {
  subject ent_todo
  target rust
}`);

assert.equal(syntaxReport.kind, 'frontier.lang.sourceSyntaxReport');
assert.equal(syntaxReport.documentId, 'mod_syntax_probe');
assert.equal(syntaxReport.summary.blockCount, 4);
assert.equal(syntaxReport.summary.recognizedBlockCount, 3);
assert.equal(syntaxReport.summary.unknownBlockCount, 1);
assert.equal(syntaxReport.summary.malformedBlockCount, 0);
assert.equal(syntaxReport.summary.diagnosticCount, 0);
assert.equal(syntaxReport.summary.failClosed, true);
assert.equal(syntaxReport.summary.unsupportedSyntax, true);
assert.deepEqual(syntaxReport.summary.unknownKinds, ['futureSurface']);
assert.equal(syntaxReport.unknownBlocks[0].id, 'future_surface');
assert.equal(syntaxReport.unknownBlocks[0].moduleId, 'mod_syntax_probe');
assert.equal(syntaxReport.unknownBlocks[0].reason, 'unsupported-top-level-block');
assert.equal(syntaxReport.blocks.some((block) => block.kind === 'render'), false);
assert.equal(syntaxReport.recognizedBlocks.some((block) => block.kind === 'possibilitySpace'), true);
assert.equal(syntaxReport.metadata.autoMergeClaim, false);
assert.equal(syntaxReport.metadata.semanticEquivalenceClaim, false);
assert.equal(FrontierSourceBlockKinds.includes('semanticResourceGraph'), true);
assert.equal(FrontierSourceBlockKinds.includes('machineGraph'), true);

const malformedReport = inspectFrontierSourceSyntax(`module Broken @id("mod_broken") {
entity Todo @id("ent_todo") {
  title: Text
`);

assert.equal(malformedReport.summary.failClosed, true);
assert.equal(malformedReport.summary.malformedBlockCount, 1);
assert.equal(malformedReport.summary.diagnosticCount, 2);
assert.equal(malformedReport.blocks[0].malformed, true);
assert.equal(malformedReport.blocks[0].diagnostics[0].reason, 'unterminated-block');
assert.deepEqual(malformedReport.diagnostics.map((diagnostic) => diagnostic.reason), [
  'unterminated-block',
  'unterminated-block'
]);

const unicodeSource = `module Cafe @id("mod_cafe") {
entity Café @id("ent_cafe") {
}
}`;
const unicodeReport = inspectFrontierSourceSyntax(unicodeSource);
assert.equal(unicodeReport.metadata.sourceBytes, new TextEncoder().encode(unicodeSource).length);

const robustParseDoc = parseFrontierSource(`module RobustParse @id("mod_robust_parse") {
view Detail @id("view_detail") {
  render Label @id("render_detail_label") {
    text "}"
    prop marker "{literal}"
    # { ignored by the nested block scanner
  }
}
action Save @id("action_save") {
  input TodoInput
}
}`);

assert.equal(robustParseDoc.nodes.view_detail.renders[0].text, '}');
assert.equal(robustParseDoc.nodes.view_detail.renders[0].props[0].value, '{literal}');
assert.equal(robustParseDoc.nodes.action_save.name, 'Save');

const conversionSyntaxSource = `module ConversionSyntaxProbe @id("mod_conversion_syntax_probe") {
conversion JsToRust @id("conversion_js_rust") {
  sourceLanguage javascript
  target rust
  constraint type publicApi @id("type_constraint_public_api") role source kind public-function symbol symbol:addTodo evidence evidence_type
  constraint resourceTransfer todoStore @id("resource_transfer_todo_store") role source kind owner resource TodoStore evidence evidence_resource
}
}`;
const conversionSyntaxReport = inspectFrontierSourceSyntax(conversionSyntaxSource, { sourcePath: 'conversion-syntax.frontier' });
const conversionBlock = conversionSyntaxReport.recognizedBlocks.find((block) => block.id === 'conversion_js_rust');
assert.equal(conversionSyntaxReport.summary.childCount, 2);
assert.equal(conversionSyntaxReport.summary.recognizedChildCount, 2);
assert.deepEqual(conversionSyntaxReport.summary.recognizedChildKinds, ['conversionConstraint']);
assert.equal(conversionBlock.children[0].kind, 'conversionConstraint');
assert.equal(conversionBlock.children[0].family, 'type');
assert.equal(conversionBlock.children[0].id, 'type_constraint_public_api');
assert.equal(conversionBlock.children[0].sourceSpan.path, 'conversion-syntax.frontier');
assert.equal(conversionBlock.children[0].sourceSpan.sourceId, 'mod_conversion_syntax_probe');
assert.equal(conversionBlock.children[0].sourceSpan.blockId, 'conversion_js_rust');
assert.equal(conversionSyntaxSource.slice(conversionBlock.children[0].startOffset, conversionBlock.children[0].endOffset).startsWith('constraint type publicApi'), true);

const rowSyntaxSource = `module RowSyntaxProbe @id("mod_row_syntax_probe") {
interlingua JsToRust @id("interlingua_js_rust") {
  layer symbols @id("interlingua_layer_symbols") kind binding
  lowering rustAdapter @id("interlingua_lowering_rust") target rust
  sourceLift tsAst @id("interlingua_source_lift_ts") source typescript
}
dialectRegistry RuntimeDialects @id("dialects_runtime") {
  dialect nodeProcess @id("dialect_node_process") language javascript
  extern viteRoutes @id("dialect_vite_routes") source vite
}
runtimeCapabilities WebRuntime @id("runtime_web") {
  host browser @id("runtime_host_browser") kind browser
  capability fetch @id("runtime_capability_fetch") host browser
  proofGap layout @id("runtime_gap_layout") reason runtime-layout
}
resourceGraph BorrowGraph @id("resource_borrow_graph") {
  resource todoStore @id("resource_todo_store") owner app
  borrow todoBorrow @id("resource_borrow_todo") from todoStore
  memory heap @id("resource_memory_heap") kind heap pointerWidth 64
  sync release @id("resource_sync_release") kind happens-before from resource_memory_heap to resource_trap_bounds
  barrier acquire @id("resource_sync_barrier") kind fence
  trap bounds @id("resource_trap_bounds") kind out-of-bounds operation load
  undefined overflow @id("resource_ub_overflow") kind signed-overflow language c
  proof borrowProof @id("resource_proof_borrow") gate ownership
}
applicationSurface PluginHost @id("app_plugin_host") {
  mount dashboard @id("app_mount_dashboard") path /dashboard
  provide WeatherPanel @id("app_provide_weather") capability view
  require fetch @id("app_require_fetch") capability network
}
target rust @id("target_rust") {
  projection api @id("target_projection_api") kind module
  layer ownership @id("target_layer_ownership") source resourceGraph
}
packageManifest Package @id("package_manifest") {
  dependency react @id("package_dependency_react") range ^19
  script build @id("package_script_build") command vite
}
canvasSurface Canvas @id("canvas_surface") {
  element chart @id("canvas_element_chart") kind path
  trace drawTrace @id("canvas_trace_draw") command draw
}
proof Safety @id("proof_safety") {
  contract auth @id("proof_contract_auth") requires policy
  obligation authProof @id("proof_obligation_auth") gate auth
}
paradigm RustLike @id("paradigm_rust_like") {
  bindingScope root @id("paradigm_binding_root") kind lexical
  ownership borrow @id("paradigm_ownership_borrow") model affine
}
operations EditOps @id("operations_edit") {
  operation rename @id("operation_rename") kind symbol
  op extract @id("operation_extract") kind function
}
nativeSource TsSource @id("native_source_ts") {
  sourceMap apiMap @id("native_source_map_api") generated api.ts
  candidate displayName @id("native_candidate_display") kind merge
}
possibilitySpace ProjectionSpace @id("possibility_projection") {
  variable surface @id("possibility_variable_surface") domain ui
  hard identity @id("possibility_hard_identity") kind stable
}
decisionGraph Admission @id("decision_admission") {
  node patch @id("decision_node_patch") kind patch
  admission accept @id("decision_admission_accept") result accepted
}
}`;

const rowSyntaxReport = inspectFrontierSourceSyntax(rowSyntaxSource, { sourcePath: 'row-syntax.frontier' });
assert.equal(rowSyntaxReport.summary.unknownBlockCount, 0);
assert.equal(rowSyntaxReport.summary.failClosed, false);
assert.equal(rowSyntaxReport.summary.childCount, 37);
assert.equal(rowSyntaxReport.summary.recognizedChildCount, 37);
for (const childKind of [
  'interlinguaRow',
  'dialectRegistryRow',
  'runtimeCapabilityRow',
  'resourceGraphRow',
  'applicationSurfaceRow',
  'targetProjectionRow',
  'packageManifestRow',
  'canvasSurfaceRow',
  'proofRow',
  'paradigmRow',
  'semanticOperationRow',
  'nativeSourceRow',
  'constraintSpaceRow',
  'decisionGraphRow'
]) {
  assert.equal(rowSyntaxReport.summary.recognizedChildKinds.includes(childKind), true, childKind);
}

function rowChild(blockId, id) {
  const block = rowSyntaxReport.recognizedBlocks.find((candidate) => candidate.id === blockId);
  assert.ok(block, blockId);
  const child = block.children.find((candidate) => candidate.id === id);
  assert.ok(child, id);
  assert.equal(child.sourceSpan.path, 'row-syntax.frontier');
  assert.equal(child.sourceSpan.sourceId, 'mod_row_syntax_probe');
  assert.equal(child.sourceSpan.blockId, blockId);
  return child;
}

assert.equal(rowSyntaxSource.slice(
  rowChild('interlingua_js_rust', 'interlingua_layer_symbols').startOffset,
  rowChild('interlingua_js_rust', 'interlingua_layer_symbols').endOffset
).startsWith('layer symbols'), true);
assert.equal(rowChild('interlingua_js_rust', 'interlingua_lowering_rust').normalizedRowKind, 'lowering');
assert.equal(rowChild('interlingua_js_rust', 'interlingua_source_lift_ts').normalizedRowKind, 'lift');
assert.equal(rowChild('app_plugin_host', 'app_provide_weather').normalizedRowKind, 'provided-surface');
assert.equal(rowChild('app_plugin_host', 'app_require_fetch').normalizedRowKind, 'required-capability');
assert.equal(rowChild('possibility_projection', 'possibility_hard_identity').normalizedRowKind, 'constraint');
assert.equal(rowChild('native_source_ts', 'native_source_map_api').normalizedRowKind, 'sourceMap');
assert.equal(rowChild('native_source_ts', 'native_candidate_display').normalizedRowKind, 'mergeCandidate');
assert.equal(rowChild('operations_edit', 'operation_extract').normalizedRowKind, 'operation');
assert.equal(rowChild('resource_borrow_graph', 'resource_memory_heap').normalizedRowKind, 'memoryRegion');
assert.equal(rowChild('resource_borrow_graph', 'resource_sync_release').normalizedRowKind, 'synchronizationEdge');
assert.equal(rowChild('resource_borrow_graph', 'resource_sync_barrier').normalizedRowKind, 'synchronizationEdge');
assert.equal(rowChild('resource_borrow_graph', 'resource_trap_bounds').normalizedRowKind, 'trap');
assert.equal(rowChild('resource_borrow_graph', 'resource_ub_overflow').normalizedRowKind, 'undefinedBehavior');

const machineGraphSyntaxSource = `module MachineSyntaxProbe @id("mod_machine_syntax_probe") {
machineGraph Counter @id("machine_graph_counter") {
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
  proof branchTarget @id("proof_obligation_branch_target") subject control_edge_loop status missing
  gap timing @id("machine_gap_timing") code assembly-cycle-timing-boundary
  proofEvidence trace @id("evidence_trace") kind emulator-trace status passed
}
}`;

const machineGraphSyntaxReport = inspectFrontierSourceSyntax(machineGraphSyntaxSource, { sourcePath: 'machine-syntax.frontier' });
assert.equal(machineGraphSyntaxReport.summary.unknownBlockCount, 0);
assert.equal(machineGraphSyntaxReport.summary.failClosed, false);
assert.equal(machineGraphSyntaxReport.summary.childCount, 16);
assert.equal(machineGraphSyntaxReport.summary.recognizedChildCount, 16);
assert.equal(machineGraphSyntaxReport.summary.recognizedChildKinds.includes('machineGraphRow'), true);
function machineChild(id) {
  const block = machineGraphSyntaxReport.recognizedBlocks.find((candidate) => candidate.id === 'machine_graph_counter');
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
assert.equal(machineChild('proof_obligation_branch_target').normalizedRowKind, 'proofObligation');
assert.equal(machineChild('machine_gap_timing').normalizedRowKind, 'proofGap');
assert.equal(machineChild('evidence_trace').normalizedRowKind, 'evidence');

const unknownMachineGraphSyntaxReport = inspectFrontierSourceSyntax(`module UnknownMachineSyntax @id("mod_unknown_machine_syntax") {
machineGraph Unknown @id("machine_graph_unknown") {
  mysteryFact lowLevel @id("machine_unknown_low_level")
}
}`);
assert.equal(unknownMachineGraphSyntaxReport.summary.failClosed, true);
assert.equal(unknownMachineGraphSyntaxReport.summary.unknownChildCount, 1);
assert.equal(unknownMachineGraphSyntaxReport.unknownChildren[0].reason, 'unsupported-machine-graph-row');

const duplicateGenericRowSource = `module DuplicateGenericRowProbe @id("mod_duplicate_generic_row_probe") {
packageManifest Package @id("package_manifest_duplicate_rows") {
  dependency react @id("package_dependency_react") range ^19
  dependency react @id("package_dependency_react_duplicate_name") range ^20
  script build @id("package_dependency_react") command vite
}
canvasSurface Canvas @id("canvas_surface_duplicate_rows") {
  command fill @id("canvas_command_fill") category draw
  state fill @id("canvas_state_fill") category state
  command stroke @id("canvas_command_fill") category draw
}
runtimeCapabilities Runtime @id("runtime_duplicate_rows") {
  host browser @id("runtime_host_browser") kind browser
  host browser @id("runtime_host_browser_duplicate_name") kind browser
}
}`;

const duplicateGenericRowReport = inspectFrontierSourceSyntax(duplicateGenericRowSource);
assert.equal(duplicateGenericRowReport.summary.failClosed, true);
assert.equal(duplicateGenericRowReport.summary.unknownChildCount, 2);
assert.deepEqual(
  duplicateGenericRowReport.unknownChildren.map((child) => child.reason),
  ['duplicate-generic-row-id', 'duplicate-generic-row-id']
);
assert.equal(
  duplicateGenericRowReport
    .recognizedBlocks
    .find((block) => block.id === 'package_manifest_duplicate_rows')
    .children
    .some((child) => child.id === 'package_dependency_react_duplicate_name' && child.recognized),
  true
);
assert.equal(
  duplicateGenericRowReport
    .recognizedBlocks
    .find((block) => block.id === 'runtime_duplicate_rows')
    .children
    .some((child) => child.id === 'runtime_host_browser_duplicate_name' && child.recognized),
  true
);
