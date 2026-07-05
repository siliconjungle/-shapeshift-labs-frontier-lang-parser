import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const nativeSource = `module NativeSourceRows @id("mod_native_source_rows") {
nativeSource TodoTypescript @id("native_todo_ts") {
  sourceLanguage typescript
  parser typescript
  parserVersion 5.9.3
  path src/todo.ts
  sourceHash sha256:todo
  symbol Todo
  frontierNode ent_todo
  proofEvidence parserProbe @id("native_evidence_parser_probe") kind parser status passed path reports/parser.json
  sourcemap semantic @id("native_source_map_semantic") target frontier targetPath todo.frontier
  mapping title @id("native_mapping_title") sourceMap native_source_map_semantic semanticNode ent_todo sourceSpan src/todo.ts:1:1-3:2
  candidate title @id("native_candidate_title") semanticNode ent_todo symbol Todo readiness ready ownershipKey symbol:Todo
  loss dynamicProperty "computed property needs runtime evidence" severity warning
}
}`;

const report = inspectFrontierSourceSyntax(nativeSource, { sourcePath: 'native-source.frontier' });
const counts = report.summary.sourceSyntaxRowFamilyCountsByBlockFamily.nativeSource;

assert.equal(report.summary.failClosed, false);
assert.equal(counts.language, 1);
assert.equal(counts.parser, 1);
assert.equal(counts.parserVersion, 1);
assert.equal(counts.sourcePath, 1);
assert.equal(counts.sourceHash, 1);
assert.equal(counts.symbol, 1);
assert.equal(counts.frontierNodes, 1);
assert.equal(counts.evidence, 1);
assert.equal(counts.sourceMap, 2);
assert.equal(counts.mergeCandidate, 1);
assert.equal(counts.loss, 1);

const nativeBlock = report.recognizedBlocks.find((block) => block.id === 'native_todo_ts');
const languageRow = nativeBlock.children.find((child) => child.rowKind === 'sourceLanguage');
const pathRow = nativeBlock.children.find((child) => child.rowKind === 'path');
const nodeRow = nativeBlock.children.find((child) => child.rowKind === 'frontierNode');
const evidenceRow = nativeBlock.children.find((child) => child.rowKind === 'proofEvidence');
const mapRow = nativeBlock.children.find((child) => child.rowKind === 'sourcemap');
const mappingRow = nativeBlock.children.find((child) => child.rowKind === 'mapping');
const candidateRow = nativeBlock.children.find((child) => child.rowKind === 'candidate');

assert.equal(languageRow.normalizedRowKind, 'language');
assert.equal(pathRow.normalizedRowKind, 'sourcePath');
assert.equal(nodeRow.normalizedRowKind, 'frontierNodes');
assert.equal(evidenceRow.normalizedRowKind, 'evidence');
assert.equal(mapRow.normalizedRowKind, 'sourceMap');
assert.equal(mappingRow.normalizedRowKind, 'sourceMap');
assert.equal(candidateRow.normalizedRowKind, 'mergeCandidate');
assert.equal(pathRow.sourceSpan.path, 'native-source.frontier');
assert.equal(pathRow.sourceSpan.blockKind, 'nativeSource');

const document = parseFrontierSource(nativeSource, { sourcePath: 'native-source.frontier' });
const node = document.nodes.native_todo_ts;
assert.equal(node.language, 'typescript');
assert.equal(node.parser, 'typescript');
assert.equal(node.parserVersion, '5.9.3');
assert.equal(node.sourcePath, 'src/todo.ts');
assert.equal(node.sourceHash, 'sha256:todo');
assert.equal(node.symbol, 'Todo');
assert.deepEqual(node.frontierNodeIds, ['ent_todo']);
assert.deepEqual(node.sourceMapIds, ['native_source_map_semantic']);
assert.deepEqual(node.mergeCandidateIds, ['native_candidate_title']);
assert.deepEqual(node.evidenceIds, ['native_evidence_parser_probe']);
assert.equal(document.metadata.universalAst.sourceMaps[0].mappings[0].semanticNodeId, 'ent_todo');
assert.equal(document.metadata.universalAst.mergeCandidates[0].id, 'native_candidate_title');

const unknown = inspectFrontierSourceSyntax(`module UnknownNativeSourceRows @id("mod_unknown_native_source_rows") {
nativeSource MacroSource @id("native_macro_source") {
  macroExpansion generated @id("native_macro_generated")
}
}`);

assert.equal(unknown.summary.failClosed, true);
assert.equal(unknown.summary.unknownChildCount, 1);
assert.equal(unknown.summary.sourceSyntaxRowFamilyCounts.macroExpansion, 1);
assert.equal(unknown.unknownChildren[0].reason, 'unsupported-native-source-row');
