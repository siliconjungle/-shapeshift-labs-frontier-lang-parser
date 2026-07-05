import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const doc = parseFrontierSource(`
module RuntimeCapabilityProbe @id("mod_runtime_capability_probe")

runtimeCapabilities WebToRust @id("runtime_caps_web_rust") {
  sourceHost web @id("runtime_host_js_web") language javascript runtime web host browser target javascript alias js|jsx evidence evidence_runtime_fetch
  targetHost rust @id("runtime_host_rust_cli") language rust runtime cli host native-cli target rust alias rs evidence evidence_runtime_fetch
  hostBinding webFetchBinding @id("runtime_binding_web_fetch") host runtime_host_js_web capability fetch kind native-api apiName fetch globalName window.fetch evidence evidence_runtime_fetch
  hostBinding rustFetchBinding @id("runtime_binding_rust_fetch") host runtime_host_rust_cli capability fetch kind package package reqwest symbol Client evidence evidence_runtime_fetch
  hostCapability webFetch @id("runtime_cap_web_fetch") host runtime_host_js_web capability fetch support native binding runtime_binding_web_fetch note browser-fetch evidence evidence_runtime_fetch
  hostCapability rustFetch @id("runtime_cap_rust_fetch") host runtime_host_rust_cli capability fetch support adapter binding runtime_binding_rust_fetch note reqwest evidence evidence_runtime_fetch
  requirement fetchAdapter @id("runtime_requirement_fetch_adapter") sourceHost runtime_host_js_web targetHost runtime_host_rust_cli capability fetch hostCapability runtime_cap_rust_fetch binding runtime_binding_rust_fetch requiredSignals source-hash|target-hash|runtime-command|probe-id|telemetry-hash|network-trace-hash proofEvidence evidence_runtime_fetch evidence evidence_runtime_fetch missingEvidence target-adapter-fixture proofGap rust-fetch-adapter-boundary readiness needs-review reason "Fetch adapter needs replay proof."
  evidence fetchProbe @id("evidence_runtime_fetch") kind runtime-adapter-proof status passed capability fetch sourceHost runtime_host_js_web targetHost runtime_host_rust_cli runtimeProofSignals source-hash|target-hash|runtime-command|probe-id|telemetry-hash|network-trace-hash command "npm run probe:fetch" probeId fetch-probe telemetryHash hash_telemetry networkTraceHash hash_network
  gap domProbe @id("runtime_gap_dom_probe") code runtime-dom-proof status missing summary "DOM proof is not provided."
}
`);

const runtime = doc.metadata.runtimeCapabilities;
assert.equal(runtime.id, 'runtime_caps_web_rust');
assert.equal(runtime.kind, 'frontier.lang.authoredRuntimeCapabilityMatrixInput');
assert.equal(runtime.hostProfileIds.includes('runtime_host_js_web'), true);
assert.equal(runtime.sourceHostIds[0], 'runtime_host_js_web');
assert.equal(runtime.targetHostIds[0], 'runtime_host_rust_cli');
assert.equal(runtime.hostProfiles[0].capabilities.fetch.support, 'native');
assert.equal(runtime.hostProfiles[1].capabilities.fetch.binding, 'runtime_binding_rust_fetch');
assert.equal(runtime.hostCapabilityIds.includes('runtime_cap_rust_fetch'), true);
assert.equal(runtime.hostCapabilities[1].bindingId, 'runtime_binding_rust_fetch');
assert.equal(runtime.hostBindingIds.includes('runtime_binding_web_fetch'), true);
assert.equal(runtime.hostBindings[0].apiName, 'fetch');
assert.equal(runtime.runtimeRequirements[0].sourceHost, 'runtime_host_js_web');
assert.equal(runtime.runtimeRequirements[0].targetHost, 'runtime_host_rust_cli');
assert.equal(runtime.runtimeRequirements[0].requiredSignals.includes('network-trace-hash'), true);
assert.equal(runtime.runtimeRequirements[0].proofEvidenceIds[0], 'evidence_runtime_fetch');
assert.equal(runtime.runtimeRequirements[0].hostCapabilityIds[0], 'runtime_cap_rust_fetch');
assert.equal(runtime.runtimeRequirements[0].bindingIds[0], 'runtime_binding_rust_fetch');
assert.equal(runtime.runtimeRequirements[0].missingEvidence[0], 'target-adapter-fixture');
assert.equal(runtime.runtimeRequirements[0].proofGaps[0], 'rust-fetch-adapter-boundary');
assert.equal(runtime.runtimeRequirements[0].failClosed, true);
assert.equal(runtime.evidence[0].status, 'passed');
assert.equal(runtime.evidence[0].command, 'npm run probe:fetch');
assert.equal(runtime.evidence[0].runtimeProofSignals.includes('telemetry-hash'), true);
assert.equal(runtime.proofGapCodes[0], 'runtime-dom-proof');
assert.equal(runtime.summary.capabilityCount, 2);
assert.equal(runtime.summary.hostCapabilityCount, 2);
assert.equal(runtime.summary.hostBindingCount, 2);
assert.equal(runtime.claims.runtimeEquivalenceClaim, false);
assert.equal(runtime.claims.semanticEquivalenceClaim, false);
assert.equal(runtime.claims.autoMergeClaim, false);
assert.equal(doc.metadata.runtimeCapabilityMatrix.id, runtime.id);
assert.equal(doc.metadata.universalAst.runtimeCapabilityIds[0], 'runtime_caps_web_rust');
assert.equal(doc.metadata.universalAst.metadata.authoredRuntimeCapabilityIds[0], 'runtime_caps_web_rust');

const syntaxReport = inspectFrontierSourceSyntax(`module RuntimeCapabilitySyntaxProbe @id("mod_runtime_capability_syntax_probe") {
runtimeCapabilities Runtime @id("runtime_syntax") {
  host browser @id("runtime_host_browser") language javascript runtime web path src/browser.ts sourceHash sha256:browser
  runtimeHost node @id("runtime_host_node") language javascript runtime node
  sourceHost web @id("runtime_host_web") language javascript runtime web
  targetHost rust @id("runtime_host_rust") language rust runtime cli
  capability fetch @id("runtime_capability_fetch") host runtime_host_web support native
  binding fetchBinding @id("runtime_binding_fetch") host runtime_host_web capability fetch kind native-api
  requirement fetchAdapter @id("runtime_requirement_fetch_adapter") sourceHost runtime_host_web targetHost runtime_host_rust capability fetch requiredSignals source-hash|target-hash|runtime-command
  proofEvidence fetchProbe @id("runtime_evidence_fetch") kind runtime-adapter-proof status passed
  gap domProbe @id("runtime_gap_dom_probe") code runtime-dom-proof status missing
}
}`, { sourcePath: 'runtime-capabilities.frontier' });

assert.equal(syntaxReport.summary.failClosed, false);
assert.equal(syntaxReport.summary.unknownChildCount, 0);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.hostProfile, 4);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.hostCapability, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.hostBinding, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.runtimeRequirement, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.evidence, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.proofGap, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.runtimeCapabilities.hostProfile, 4);
const runtimeSyntaxBlock = syntaxReport.recognizedBlocks.find((block) => block.id === 'runtime_syntax');
assert.ok(runtimeSyntaxBlock);
const sourceHostRow = runtimeSyntaxBlock.children.find((child) => child.rowKind === 'sourceHost');
assert.equal(sourceHostRow.normalizedRowKind, 'hostProfile');
assert.equal(sourceHostRow.sourceSpan.path, 'runtime-capabilities.frontier');
assert.equal(sourceHostRow.sourceSpan.blockKind, 'runtimeCapabilities');

const unknownRuntimeRows = inspectFrontierSourceSyntax(`module UnknownRuntimeRows @id("mod_unknown_runtime_rows") {
runtimeCapabilityMatrix Runtime @id("runtime_unknown_matrix") {
  schedulerMagic workStealing @id("runtime_scheduler_magic")
}
runtimeHosts Hosts @id("runtime_unknown_hosts") {
  secretHost root @id("runtime_secret_host")
}
}`);

assert.equal(unknownRuntimeRows.summary.failClosed, true);
assert.equal(unknownRuntimeRows.summary.unknownChildCount, 2);
assert.equal(unknownRuntimeRows.summary.sourceSyntaxRowFamilyCounts.schedulerMagic, 1);
assert.equal(unknownRuntimeRows.summary.sourceSyntaxRowFamilyCounts.secretHost, 1);
assert.equal(unknownRuntimeRows.summary.sourceSyntaxRowFamilyCountsByBlockFamily.runtimeCapabilityMatrix.schedulerMagic, 1);
assert.equal(unknownRuntimeRows.summary.sourceSyntaxRowFamilyCountsByBlockFamily.runtimeHosts.secretHost, 1);
assert.deepEqual(
  unknownRuntimeRows.unknownChildren.map((child) => child.reason),
  ['unsupported-runtime-capability-row', 'unsupported-runtime-capability-row']
);
