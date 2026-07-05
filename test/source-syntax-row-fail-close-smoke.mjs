import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax } from '../dist/index.js';

const paradigmReport = inspectFrontierSourceSyntax(`module ParadigmRows @id("mod_paradigm_rows") {
paradigm Semantics @id("paradigm_semantics") {
  bindingScope module @id("scope_module") kind module
  binding title @id("binding_title") bindingScope scope_module
  pattern destructure @id("pattern_destructure") binding binding_title
  typeConstraint titleText @id("type_title_text") binding binding_title
  evaluationModel asyncEvent @id("eval_async_event")
  memoryLocation cache @id("memory_cache")
  effectRegion write @id("effect_region_write")
  controlRegion retry @id("control_region_retry")
  logicProgram validation @id("logic_validation")
  actorSystem workers @id("actor_workers")
  stackEffect pushArg @id("stack_push_arg")
  arrayShape list @id("array_shape_list")
  numericKernel score @id("numeric_kernel_score")
  dataflowNetwork sync @id("dataflow_sync")
  clockModel animation @id("clock_animation")
  objectModel prototype @id("object_model_proto")
  macroExpansion derive @id("macro_derive")
  reflectionBoundary dynamicImport @id("reflection_dynamic_import")
  loweringRecord rustBinding @id("lowering_rust_binding")
}
}`);

assert.equal(paradigmReport.summary.failClosed, false);
assert.equal(paradigmReport.summary.unknownChildCount, 0);
assert.equal(paradigmReport.summary.sourceSyntaxRowFamilyCounts.typeConstraint, 1);
assert.equal(paradigmReport.summary.sourceSyntaxRowFamilyCounts.effectRegion, 1);
assert.equal(paradigmReport.summary.sourceSyntaxRowFamilyCounts.logicProgram, 1);
assert.equal(paradigmReport.summary.sourceSyntaxRowFamilyCounts.reflectionBoundary, 1);
assert.equal(paradigmReport.summary.sourceSyntaxRowFamilyCounts.lowering, 1);

const graphPropertyReport = inspectFrontierSourceSyntax(`module GraphPropertyRows @id("mod_graph_property_rows") {
possibilitySpace Projection @id("space_projection") {
  subject symbol:user
  scope mod_graph_property_rows
  target typescript
}
decisionGraph Admission @id("decision_graph_admission") {
  graphKind semantic-merge-admission
  scope mod_graph_property_rows
  root merge_decision
  subject symbol:user
}
}`);

assert.equal(graphPropertyReport.summary.failClosed, false);
assert.equal(graphPropertyReport.summary.unknownChildCount, 0);
assert.equal(graphPropertyReport.summary.sourceSyntaxRowFamilyCounts.subject, 2);
assert.equal(graphPropertyReport.summary.sourceSyntaxRowFamilyCounts.scope, 2);
assert.equal(graphPropertyReport.summary.sourceSyntaxRowFamilyCounts.target, 1);
assert.equal(graphPropertyReport.summary.sourceSyntaxRowFamilyCounts.graphKind, 1);
assert.equal(graphPropertyReport.summary.sourceSyntaxRowFamilyCounts.root, 1);

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
