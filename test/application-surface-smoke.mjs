import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const source = `
module PluginSurfaceProbe @id("mod_plugin_surface_probe")

appHost WorkbenchHost @id("app_surface_workbench") {
  role host
  sourcePath app.frontier
  sourceHash sha256:host
  evidence previewProbe @id("evidence_preview_probe") kind browser-probe status passed path reports/preview.json
  mount dashboard @id("app_mount_dashboard") kind region path /dashboard view view_dashboard target react sourceSpan app.tsx:10:1-10:30 evidence evidence_preview_probe
  provides shell @id("app_provide_shell") surface view view view_dashboard mount app_mount_dashboard capability host.fetch|host.storage evidence evidence_preview_probe
  requires fetch @id("app_require_fetch") capability host.fetch category network permission network proofGap app-host-capability-adapter-boundary evidence evidence_preview_probe
  route dashboard @id("app_route_dashboard") path /dashboard view view_dashboard action action_refresh mount app_mount_dashboard evidence evidence_preview_probe
  event refresh @id("app_event_refresh") kind ui event refresh action action_refresh source app_mount_dashboard target action_refresh evidence evidence_preview_probe
  asset logo @id("app_asset_logo") kind image path public/logo.svg hash sha256:logo proofGap app-asset-runtime-boundary evidence evidence_preview_probe
  gate preview @id("app_gate_preview") kind browser-probe command "npm run preview:probe" required subject view_dashboard evidence evidence_preview_probe
  gap pluginAbi @id("app_gap_plugin_abi") code plugin-abi-compatibility-boundary summary "Plugin ABI requires host/runtime compatibility proof."
}

plugin WeatherWidget @id("plugin_weather_widget") {
  role plugin
  host app_surface_workbench
  sourcePath plugins/weather.frontier
  sourceHash sha256:plugin
  evidence sandboxProbe @id("evidence_sandbox_probe") kind sandbox-probe status passed path reports/sandbox.json
  provides weatherPanel @id("plugin_provide_weather") surface view view view_weather_panel mount app_mount_dashboard capability host.fetch proofGap plugin-projection-runtime-boundary evidence evidence_sandbox_probe
  requires fetch @id("plugin_require_fetch") capability host.fetch category network permission network adapter host_fetch_adapter proofGap plugin-capability-grant-boundary evidence evidence_sandbox_probe
  gate sandbox @id("plugin_gate_sandbox") kind sandbox command "npm run sandbox:probe" required subject view_weather_panel evidence evidence_sandbox_probe
  gap sandbox @id("plugin_gap_sandbox") code plugin-sandbox-safety-boundary summary "Sandbox safety requires runtime proof."
}
`;

const doc = parseFrontierSource(source, { sourcePath: 'application-surface-probe.frontier' });

assert.equal(doc.metadata.applicationSurfaces.summary.surfaceCount, 2);
assert.equal(doc.metadata.applicationSurfaces.summary.mountCount, 1);
assert.equal(doc.metadata.applicationSurfaces.summary.providedSurfaceCount, 2);
assert.equal(doc.metadata.applicationSurfaces.summary.requiredCapabilityCount, 2);
assert.equal(doc.metadata.applicationSurfaces.summary.routeCount, 1);
assert.equal(doc.metadata.applicationSurfaces.summary.eventCount, 1);
assert.equal(doc.metadata.applicationSurfaces.summary.assetCount, 1);
assert.equal(doc.metadata.applicationSurfaces.summary.gateCount, 2);
assert.equal(doc.metadata.applicationSurfaces.claims.autoMergeClaim, false);
assert.equal(doc.metadata.applicationSurfaces.claims.semanticEquivalenceClaim, false);
assert.equal(doc.metadata.applicationSurfaces.claims.runtimeEquivalenceClaim, false);
assert.equal(doc.metadata.applicationSurfaces.claims.abiCompatibilityClaim, false);
assert.equal(doc.metadata.applicationSurfaces.claims.projectionEquivalenceClaim, false);
assert.equal(doc.metadata.applicationSurfaces.claims.pluginCompatibilityClaim, false);
assert.equal(doc.metadata.applicationSurfaces.claims.sandboxSafetyClaim, false);
assert.equal(doc.metadata.applicationSurfaces.evidenceIds.includes('evidence_preview_probe'), true);
assert.equal(doc.metadata.applicationSurfaces.evidenceIds.includes('evidence_sandbox_probe'), true);
assert.equal(doc.metadata.applicationSurfaces.proofGapCodes.includes('plugin-sandbox-safety-boundary'), true);

const host = doc.metadata.applicationSurfaces.surfaces.find((surface) => surface.id === 'app_surface_workbench');
assert.equal(host.kind, 'frontier.lang.applicationSurface');
assert.equal(host.surfaceKind, 'host');
assert.equal(host.role, 'host');
assert.equal(host.claims.autoMergeClaim, false);
assert.equal(host.claims.semanticEquivalenceClaim, false);
assert.equal(host.claims.runtimeEquivalenceClaim, false);
assert.equal(host.claims.abiCompatibilityClaim, false);
assert.equal(host.records.find((record) => record.id === 'app_mount_dashboard').path, '/dashboard');
assert.equal(host.records.find((record) => record.id === 'app_mount_dashboard').sourcePath, 'app.frontier');
assert.equal(host.records.find((record) => record.id === 'app_route_dashboard').sourcePath, 'app.frontier');
assert.equal(host.records.find((record) => record.id === 'app_asset_logo').sourcePath, 'app.frontier');
assert.deepEqual(host.records.find((record) => record.id === 'app_provide_shell').capabilityIds, ['host.fetch', 'host.storage']);
assert.equal(host.records.find((record) => record.id === 'app_gate_preview').command, 'npm run preview:probe');
const hostEvidence = host.evidence.find((record) => record.id === 'evidence_preview_probe');
const mountRecord = host.records.find((record) => record.id === 'app_mount_dashboard');
const hostGap = host.proofGaps.find((record) => record.id === 'app_gap_plugin_abi');
assert.equal(hostEvidence.authoredSourceSpan.path, 'application-surface-probe.frontier');
assert.equal(mountRecord.sourceSpan.path, 'app.tsx');
assert.equal(mountRecord.authoredSourceSpan.path, 'application-surface-probe.frontier');
assert.equal(source.slice(mountRecord.authoredSourceSpan.startOffset, mountRecord.authoredSourceSpan.endOffset).startsWith('mount dashboard'), true);
assert.equal(hostGap.authoredSourceSpan.path, 'application-surface-probe.frontier');

const plugin = doc.metadata.applicationSurfaces.surfaces.find((surface) => surface.id === 'plugin_weather_widget');
assert.equal(plugin.surfaceKind, 'plugin');
assert.equal(plugin.hostId, 'app_surface_workbench');
assert.equal(plugin.claims.runtimeEquivalenceClaim, false);
assert.equal(plugin.claims.projectionEquivalenceClaim, false);
assert.equal(plugin.claims.pluginCompatibilityClaim, false);
assert.equal(plugin.claims.sandboxSafetyClaim, false);
assert.equal(plugin.records.find((record) => record.id === 'plugin_require_fetch').adapterId, 'host_fetch_adapter');
assert.equal(plugin.records.find((record) => record.id === 'plugin_provide_weather').proofGaps[0].projectionEquivalenceClaim, false);
assert.equal(plugin.records.find((record) => record.id === 'plugin_provide_weather').authoredSourceSpan.path, 'application-surface-probe.frontier');
assert.equal(plugin.records.find((record) => record.id === 'plugin_provide_weather').proofGaps[0].authoredSourceSpan.path, 'application-surface-probe.frontier');

assert.deepEqual(doc.metadata.universalAst.applicationSurfaceIds, ['app_surface_workbench', 'plugin_weather_widget']);
assert.equal(doc.metadata.universalAst.applicationSurfaces[1].records.find((record) => record.id === 'plugin_gap_sandbox'), undefined);
assert.equal(doc.metadata.universalAst.metadata.authoredApplicationSurfaceIds[0], 'app_surface_workbench');
