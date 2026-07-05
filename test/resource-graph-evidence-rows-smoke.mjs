import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ResourceEvidenceRows @id("mod_resource_evidence_rows") {
resourceGraph EvidenceResources @id("resource_graph_evidence") {
  sourceLanguage rust
  sourcePath src/lib.rs
  sourceHash sha256:resource
  resource store @id("resource_store") kind collection owner owner_store
  proofEvidence run @id("resource_evidence_run") kind test status passed command "cargo test" outputHash sha256:out
  sourceMap lowLevel @id("resource_source_map_low_level") sourceRecord resource_store targetRecord memory_heap generated dist/lib.rs mappingHash sha256:map
  mapping borrowed @id("resource_source_mapping_borrowed") sourceRecord resource_store targetRecord access_load generated dist/lib.rs
  missingEvidence ubProof @id("resource_missing_ub") reason undefined-behavior-proof summary "UB proof is required before admission."
}
}`;

const syntaxReport = inspectFrontierSourceSyntax(source, { sourcePath: 'resource-evidence.frontier' });
assert.equal(syntaxReport.summary.failClosed, false);
assert.equal(syntaxReport.summary.unknownChildCount, 0);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.evidence, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.sourceMap, 2);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.missingEvidence, 1);

const doc = parseFrontierSource(source, { sourcePath: 'resource-evidence.frontier' });
const graphs = doc.metadata.semanticResourceGraphs;
const graph = graphs.graphs[0];

assert.equal(graph.evidence[0].id, 'resource_evidence_run');
assert.equal(graph.evidence[0].evidenceKind, 'test');
assert.equal(graph.evidence[0].command, 'cargo test');
assert.equal(graph.sourceMaps[0].id, 'resource_source_map_low_level');
assert.equal(graph.sourceMaps[0].generatedPath, 'dist/lib.rs');
assert.equal(graph.sourceMaps[1].id, 'resource_source_mapping_borrowed');
assert.equal(graph.missingEvidence[0].reasonCode, 'undefined-behavior-proof');
assert.equal(graph.missingEvidence[0].failClosed, true);
assert.equal(graph.query.evidenceIds.includes('resource_evidence_run'), true);
assert.equal(graph.query.sourceMapIds.includes('resource_source_map_low_level'), true);
assert.equal(graph.query.sourceMapIds.includes('resource_source_mapping_borrowed'), true);
assert.equal(graph.query.missingEvidenceIds[0], 'resource_missing_ub');
assert.equal(graph.query.missingEvidence.includes('undefined-behavior-proof'), true);
assert.equal(graph.evidence[0].sourceSpan.path, 'resource-evidence.frontier');
assert.equal(graph.sourceMaps[0].sourceSpan.blockKind, 'resourceGraph');
assert.equal(graphs.evidenceIds.includes('resource_evidence_run'), true);
assert.equal(graphs.sourceMapIds.includes('resource_source_map_low_level'), true);
assert.equal(graphs.missingEvidenceIds.includes('resource_missing_ub'), true);
assert.equal(graphs.summary.evidenceCount, 1);
assert.equal(graphs.summary.sourceMapCount, 2);
assert.equal(graphs.summary.missingEvidenceCount, 1);
