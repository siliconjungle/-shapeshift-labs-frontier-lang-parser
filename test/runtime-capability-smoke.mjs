import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

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
