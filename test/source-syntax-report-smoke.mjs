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
assert.equal(rowSyntaxReport.summary.childCount, 32);
assert.equal(rowSyntaxReport.summary.recognizedChildCount, 32);
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
