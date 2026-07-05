import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module DecisionPanelFeedback @id("mod_decision_panel_feedback") {
decisionGraph Routing @id("decision_graph_routing") {
  graphKind model-routing
  panelProjection dashboard @id("panel_projection_dashboard") panel review projectionKind readiness mergeDecision merge_accept field status|cost
  improvementFeedback cost @id("feedback_cost") loop route_tuning kind cost-regression subject model:gpt5 severity warning action downroute feedback "Cost exceeded lane target."
}
admissionGraph RoutingAliases @id("admission_graph_routing_aliases") {
  kind model-routing
  panel compact @id("panel_projection_compact") panel review projectionKind compact field status
  feedback latency @id("feedback_latency") loop route_tuning kind latency-regression subject model:gpt5 severity warning action reroute feedback "Latency exceeded lane target."
}
}`;

const syntax = inspectFrontierSourceSyntax(source, { sourcePath: 'decision-panel-feedback.frontier' });
assert.equal(syntax.summary.failClosed, false);
assert.equal(syntax.summary.sourceSyntaxRowFamilyCountsByBlockFamily.decisionGraph.panelProjection, 1);
assert.equal(syntax.summary.sourceSyntaxRowFamilyCountsByBlockFamily.decisionGraph.improvementFeedback, 1);
assert.equal(syntax.summary.sourceSyntaxRowFamilyCountsByBlockFamily.admissionGraph.panelProjection, 1);
assert.equal(syntax.summary.sourceSyntaxRowFamilyCountsByBlockFamily.admissionGraph.improvementFeedback, 1);

const aliasBlock = syntax.recognizedBlocks.find((block) => block.id === 'admission_graph_routing_aliases');
assert.equal(aliasBlock.children.find((child) => child.rowKind === 'panel').normalizedRowKind, 'panelProjection');
assert.equal(aliasBlock.children.find((child) => child.rowKind === 'feedback').normalizedRowKind, 'improvementFeedback');

const doc = parseFrontierSource(source, { sourcePath: 'decision-panel-feedback.frontier' });
const decisionGraph = doc.metadata.decisionGraph;
assert.deepEqual(decisionGraph.panelProjectionIds, ['panel_projection_dashboard', 'panel_projection_compact']);
assert.deepEqual(decisionGraph.feedbackIds, ['feedback_cost', 'feedback_latency']);
assert.equal(decisionGraph.summary.panelProjectionCount, 2);
assert.equal(decisionGraph.summary.feedbackCount, 2);
assert.deepEqual(decisionGraph.graphs[0].panelProjectionIds, ['panel_projection_dashboard']);
assert.deepEqual(decisionGraph.graphs[0].feedbackIds, ['feedback_cost']);
assert.deepEqual(decisionGraph.graphs[1].panelProjectionIds, ['panel_projection_compact']);
assert.deepEqual(decisionGraph.graphs[1].feedbackIds, ['feedback_latency']);
assert.equal(decisionGraph.records.find((record) => record.id === 'panel_projection_dashboard').projectionKind, 'readiness');
assert.equal(decisionGraph.records.find((record) => record.id === 'feedback_cost').feedbackKind, 'cost-regression');
