import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module SemanticHistorySource @id("mod_semantic_history_source") {
semanticHistory ProjectionRun @id("history_projection_run") {
  language frontier
  sourcePath src/login.frontier
  sourceHash h_source
  baseHash h_base
  targetHash h_target
  actor worker @id("actor_worker") kind agent role projection-worker run run_42 lane projection task task_login
  recordSource run @id("record_source_run") kind frontier-run path .frontier-run/run_42.jsonl hash h_run
  source authored @id("source_authored") import import_frontier language frontier sourcePath src/login.frontier sourceHash h_source baseHash h_base targetHash h_target
  region login @id("region_login") key symbol:Login regionKind component symbol sym_login symbolName Login sourcePath src/login.frontier
  candidate rustProjection @id("candidate_rust_projection") patch patch_rust_login readiness needs-review ownership symbol:Login conflict symbol:Login evidence evidence_runtime proof proof_typecheck replay replay_generated
  semanticClaim runtime @id("claim_runtime_bound") status open subject symbol:Login predicate needs-runtime-proof object true evidence evidence_runtime proof proof_runtime
  acceptedFact binding @id("fact_binding_preserved") subject symbol:Login predicate binding-preserved object true evidence evidence_runtime proof proof_typecheck
  rejectedTheory autoMerge @id("theory_auto_merge") subject route:frontier-to-rust predicate safe-to-auto-merge object false evidence evidence_runtime
  parserEvidence frontierParser @id("parser_evidence_frontier") evidence evidence_parser parser frontier-parser kind source-syntax status passed semanticIndexHash h_index
  proofAttempt typecheck @id("proof_attempt_typecheck") proof proof_typecheck kind typecheck status passed evidence evidence_runtime command "npm run typecheck" resultHash h_typecheck
  proofId runtimeProbe @id("proof_ref_runtime") proof proof_runtime kind runtime status missing path reports/runtime.json
  reviewer human @id("reviewer_human") kind human status requested decision decision_admit evidence evidence_runtime proof proof_typecheck
  admission hold @id("admission_hold") status blocked readiness missing-runtime-proof decision review reviewer reviewer_human patch patch_rust_login evidence evidence_runtime proof proof_runtime reason needs-runtime-proof missing runtime-proof
  lineage moveLogin @id("lineage_login_move") event moved from symbol:Login to symbol:LoginRust operation op_worker_1 heads h_base|h_target evidence evidence_lineage proof proof_typecheck
  patch rustLogin @id("patch_rust_login") parent patch_parent ancestor patch_root baseHash h_base targetHash h_target conflict symbol:Login
  decision admit @id("decision_admit") status needs-review patch patch_rust_login evidence evidence_runtime reason needs-runtime-proof
  replay generated @id("replay_generated") kind command path reports/replay.json hash h_replay
  evidence runtime @id("evidence_runtime") kind runtime status passed path reports/runtime.json command "npm run probe"
}
}`;

const report = inspectFrontierSourceSyntax(source, {
  sourcePath: 'semantic-history.frontier'
});
const counts = report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.semanticHistory;
assert.equal(report.summary.failClosed, false);
assert.equal(counts.language, 1);
assert.equal(counts.sourcePath, 1);
assert.equal(counts.baseHash, 1);
assert.equal(counts.actor, 1);
assert.equal(counts.recordSource, 1);
assert.equal(counts.source, 1);
assert.equal(counts.ownershipRegion, 1);
assert.equal(counts.semanticCandidate, 1);
assert.equal(counts.claim, 1);
assert.equal(counts.acceptedFact, 1);
assert.equal(counts.rejectedTheory, 1);
assert.equal(counts.importedParserEvidence, 1);
assert.equal(counts.proofAttempt, 1);
assert.equal(counts.proofId, 1);
assert.equal(counts.reviewer, 1);
assert.equal(counts.admission, 1);
assert.equal(counts.lineage, 1);
assert.equal(counts.patchAncestry, 1);
assert.equal(counts.mergeDecision, 1);
assert.equal(counts.replay, 1);
assert.equal(counts.evidence, 1);

const block = report.recognizedBlocks.find((entry) => entry.id === 'history_projection_run');
assert.equal(block.children.find((child) => child.rowKind === 'region').normalizedRowKind, 'ownershipRegion');
assert.equal(block.children.find((child) => child.rowKind === 'candidate').normalizedRowKind, 'semanticCandidate');
assert.equal(block.children.find((child) => child.rowKind === 'semanticClaim').normalizedRowKind, 'claim');
assert.equal(block.children.find((child) => child.rowKind === 'parserEvidence').normalizedRowKind, 'importedParserEvidence');
assert.equal(block.children.find((child) => child.rowKind === 'patch').normalizedRowKind, 'patchAncestry');
assert.equal(block.children.find((child) => child.rowKind === 'decision').normalizedRowKind, 'mergeDecision');
assert.equal(block.children.find((child) => child.rowKind === 'lineage').sourceSpan.path, 'semantic-history.frontier');

const doc = parseFrontierSource(source, {
  sourcePath: 'semantic-history.frontier'
});
const semanticHistory = doc.metadata.semanticHistory;
assert.equal(semanticHistory.id, 'history_projection_run');
assert.equal(semanticHistory.historyIds.includes('history_projection_run'), true);
assert.equal(semanticHistory.summary.historyCount, 1);
assert.equal(semanticHistory.summary.semanticCandidateCount, 1);
assert.equal(semanticHistory.summary.semanticClaimCount, 3);
assert.equal(semanticHistory.summary.proofRefCount, 1);
assert.equal(semanticHistory.summary.reviewerCount, 1);
assert.equal(semanticHistory.summary.admissionCount, 1);
assert.equal(semanticHistory.summary.lineageEventCount, 1);
assert.equal(semanticHistory.summary.mergeDecisionCount, 1);
assert.equal(semanticHistory.sourcePaths.includes('src/login.frontier'), true);
assert.equal(semanticHistory.ownershipKeys.includes('symbol:Login'), true);
assert.equal(semanticHistory.semanticAnchorKeys.includes('symbol:LoginRust'), true);
assert.equal(semanticHistory.evidenceIds.includes('evidence_runtime'), true);
assert.equal(semanticHistory.proofIds.includes('proof_typecheck'), true);
assert.equal(semanticHistory.proofIds.includes('proof_runtime'), true);
assert.equal(semanticHistory.reviewerIds.includes('reviewer_human'), true);
assert.equal(semanticHistory.admissionIds.includes('admission_hold'), true);
assert.equal(semanticHistory.admissionStatuses.includes('blocked'), true);
assert.equal(semanticHistory.admissionReadinesses.includes('missing-runtime-proof'), true);

const history = semanticHistory.historyRecords[0];
assert.equal(history.actor.id, 'actor_worker');
assert.equal(history.recordSource.id, 'record_source_run');
assert.equal(history.reviewer.id, 'reviewer_human');
assert.equal(history.admission.id, 'admission_hold');
assert.equal(history.sources[0].importId, 'import_frontier');
assert.equal(history.ownershipRegions[0].key, 'symbol:Login');
assert.equal(history.semanticCandidates[0].ownershipKeys[0], 'symbol:Login');
assert.equal(history.semanticClaims.length, 3);
assert.equal(history.importedParserEvidence[0].semanticIndexHash, 'h_index');
assert.equal(history.proofAttempts[0].command, 'npm run typecheck');
assert.equal(history.proofRefs[0].proofId, 'proof_runtime');
assert.equal(history.reviewers[0].status, 'requested');
assert.equal(history.admissions[0].missingEvidence[0], 'runtime-proof');
assert.equal(history.lineageEvents[0].from.key, 'symbol:Login');
assert.equal(history.lineageEvents[0].to[0].key, 'symbol:LoginRust');
assert.equal(history.patchAncestry[0].patchId, 'patch_rust_login');
assert.equal(history.mergeDecisions[0].status, 'needs-review');
assert.equal(history.replayLinks[0].hash, 'h_replay');
assert.equal(history.evidence[0].status, 'passed');
assert.equal(history.parser.status, 'authored');

const unknown = inspectFrontierSourceSyntax(`module UnknownHistory @id("mod_unknown_history") {
semanticHistory Broken @id("history_broken") {
  impossibleRow nope @id("history_bad")
}
}`);
assert.equal(unknown.summary.failClosed, true);
assert.equal(unknown.summary.unknownChildCount, 1);
assert.equal(unknown.unknownChildren[0].reason, 'unsupported-semantic-history-row');

const pluralAliasDoc = parseFrontierSource(`module PluralSemanticHistory @id("mod_plural_semantic_history") {
semanticHistoryRecords ProjectionRuns @id("history_plural") {
  source authored @id("source_plural") path src/plural.frontier hash h_plural
}
}`);
assert.equal(pluralAliasDoc.metadata.semanticHistory.id, 'history_plural');
assert.equal(pluralAliasDoc.metadata.semanticHistory.summary.sourceCount, 1);
