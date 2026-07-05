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

const applicationSurfaceReport = inspectFrontierSourceSyntax(`module AppSurfaceRows @id("mod_app_surface_rows") {
appHost WorkbenchHost @id("app_surface_workbench") {
  role host
  sourcePath app.frontier
  sourceHash sha256:host
  evidence previewProbe @id("evidence_preview_probe") kind browser-probe status passed path reports/preview.json
  mount dashboard @id("app_mount_dashboard") kind region path /dashboard view view_dashboard target react evidence evidence_preview_probe
  provides shell @id("app_provide_shell") surface view view view_dashboard mount app_mount_dashboard capability host.fetch|host.storage evidence evidence_preview_probe
  requires fetch @id("app_require_fetch") capability host.fetch category network permission network proofGap app-host-capability-adapter-boundary evidence evidence_preview_probe
  gate preview @id("app_gate_preview") kind browser-probe command "npm run preview:probe" required subject view_dashboard evidence evidence_preview_probe
  gap pluginAbi @id("app_gap_plugin_abi") code plugin-abi-compatibility-boundary summary "Plugin ABI requires host/runtime compatibility proof."
}
plugin WeatherWidget @id("plugin_weather_widget") {
  role plugin
  host app_surface_workbench
  path plugins/weather.frontier
  sourceHash sha256:plugin
  provides weatherPanel @id("plugin_provide_weather") surface view view view_weather_panel mount app_mount_dashboard capability host.fetch proofGap plugin-projection-runtime-boundary evidence evidence_preview_probe
  require fetch @id("plugin_require_fetch") capability host.fetch category network permission network adapter host_fetch_adapter proofGap plugin-capability-grant-boundary evidence evidence_preview_probe
}
}`, { sourcePath: 'app-surfaces.frontier' });

assert.equal(applicationSurfaceReport.summary.failClosed, false);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.appHost.role, 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.appHost.sourcePath, 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.appHost.sourceHash, 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.appHost.evidence, 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.appHost['provided-surface'], 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.appHost['required-capability'], 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.plugin.role, 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.plugin.host, 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.plugin.sourcePath, 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.plugin['provided-surface'], 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.plugin['required-capability'], 1);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamilyCounts.sourcePath, 2);
assert.equal(applicationSurfaceReport.summary.sourceSyntaxRowFamiliesByBlockFamily.plugin.includes('host'), true);

const appHostBlock = applicationSurfaceReport.recognizedBlocks.find((block) => block.id === 'app_surface_workbench');
const roleRow = appHostBlock.children.find((child) => child.normalizedRowKind === 'role');
assert.equal(roleRow.name, 'host');
assert.equal(roleRow.sourceSpan.path, 'app-surfaces.frontier');
assert.equal(roleRow.sourceSpan.blockKind, 'appHost');

const pluginBlock = applicationSurfaceReport.recognizedBlocks.find((block) => block.id === 'plugin_weather_widget');
const pathRow = pluginBlock.children.find((child) => child.rowKind === 'path');
assert.equal(pathRow.normalizedRowKind, 'sourcePath');
assert.equal(pathRow.name, 'plugins/weather.frontier');

const unknownApplicationSurfaceReport = inspectFrontierSourceSyntax(`module UnknownSurface @id("mod_unknown_surface") {
plugin BrokenWidget @id("plugin_broken") {
  role plugin
  secretCapability root
}
}`);

assert.equal(unknownApplicationSurfaceReport.summary.failClosed, true);
assert.equal(unknownApplicationSurfaceReport.summary.unknownChildKinds[0], 'secretCapability');
assert.equal(unknownApplicationSurfaceReport.summary.sourceSyntaxRowFamilyCounts.secretCapability, 1);
assert.equal(unknownApplicationSurfaceReport.unknownChildren[0].reason, 'unsupported-application-surface-row');

const coreBlocksReport = inspectFrontierSourceSyntax(`module CoreBlocks @id("mod_core_blocks") {
migration TodoV1ToV2 @id("migration_todo_v1_v2") {
  fromVersion 1
  toVersion 2
  change addField Todo.title
  invariants title_present
}
extern persistTodo @id("extern_persist") {
  language typescript
  symbol persistTodo
  input TodoInput
  returns Patch
  effects storage
}
capability HttpRequest @id("cap_http_request") {
  capability http.request
  category network
  input Json
  returns Json
  resources HttpClient
  adapter typescript symbol fetch platform node package undici kind library
  unsupported c platform embedded reason "host socket adapter needed"
}
effect PersistTodo @id("effect_persist_todo") {
  capability storage.write
  input TodoInput
  returns Json
  resources TodoDb.todos
}
lattice TagSet @id("lat_tag_set") {
  carrier Set<Text>
  laws semilattice, commutative
  frontierCrdt createCrdtOrSetLattice
  lawChecker checkCrdtJoinLaws
}
}`, { sourcePath: 'core-blocks.frontier' });

assert.equal(coreBlocksReport.summary.failClosed, false);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.migration.fromVersion, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.migration.toVersion, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.migration.change, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.extern.language, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.extern.effects, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.capability.adapter, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.capability.unsupportedTarget, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.effect.capability, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.lattice.carrier, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.lattice.frontierCrdt, 1);
assert.equal(coreBlocksReport.summary.sourceSyntaxRowFamiliesByBlockFamily.lattice.includes('laws'), true);

const capabilityBlock = coreBlocksReport.recognizedBlocks.find((block) => block.id === 'cap_http_request');
const adapterRow = capabilityBlock.children.find((child) => child.normalizedRowKind === 'adapter');
assert.equal(adapterRow.sourceSpan.path, 'core-blocks.frontier');
assert.equal(adapterRow.sourceSpan.blockKind, 'capability');

const unknownCoreReport = inspectFrontierSourceSyntax(`module UnknownCore @id("mod_unknown_core") {
effect Broken @id("effect_broken") {
  sideEffect mutation
}
}`);

assert.equal(unknownCoreReport.summary.failClosed, true);
assert.equal(unknownCoreReport.summary.unknownChildKinds[0], 'sideEffect');
assert.equal(unknownCoreReport.summary.sourceSyntaxRowFamilyCounts.sideEffect, 1);
assert.equal(unknownCoreReport.unknownChildren[0].reason, 'unsupported-effect-row');
