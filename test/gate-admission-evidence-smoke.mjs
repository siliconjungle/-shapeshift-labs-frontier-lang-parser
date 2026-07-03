import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module GateAdmissionProbe @id("mod_gate_admission_probe") {
gateEvidence MergeAdmission @id("gate_admission_merge") {
  gate typecheck @id("gate_typecheck") kind typecheck status passed required command "npm run typecheck" route conversion_typescript_to_rust sourceLanguage typescript target rust sourcePath src/user.ts sourceHash h_source outputHash h_typecheck subject symbol:renameUser evidence evidence_typecheck proofEvidence proof_typecheck
  evidence typecheck @id("evidence_typecheck") kind test status passed path reports/typecheck.json command "npm run typecheck" route conversion_typescript_to_rust sourceLanguage typescript target rust sourceHash h_source outputHash h_typecheck gate gate_typecheck summary "Type gate passed."
  proofEvidence replay @id("proof_replay") kind replay status missing route conversion_typescript_to_rust sourceLanguage typescript target rust gate gate_typecheck hash h_replay summary "Replay proof still missing."
  admission rename @id("admission_rename") status ready action review readiness needs-review decision review classification bounded route conversion_typescript_to_rust sourceLanguage typescript target rust gate gate_typecheck evidence evidence_typecheck proofEvidence proof_replay missingEvidence runtime-proof conflictKey symbol:renameUser reasonCode needs-runtime-proof
  proofObligation runtimeProbe @id("proof_obligation_runtime") kind runtime-proof status missing route conversion_typescript_to_rust sourceLanguage typescript target rust gate gate_typecheck admission admission_rename evidence evidence_typecheck proofEvidence proof_replay requiredSignal telemetry-hash missingSignal telemetry-hash missingEvidence runtime-proof reasonCode needs-runtime-proof summary "Runtime proof must bind telemetry to the source hash."
  proofGap runtimeProbe @id("gap_runtime_probe") code runtime-proof status missing route conversion_typescript_to_rust admission admission_rename summary "Runtime proof is required before auto admission."
}
}`;

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'gate-admission.frontier' });
assert.equal(report.summary.unknownBlockCount, 0);
assert.equal(report.summary.unknownChildCount, 0);
assert.equal(report.summary.recognizedKinds.includes('gateEvidence'), true);
assert.equal(report.summary.recognizedChildKinds.includes('gateAdmissionEvidenceRow'), true);

const doc = parseFrontierSource(source, { sourcePath: 'gate-admission.frontier' });
const gateAdmission = doc.metadata.gateAdmissionEvidence;
assert.equal(gateAdmission.id, 'gate_admission_merge');
assert.equal(gateAdmission.kind, 'frontier.lang.authoredGateAdmissionEvidenceInput');
assert.deepEqual(gateAdmission.gateIds, ['gate_typecheck']);
assert.deepEqual(gateAdmission.evidenceIds, ['evidence_typecheck', 'proof_replay']);
assert.deepEqual(gateAdmission.proofEvidenceIds, ['proof_replay']);
assert.deepEqual(gateAdmission.admissionIds, ['admission_rename']);
assert.deepEqual(gateAdmission.proofObligationIds, ['proof_obligation_runtime']);
assert.equal(gateAdmission.proofGapCodes.includes('runtime-proof'), true);
assert.equal(gateAdmission.missingEvidence.includes('runtime-proof'), true);
assert.equal(gateAdmission.summary.passedGateCount, 1);
assert.equal(gateAdmission.summary.proofObligationCount, 1);
assert.equal(gateAdmission.summary.openProofObligationCount, 1);
assert.equal(gateAdmission.claims.autoMergeClaim, false);
assert.equal(gateAdmission.claims.semanticEquivalenceClaim, false);
assert.equal(gateAdmission.claims.runtimeEquivalenceClaim, false);
assert.equal(gateAdmission.claims.targetAdapterReadinessClaim, false);

const gate = gateAdmission.gates[0];
assert.equal(gate.routeId, 'conversion_typescript_to_rust');
assert.equal(gate.command, 'npm run typecheck');
assert.equal(gate.required, true);
assert.equal(gate.claims.gatePassImpliesAdmissionClaim, false);
assert.equal(gate.claims.targetAdapterReadinessClaim, false);
assert.equal(gate.sourceSpan.path, 'gate-admission.frontier');
assert.equal(gate.sourceSpan.blockKind, 'gateEvidence');

const admission = gateAdmission.admissions[0];
assert.equal(admission.action, 'review');
assert.equal(admission.reviewRequired, true);
assert.equal(admission.failClosed, true);
assert.equal(admission.autoMergeClaim, false);
assert.equal(admission.semanticEquivalenceClaim, false);
assert.equal(admission.runtimeEquivalenceClaim, false);
assert.equal(admission.targetAdapterReadinessClaim, false);
assert.deepEqual(admission.gateIds, ['gate_typecheck']);
assert.deepEqual(admission.proofEvidenceIds, ['proof_replay']);
assert.deepEqual(admission.missingEvidence, ['runtime-proof']);

const obligation = gateAdmission.proofObligations[0];
assert.equal(obligation.id, 'proof_obligation_runtime');
assert.equal(obligation.kind, 'frontier.lang.gateAdmissionEvidence.proofObligation');
assert.equal(obligation.obligationKind, 'runtime-proof');
assert.equal(obligation.status, 'missing');
assert.equal(obligation.failClosed, true);
assert.equal(obligation.autoMergeClaim, false);
assert.equal(obligation.semanticEquivalenceClaim, false);
assert.equal(obligation.runtimeEquivalenceClaim, false);
assert.equal(obligation.targetAdapterReadinessClaim, false);
assert.deepEqual(obligation.requiredSignals, ['telemetry-hash']);
assert.deepEqual(obligation.missingSignals, ['telemetry-hash']);
assert.deepEqual(obligation.gateIds, ['gate_typecheck']);
assert.deepEqual(obligation.admissionIds, ['admission_rename']);
assert.equal(obligation.authoredText.startsWith('proofObligation runtimeProbe'), true);
assert.equal(obligation.sourceSpan.blockKind, 'gateEvidence');

const unsupportedSource = `module GateAdmissionUnsupported @id("mod_gate_admission_unsupported") {
gateEvidence BrokenAdmission @id("gate_admission_broken") {
  futureProof weird @id("future_row") status magical evidence unknown
}
}`;

const unsupportedReport = inspectFrontierSourceSyntax(unsupportedSource, { sourcePath: 'unsupported-gate-admission.frontier' });
assert.equal(unsupportedReport.summary.failClosed, true);
assert.equal(unsupportedReport.summary.unknownChildCount, 1);
assert.equal(unsupportedReport.unknownChildren[0].kind, 'gateAdmissionUnknownRow');
assert.equal(unsupportedReport.unknownChildren[0].reason, 'unsupported-gate-admission-row');

const unsupportedDoc = parseFrontierSource(unsupportedSource, { sourcePath: 'unsupported-gate-admission.frontier' });
const brokenAdmission = unsupportedDoc.metadata.gateAdmissionEvidence;
assert.equal(brokenAdmission.parser.status, 'needs-review');
assert.equal(brokenAdmission.parser.errors[0].code, 'unsupported-gate-admission-row');
assert.equal(brokenAdmission.unknownRows[0].reason, 'unsupported-gate-admission-row');
assert.equal(brokenAdmission.unknownRows[0].failClosed, true);
assert.equal(brokenAdmission.unknownRows[0].autoMergeClaim, false);
assert.equal(brokenAdmission.proofGapCodes.includes('unsupported-gate-admission-row'), true);
assert.equal(brokenAdmission.missingEvidence.includes('unsupported-gate-admission-row'), true);
assert.equal(brokenAdmission.summary.unknownRowCount, 1);
