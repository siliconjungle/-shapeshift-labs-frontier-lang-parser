import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const doc = parseFrontierSource(`
module GenericRowIdentityProbe @id("mod_generic_row_identity_probe")

packageManifest PackageIds @id("pkg_manifest_ids") {
  sourcePath package.json
  dependency react @id("package_dependency_react") section dependencies range ^19.0.0
  dependency react @id("package_dependency_react_distinct") section devDependencies range ^19.0.0
  script build @id("package_dependency_react") command "vite build"
}

canvasSurface CanvasIds @id("canvas_surface_ids") {
  command fill @id("canvas_command_fill") name fillRect category draw order 1
  trace draw @id("canvas_trace_draw") commands fillRect|fillRect
  state fillStyle @id("canvas_command_fill") name fillStyle category state order 2
  trace drawAgain @id("canvas_trace_draw") commands fillRect
}

applicationSurface AppIds @id("app_surface_ids") {
  role application
  provide dashboard @id("app_provided_dashboard") surface view component Dashboard
  provides dashboardAgain @id("app_provided_dashboard") surface view component DashboardAlt
  route main @id("app_route_main") path "/"
}

resourceGraph ResourceIds @id("resource_graph_ids") {
  sourceLanguage rust
  resource store @id("resource_store") kind collection owner owner_store
  owner storeOwner @id("resource_store") kind store
  loan storeLoan @id("loan_store") resource resource_store owner owner_store mode shared
}

runtimeCapabilities RuntimeIds @id("runtime_ids") {
  sourceHost web @id("runtime_host_web") language javascript runtime browser host browser target javascript
  targetHost webTarget @id("runtime_host_web") language javascript runtime browser host browser target javascript
  hostBinding fetchBinding @id("runtime_binding_fetch") host runtime_host_web capability fetch kind native-api apiName fetch
  hostCapability fetch @id("runtime_cap_fetch") host runtime_host_web capability fetch support native binding runtime_binding_fetch
  hostCapability fetchAgain @id("runtime_cap_fetch") host runtime_host_web capability fetch support adapter binding runtime_binding_fetch_again
  requirement fetchReq @id("runtime_requirement_fetch") sourceHost runtime_host_web targetHost runtime_host_web capability fetch
  requirement fetchReqAgain @id("runtime_requirement_fetch") sourceHost runtime_host_web targetHost runtime_host_web capability fetch readiness stale
}
`);

const packageManifest = doc.metadata.universalAst.packageManifests[0];
assert.deepEqual(packageManifest.records.map((record) => record.id), [
  'package_dependency_react',
  'package_dependency_react_distinct'
]);
assert.equal(packageManifest.summary.parseErrors, 1);
assert.equal(packageManifest.parser.errors[0].code, 'duplicate-generic-row-id');
assert.equal(packageManifest.parser.errors[0].rowKind, 'script');
assert.equal(packageManifest.parser.errors[0].suppressed, true);

const canvasSurface = doc.metadata.universalAst.canvasSurfaces[0];
assert.deepEqual(canvasSurface.records.map((record) => record.id), ['canvas_command_fill']);
assert.deepEqual(canvasSurface.commandTraces.map((trace) => trace.id), ['canvas_trace_draw']);
assert.equal(canvasSurface.commandTraces[0].records.length, 2);
assert.equal(canvasSurface.summary.parseErrors, 2);
assert.equal(canvasSurface.parser.errors[0].rowKind, 'state');
assert.equal(canvasSurface.parser.errors[1].rowKind, 'trace');

const appSurface = doc.metadata.universalAst.applicationSurfaces[0];
assert.deepEqual(appSurface.records.map((record) => record.id), [
  'app_provided_dashboard',
  'app_route_main'
]);
assert.equal(appSurface.parser.errors[0].rowKind, 'provides');
assert.equal(appSurface.parser.errors[0].normalizedRowKind, 'provided-surface');
assert.equal(appSurface.summary.parseErrors, 1);

const resourceGraph = doc.metadata.semanticResourceGraphs.graphs[0];
assert.deepEqual(resourceGraph.resources.map((record) => record.id), ['resource_store']);
assert.deepEqual(resourceGraph.owners.map((record) => record.id), []);
assert.deepEqual(resourceGraph.loans.map((record) => record.id), ['loan_store']);
assert.equal(resourceGraph.parser.errors[0].rowKind, 'owner');
assert.equal(resourceGraph.summary.parseErrors, 1);

const runtime = doc.metadata.runtimeCapabilities;
assert.deepEqual(runtime.hostProfileIds, ['runtime_host_web']);
assert.deepEqual(runtime.sourceHostIds, ['runtime_host_web']);
assert.deepEqual(runtime.targetHostIds, ['runtime_host_web']);
assert.deepEqual(runtime.hostCapabilityIds, ['runtime_cap_fetch']);
assert.deepEqual(runtime.runtimeRequirementIds, ['runtime_requirement_fetch']);
assert.equal(runtime.hostProfiles[0].capabilities.fetch.binding, 'runtime_binding_fetch');
assert.equal(runtime.parser.errors.length, 3);
assert.equal(runtime.parser.errors[0].rowKind, 'targetHost');
assert.equal(runtime.parser.errors[0].suppressed, false);
assert.equal(runtime.parser.errors[0].disposition, 'preserved-runtime-host-profile-upsert');
assert.equal(runtime.parser.errors[1].rowKind, 'hostCapability');
assert.equal(runtime.parser.errors[1].suppressed, true);
assert.equal(runtime.parser.errors[2].rowKind, 'requirement');
assert.equal(runtime.summary.parseErrors, 3);
