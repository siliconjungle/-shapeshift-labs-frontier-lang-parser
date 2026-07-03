import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ConversionEvidenceProbe @id("mod_conversion_evidence_probe") {
conversion JsToRust @id("conversion_js_rust") {
  sourceLanguage javascript
  target rust
  runtimeRequirement browserProbe @id("runtime_requirement_browser_probe") capability layout target rust
  dialect jsx @id("dialect_jsx") language javascript nativeKind jsx-element evidence evidence_route_replay
  extern vite @id("extern_vite") module vite bindingSymbol defineConfig
  evidence routeProof @id("evidence_route_replay") kind conversion-replay-proof status passed route conversion_javascript_to_rust sourceLanguage javascript target rust path reports/conversion.json command "npm run probe:conversion" probeId conversion-probe sourceHash sha256:source targetHash sha256:target telemetryHash sha256:telemetry proofEvidence proof_route summary "Route replay binds source and target."
  constraint type publicApi @id("type_constraint_public_api") role source kind public-function symbol symbol:addTodo evidence evidence_route_replay
  proofEvidence routeRuntime @id("evidence_route_runtime") kind runtime-proof status needs-review route conversion_javascript_to_rust target rust proofEvidence proof_runtime summary "Runtime proof is recorded as evidence only."
}
}`;

const doc = parseFrontierSource(source, { sourcePath: 'conversion-evidence.frontier' });
const plan = doc.metadata.universalConversionPlan;
assert.equal(plan.id, 'conversion_js_rust');
assert.equal(plan.evidence.length, 2);
assert.equal(plan.claims.autoMergeClaim, false);
assert.equal(plan.claims.semanticEquivalenceClaim, false);
assert.equal(plan.claims.conversionEquivalenceClaim, false);
assert.deepEqual(plan.evidenceIds, ['evidence_route_replay', 'evidence_route_runtime']);
assert.equal(plan.summary.evidenceCount, 2);
assert.equal(plan.summary.runtimeRequirementCount, 1);
assert.equal(plan.summary.dialectCount, 1);
assert.equal(plan.summary.externCount, 1);
assert.equal(plan.summary.constraintCount, 1);
assert.equal(plan.runtimeRequirements[0].id, 'runtime_requirement_browser_probe');
assert.equal(plan.dialects[0].id, 'dialect_jsx');
assert.equal(plan.externs[0].id, 'extern_vite');
const evidence = plan.evidence[0];
assert.equal(evidence.id, 'evidence_route_replay');
assert.equal(evidence.kind, 'conversion-replay-proof');
assert.equal(evidence.status, 'passed');
assert.equal(evidence.routeId, 'conversion_javascript_to_rust');
assert.equal(evidence.sourceLanguage, 'javascript');
assert.equal(evidence.target, 'rust');
assert.equal(evidence.path, 'reports/conversion.json');
assert.equal(evidence.command, 'npm run probe:conversion');
assert.equal(evidence.probeId, 'conversion-probe');
assert.equal(evidence.sourceHash, 'sha256:source');
assert.equal(evidence.targetHash, 'sha256:target');
assert.equal(evidence.telemetryHash, 'sha256:telemetry');
assert.deepEqual(evidence.proofEvidenceIds, ['proof_route']);
assert.equal(evidence.summary, 'Route replay binds source and target.');
assert.equal(evidence.sourceSpan.path, 'conversion-evidence.frontier');
assert.equal(evidence.sourceSpan.blockId, 'conversion_js_rust');
assert.equal(evidence.metadata.autoMergeClaim, false);
assert.equal(evidence.metadata.semanticEquivalenceClaim, false);
assert.deepEqual(plan.typeConstraints[0].evidenceIds, ['evidence_route_replay']);
const proofEvidence = plan.evidence[1];
assert.equal(proofEvidence.id, 'evidence_route_runtime');
assert.equal(proofEvidence.kind, 'runtime-proof');
assert.equal(proofEvidence.status, 'needs-review');
assert.equal(proofEvidence.routeId, 'conversion_javascript_to_rust');
assert.equal(proofEvidence.target, 'rust');
assert.deepEqual(proofEvidence.proofEvidenceIds, ['proof_runtime']);
assert.equal(proofEvidence.metadata.autoMergeClaim, false);
assert.equal(proofEvidence.metadata.semanticEquivalenceClaim, false);

const syntax = inspectFrontierSourceSyntax(source, { sourcePath: 'conversion-evidence.frontier' });
const block = syntax.recognizedBlocks.find((candidate) => candidate.id === 'conversion_js_rust');
assert.equal(syntax.summary.childCount, 6);
assert.equal(syntax.summary.recognizedChildKinds.includes('conversionEvidence'), true);
assert.equal(syntax.summary.recognizedChildKinds.includes('conversionConstraint'), true);
assert.equal(syntax.summary.recognizedChildKinds.includes('conversionRuntimeRequirement'), true);
assert.equal(syntax.summary.recognizedChildKinds.includes('conversionDialect'), true);
assert.equal(syntax.summary.recognizedChildKinds.includes('conversionExtern'), true);
const evidenceChild = block.children.find((child) => child.kind === 'conversionEvidence');
assert.equal(evidenceChild.id, 'evidence_route_replay');
assert.equal(evidenceChild.normalizedRowKind, 'evidence');
assert.equal(evidenceChild.sourceSpan.path, 'conversion-evidence.frontier');
assert.equal(source.slice(evidenceChild.startOffset, evidenceChild.endOffset).startsWith('evidence routeProof'), true);
const proofEvidenceChild = block.children.find((child) => child.id === 'evidence_route_runtime');
assert.equal(proofEvidenceChild.kind, 'conversionEvidence');
assert.equal(proofEvidenceChild.rowKind, 'proofEvidence');
assert.equal(proofEvidenceChild.normalizedRowKind, 'evidence');
assert.equal(syntax.metadata.autoMergeClaim, false);
assert.equal(syntax.metadata.semanticEquivalenceClaim, false);

const unknownSyntax = inspectFrontierSourceSyntax(`module UnknownConversionRow @id("mod_unknown_conversion_row") {
conversion JsToRust @id("conversion_js_rust") {
  sourceLanguage javascript
  target rust
  proofy routeProof @id("proofy_route")
}
}`);
assert.equal(unknownSyntax.summary.failClosed, true);
assert.equal(unknownSyntax.summary.unsupportedSyntax, true);
assert.equal(unknownSyntax.summary.unknownChildCount, 1);
assert.deepEqual(unknownSyntax.summary.unknownChildKinds, ['proofy']);
assert.equal(unknownSyntax.unknownChildren[0].kind, 'conversionUnknownRow');
assert.equal(unknownSyntax.unknownChildren[0].reason, 'unsupported-conversion-row');
