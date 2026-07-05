import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax } from '../dist/index.js';

const mixedSource = `module FamilyProbe @id("mod_family_probe") {
entity Todo @id("ent_todo") {
  title: Text
}
view TodoView @id("view_todo") {
  prop disabled @id("view_prop_disabled"): Boolean
  render Button @id("render_button") {
    text "Save"
    prop disabled disabled
  }
}
conversion JsToRust @id("conversion_js_rust") {
  constraint type publicApi @id("constraint_type_public_api") role source
  constraint resourceTransfer todoStore @id("constraint_resource_todo_store") role target
}
runtimeCapabilities Runtime @id("runtime_caps") {
  host browser @id("runtime_host_browser") kind browser
  capability fetch @id("runtime_capability_fetch") host browser
  gap layout @id("runtime_gap_layout") reason runtime-layout
}
futureSurface Later @id("future_surface") {
  value unknown
}
}`;

const report = inspectFrontierSourceSyntax(mixedSource);
assert.equal(report.summary.failClosed, true);
assert.deepEqual(report.summary.sourceSyntaxBlockFamilies, ['entity', 'view', 'conversion', 'runtimeCapabilities', 'futureSurface']);
assert.equal(report.summary.sourceSyntaxBlockFamilyCounts.view, 1);
assert.equal(report.summary.sourceSyntaxBlockFamilyCounts.futureSurface, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.prop, 2);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.type, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.resourceTransfer, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.hostCapability, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.proofGap, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.view.prop, 2);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.conversion.type, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.conversion.resourceTransfer, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.runtimeCapabilities.hostCapability, 1);
assert.deepEqual(report.summary.sourceSyntaxRowFamiliesByBlockFamily.futureSurface, []);
assert.equal(report.summary.sourceSyntaxRowFamiliesByBlockFamily.view.includes('prop'), true);
assert.equal(report.summary.sourceSyntaxRowFamiliesByBlockFamily.runtimeCapabilities.includes('proofGap'), true);

const unknownMachineReport = inspectFrontierSourceSyntax(`module UnknownMachine @id("mod_unknown_machine") {
machineGraph Unknown @id("machine_graph_unknown") {
  mysteryFact lowLevel @id("machine_unknown_low_level")
}
}`);

assert.equal(unknownMachineReport.summary.failClosed, true);
assert.equal(unknownMachineReport.summary.unknownChildCount, 1);
assert.equal(unknownMachineReport.summary.sourceSyntaxRowFamilyCounts.mysteryFact, 1);
assert.equal(unknownMachineReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.machineGraph.mysteryFact, 1);

const genericRowsReport = inspectFrontierSourceSyntax(`module GenericRows @id("mod_generic_rows") {
interlingua JsToRust @id("interlingua_js_rust") {
  lowering rustAdapter @id("interlingua_lowering_rust") target rust
}
runtimeCapabilities Runtime @id("runtime_generic") {
  capability fetch @id("runtime_capability_generic") host browser
}
resourceGraph Resources @id("resource_generic") {
  sync release @id("resource_sync_release") kind happens-before
  happensBefore writerReader @id("resource_sync_writer_reader") kind happens-before
}
operations Edits @id("operations_generic") {
  operation rename @id("operation_rename") kind symbol
  op extract @id("operation_extract") kind function
}
nativeSource TsSource @id("native_source_ts") {
  sourceMap apiMap @id("native_source_map_api") generated api.ts
  candidate displayName @id("native_candidate_display") kind merge
}
}`);

assert.equal(genericRowsReport.summary.failClosed, false);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamilyCounts.lowering, 1);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamilyCounts.hostCapability, 1);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamilyCounts.synchronizationEdge, 2);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamilyCounts.operation, 2);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamilyCounts.sourceMap, 1);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamilyCounts.mergeCandidate, 1);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.resourceGraph.synchronizationEdge, 2);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.operations.operation, 2);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamiliesByBlockFamily.runtimeCapabilities.includes('hostCapability'), true);
assert.equal(genericRowsReport.summary.sourceSyntaxRowFamiliesByBlockFamily.nativeSource.includes('sourceMap'), true);
