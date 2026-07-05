import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ProofAliasProbe @id("mod_proof_alias_probe") {
proof MergeProof @id("proof_merge") {
  proofObligation replay @id("obligation_replay") kind runtime status missing subject action_merge contract contract_merge evidence evidence_replay missingEvidence runtime-proof statement "Replay proof must bind runtime evidence."
}
}`;

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'proof-alias.frontier' });
assert.equal(report.summary.unknownBlockCount, 0);
assert.equal(report.summary.unknownChildCount, 0);
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.recognizedKinds.includes('proof'), true);
assert.equal(report.summary.recognizedChildKinds.includes('proofRow'), true);

const proofBlock = report.recognizedBlocks.find((block) => block.id === 'proof_merge');
assert.ok(proofBlock);
const proofRow = proofBlock.children.find((child) => child.id === 'obligation_replay');
assert.ok(proofRow);
assert.equal(proofRow.rowKind, 'proofObligation');
assert.equal(proofRow.normalizedRowKind, 'obligation');
assert.equal(proofRow.sourceSpan.path, 'proof-alias.frontier');

const doc = parseFrontierSource(source, { sourcePath: 'proof-alias.frontier' });
assert.equal(doc.metadata.proof.id, 'proof_merge');
assert.equal(doc.metadata.proof.obligations.length, 1);

const obligation = doc.metadata.proof.obligations[0];
assert.equal(obligation.id, 'obligation_replay');
assert.equal(obligation.kind, 'runtime');
assert.equal(obligation.status, 'missing');
assert.equal(obligation.subjectId, 'action_merge');
assert.deepEqual(obligation.contractIds, ['contract_merge']);
assert.deepEqual(obligation.evidenceIds, ['evidence_replay']);
assert.deepEqual(obligation.metadata, { name: 'replay', authoredKind: 'proofObligation' });

const unsupportedSource = `module ProofUnsupportedProbe @id("mod_proof_unsupported_probe") {
proof BrokenProof @id("proof_broken") {
  futureObligation replay @id("future_obligation") kind runtime
}
}`;

const unsupportedReport = inspectFrontierSourceSyntax(unsupportedSource, { sourcePath: 'proof-unsupported.frontier' });
assert.equal(unsupportedReport.summary.failClosed, true);
assert.equal(unsupportedReport.summary.unknownChildCount, 1);
assert.equal(unsupportedReport.unknownChildren[0].reason, 'unsupported-proof-row');
