import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax } from '../dist/index.js';

const report = inspectFrontierSourceSyntax(`module RemainingRowFailClosedSyntax @id("mod_remaining_row_fail_closed") {
constraintSpace Constraints @id("constraint_space_unknown") {
  solverMagic anneal @id("constraint_unknown_solver")
}
possibilitySpace Possibilities @id("possibility_space_unknown") {
  probabilityField route @id("possibility_unknown_probability")
}
decisionGraph Decisions @id("decision_graph_unknown") {
  hiddenVote route @id("decision_unknown_hidden_vote")
}
admissionGraph Admissions @id("admission_graph_unknown") {
  unsafeAdmit patch @id("admission_unknown_unsafe")
}
paradigm Paradigm @id("paradigm_unknown") {
  borrowChecker rust @id("paradigm_unknown_borrow")
}
paradigmSemantics Semantics @id("paradigm_semantics_unknown") {
  macroPhase compile @id("paradigm_semantics_unknown_macro")
}
proof Proof @id("proof_unknown") {
  theorem unchecked @id("proof_unknown_theorem")
}
}`);

assert.equal(report.summary.failClosed, true);
assert.equal(report.summary.unknownChildCount, 7);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.solverMagic, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.probabilityField, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.hiddenVote, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.unsafeAdmit, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.borrowChecker, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.macroPhase, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCounts.theorem, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.constraintSpace.solverMagic, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.possibilitySpace.probabilityField, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.decisionGraph.hiddenVote, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.admissionGraph.unsafeAdmit, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.paradigm.borrowChecker, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.paradigmSemantics.macroPhase, 1);
assert.equal(report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.proof.theorem, 1);
assert.deepEqual(
  report.unknownChildren.map((child) => child.reason),
  [
    'unsupported-constraint-space-row',
    'unsupported-constraint-space-row',
    'unsupported-decision-graph-row',
    'unsupported-decision-graph-row',
    'unsupported-paradigm-row',
    'unsupported-paradigm-row',
    'unsupported-proof-row'
  ]
);
