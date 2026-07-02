import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const doc = parseFrontierSource(`
module PackageCanvasProbe @id("mod_package_canvas_probe")

packageManifest AppPackage @id("pkg_manifest_app") {
  sourcePath package.json
  sourceHash sha256:package
  packageManager npm@11.0.0
  evidence packageProbe @id("evidence_package_probe") kind test status passed path reports/package.json
  metadata name @id("pkg_meta_name") value "@example/app" evidence evidence_package_probe
  dependency react @id("pkg_dep_react") section dependencies range ^19.0.0 evidence evidence_package_probe
  dependency typescript @id("pkg_dep_typescript") section peerDependencies range ^5.9.0 proofGap package-peer-compatibility-boundary evidence evidence_package_probe
  script test @id("pkg_script_test") command "vitest --run" proofGap package-script-runtime-boundary evidence evidence_package_probe
  export root @id("pkg_export_root") section exports name . target ./dist/index.js proofGap package-conditional-resolution-boundary evidence evidence_package_probe
  gap workspace @id("pkg_gap_workspace") code package-workspace-graph-boundary summary "Workspace expansion requires repository graph evidence."
}

canvasSurface PreviewCanvas @id("canvas_surface_preview") {
  sourcePath src/draw.js
  sourceHash sha256:draw
  evidence canvasProbe @id("evidence_canvas_probe") kind browser-probe status passed path reports/canvas.json
  element preview @id("canvas_element_preview") name canvas category html-canvas order 1 identity canvas:preview attributes data-frontier-key=preview|width=100 evidence evidence_canvas_probe
  command context @id("canvas_command_context") name getContext category context context 2d order 2 proofGap canvas-context-runtime-boundary evidence evidence_canvas_probe
  state fillStyle @id("canvas_state_fill_style") name fillStyle category state order 3 proofGap canvas-stateful-render-order-boundary evidence evidence_canvas_probe
  command fill @id("canvas_command_fill") name fillRect category draw context 2d order 4 proofGap canvas-stateful-render-order-boundary evidence evidence_canvas_probe
  command offscreen @id("canvas_command_offscreen") name transferControlToOffscreen category offscreen order 5 proofGap canvas-offscreen-worker-boundary evidence evidence_canvas_probe
  trace drawFrame @id("canvas_trace_draw_frame") commands getContext|fillStyle|fillRect|transferControlToOffscreen evidence evidence_canvas_probe
  gap image @id("canvas_gap_image") code canvas-image-resource-boundary summary "Image drawing needs bitmap/resource evidence."
}
`);

assert.equal(doc.metadata.packageManifests.summary.manifestCount, 1);
assert.equal(doc.metadata.packageManifests.summary.dependencyCount, 2);
assert.equal(doc.metadata.packageManifests.summary.scriptCount, 1);
assert.equal(doc.metadata.packageManifests.summary.exportCount, 1);
assert.equal(doc.metadata.packageManifests.claims.installEquivalenceClaim, false);
assert.equal(doc.metadata.packageManifests.claims.packageInstallEquivalenceClaim, false);
assert.equal(doc.metadata.packageManifests.proofGapCodes.includes('package-workspace-graph-boundary'), true);
const packageManifest = doc.metadata.packageManifests.manifests[0];
assert.equal(packageManifest.kind, 'frontier.lang.packageManifestSemanticTree');
assert.equal(packageManifest.packageManager, 'npm@11.0.0');
assert.equal(packageManifest.records.find((record) => record.id === 'pkg_dep_react').identityKey, 'dependency:dependencies:react');
assert.equal(packageManifest.records.find((record) => record.id === 'pkg_dep_typescript').proofGaps[0].installEquivalenceClaim, false);

assert.equal(doc.metadata.canvasSurfaces.summary.surfaceCount, 1);
assert.equal(doc.metadata.canvasSurfaces.summary.drawCommandCount, 1);
assert.equal(doc.metadata.canvasSurfaces.summary.offscreenCommandCount, 1);
assert.equal(doc.metadata.canvasSurfaces.summary.commandTraceCount, 1);
assert.equal(doc.metadata.canvasSurfaces.claims.browserRuntimeEquivalenceClaim, false);
assert.equal(doc.metadata.canvasSurfaces.claims.canvasRuntimeEquivalenceClaim, false);
assert.equal(doc.metadata.canvasSurfaces.proofGapCodes.includes('canvas-image-resource-boundary'), true);
const canvasSurface = doc.metadata.canvasSurfaces.surfaces[0];
assert.equal(canvasSurface.kind, 'frontier.lang.canvasSemanticTree');
assert.equal(canvasSurface.records.find((record) => record.id === 'canvas_element_preview').attributes.width, '100');
assert.equal(canvasSurface.records.find((record) => record.id === 'canvas_command_fill').proofGaps[0].canvasVisualEquivalenceClaim, false);
assert.equal(canvasSurface.commandTraces[0].records.length, 4);

assert.deepEqual(doc.metadata.universalAst.packageManifestIds, ['pkg_manifest_app']);
assert.deepEqual(doc.metadata.universalAst.canvasSurfaceIds, ['canvas_surface_preview']);
assert.equal(doc.metadata.universalAst.packageManifests[0].records.length, 5);
assert.equal(doc.metadata.universalAst.canvasSurfaces[0].commandTraces[0].runtimeEquivalenceClaim, false);
