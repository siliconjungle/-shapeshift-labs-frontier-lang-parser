import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module SemanticUnknownRows @id("mod_semantic_unknown_rows") {
resourceGraph BrokenResources @id("resource_graph_broken") {
  sourceLanguage rust
  coroutineScope asyncRuntime @id("resource_coroutine_scope")
}
machineGraph BrokenMachine @id("machine_graph_broken") {
  architecture asm-65816
  mysteryFact lowLevel @id("machine_unknown_low_level")
}
}`;

const syntax = inspectFrontierSourceSyntax(source, { sourcePath: 'semantic-unknown.frontier' });
assert.equal(syntax.summary.failClosed, true);
assert.equal(syntax.summary.unknownChildCount, 2);
assert.equal(syntax.unknownChildren.find((child) => child.rowKind === 'coroutineScope').reason, 'unsupported-resource-graph-row');
assert.equal(syntax.unknownChildren.find((child) => child.rowKind === 'mysteryFact').reason, 'unsupported-machine-graph-row');

const doc = parseFrontierSource(source, { sourcePath: 'semantic-unknown.frontier' });
const resourceGraphs = doc.metadata.semanticResourceGraphs;
const machineGraphs = doc.metadata.machineGraphs;
const resourceGraph = resourceGraphs.graphs.find((graph) => graph.id === 'resource_graph_broken');
const machineGraph = machineGraphs.graphs.find((graph) => graph.id === 'machine_graph_broken');
const resourceUnknown = resourceGraph.unknownRows[0];
const machineUnknown = machineGraph.unknownRows[0];

assert.equal(resourceGraph.status, 'blocked');
assert.equal(resourceGraph.parser.status, 'needs-review');
assert.equal(resourceGraph.parser.errors[0].code, 'unsupported-resource-graph-row');
assert.equal(resourceUnknown.id, 'resource_coroutine_scope');
assert.equal(resourceUnknown.failClosed, true);
assert.equal(resourceGraph.proofGaps[0].code, 'unsupported-resource-graph-row');
assert.equal(resourceGraph.query.unknownRowIds[0], 'resource_coroutine_scope');
assert.equal(resourceGraph.query.proofGapCodes[0], 'unsupported-resource-graph-row');
assert.equal(resourceGraph.query.blockerReasonCodes.includes('unsupported-resource-graph-row'), true);
assert.equal(resourceGraph.summary.unknownRows, 1);
assert.equal(resourceGraphs.unknownRowIds.includes('resource_coroutine_scope'), true);
assert.equal(resourceGraphs.proofGapCodes.includes('unsupported-resource-graph-row'), true);
assert.equal(resourceGraphs.summary.unknownRowCount, 1);

assert.equal(machineGraph.status, 'blocked');
assert.equal(machineGraph.parser.status, 'needs-review');
assert.equal(machineGraph.parser.errors[0].code, 'unsupported-machine-graph-row');
assert.equal(machineUnknown.id, 'machine_unknown_low_level');
assert.equal(machineUnknown.failClosed, true);
assert.equal(machineGraph.proofGaps[0].code, 'unsupported-machine-graph-row');
assert.equal(machineGraph.query.unknownRowIds[0], 'machine_unknown_low_level');
assert.equal(machineGraph.query.proofGapCodes.includes('unsupported-machine-graph-row'), true);
assert.equal(machineGraph.query.blockerReasonCodes.includes('unsupported-machine-graph-row'), true);
assert.equal(machineGraph.summary.unknownRows, 1);
assert.equal(machineGraphs.unknownRowIds.includes('machine_unknown_low_level'), true);
assert.equal(machineGraphs.proofGapCodes.includes('unsupported-machine-graph-row'), true);
assert.equal(machineGraphs.summary.unknownRowCount, 1);
