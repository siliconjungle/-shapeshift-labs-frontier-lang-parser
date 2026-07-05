import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module SemanticUnknownRows @id("mod_semantic_unknown_rows") {
resourceGraph BrokenResources @id("resource_graph_broken") {
  sourceLanguage rust
  actorRuntime asyncRuntime @id("resource_actor_runtime")
}
machineGraph BrokenMachine @id("machine_graph_broken") {
  architecture asm-65816
  mysteryFact lowLevel @id("machine_unknown_low_level")
}
}`;

const syntax = inspectFrontierSourceSyntax(source, { sourcePath: 'semantic-unknown.frontier' });
assert.equal(syntax.summary.failClosed, true);
assert.equal(syntax.summary.unknownChildCount, 2);
assert.equal(syntax.unknownChildren.find((child) => child.rowKind === 'actorRuntime').reason, 'unsupported-resource-graph-row');
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
assert.equal(resourceUnknown.id, 'resource_actor_runtime');
assert.equal(resourceUnknown.failClosed, true);
assert.equal(resourceGraph.proofGaps[0].code, 'unsupported-resource-graph-row');
assert.equal(resourceGraph.query.unknownRowIds[0], 'resource_actor_runtime');
assert.equal(resourceGraph.query.proofGapCodes[0], 'unsupported-resource-graph-row');
assert.equal(resourceGraph.query.blockerReasonCodes.includes('unsupported-resource-graph-row'), true);
assert.equal(resourceGraph.summary.unknownRows, 1);
assert.equal(resourceGraphs.unknownRowIds.includes('resource_actor_runtime'), true);
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

const runtimeSource = `module RuntimeUnknownRows @id("mod_runtime_unknown_rows") {
runtimeCapabilityMatrix Runtime @id("runtime_unknown_matrix") {
  schedulerMagic workStealing @id("runtime_scheduler_magic")
}
}`;

const runtimeSyntax = inspectFrontierSourceSyntax(runtimeSource, { sourcePath: 'runtime-unknown.frontier' });
assert.equal(runtimeSyntax.summary.failClosed, true);
assert.equal(runtimeSyntax.unknownChildren[0].reason, 'unsupported-runtime-capability-row');

const runtimeDoc = parseFrontierSource(runtimeSource, { sourcePath: 'runtime-unknown.frontier' });
const runtime = runtimeDoc.metadata.runtimeCapabilities;
assert.equal(runtime.parser.status, 'needs-review');
assert.equal(runtime.parser.errors[0].code, 'unsupported-runtime-capability-row');
assert.equal(runtime.unknownRows[0].id, 'runtime_scheduler_magic');
assert.equal(runtime.proofGaps[0].code, 'unsupported-runtime-capability-row');
assert.equal(runtime.proofGapCodes[0], 'unsupported-runtime-capability-row');
assert.equal(runtime.unknownRowIds[0], 'runtime_scheduler_magic');
assert.equal(runtime.summary.unknownRowCount, 1);
assert.equal(runtime.summary.parseErrors, 1);

const dialectSource = `module DialectUnknownRows @id("mod_dialect_unknown_rows") {
dialectRegistry UnknownDialects @id("dialect_registry_unknown") {
  runtimePatch nodeProcess @id("dialect_registry_unknown_runtime_patch") dialect node.runtime
}
}`;

const dialectSyntax = inspectFrontierSourceSyntax(dialectSource, { sourcePath: 'dialect-unknown.frontier' });
assert.equal(dialectSyntax.summary.failClosed, true);
assert.equal(dialectSyntax.unknownChildren[0].reason, 'unsupported-dialect-registry-row');

const dialectDoc = parseFrontierSource(dialectSource, { sourcePath: 'dialect-unknown.frontier' });
const dialects = dialectDoc.metadata.dialects;
assert.equal(dialects.parser.status, 'needs-review');
assert.equal(dialects.parser.errors[0].code, 'unsupported-dialect-registry-row');
assert.equal(dialects.unknownRows[0].id, 'dialect_registry_unknown_runtime_patch');
assert.equal(dialects.proofGaps[0].code, 'unsupported-dialect-registry-row');
assert.equal(dialects.proofGapCodes[0], 'unsupported-dialect-registry-row');
assert.equal(dialects.unknownRowIds[0], 'dialect_registry_unknown_runtime_patch');
assert.equal(dialects.summary.unknownRowCount, 1);
assert.equal(dialects.summary.parseErrors, 1);
assert.equal(dialects.summary.projectionReadiness, 'blocked');
