import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const doc = parseFrontierSource(`
module DialectRegistryProbe @id("mod_dialect_registry_probe")

dialectRegistry RuntimeDialects @id("dialect_registry_runtime") {
  sourceLanguage javascript
  sourcePath src/runtime.ts
  sourceHash sha256:runtime
  dialect nodeProcess @id("dialect_registry_node_process") dialect node.runtime kind runtime name process.env target rust disposition unsupported readiness blocked loss loss_node_process_projection evidence evidence_node_runtime sourceMap sourcemap_runtime
  extern viteRoutes @id("dialect_registry_vite_routes") dialect vite.plugin.virtual-module externKind generatorArtifact target rust disposition runtime-required readiness needs-review evidence evidence_vite_routes_manifest bindingSymbol virtual:routes module vite
}
`);

assert.equal(doc.metadata.dialects.id, 'dialect_registry_runtime');
assert.equal(doc.metadata.dialects.kind, 'frontier.lang.universalDialectRegistry');
assert.equal(doc.metadata.dialects.language, 'javascript');
assert.equal(doc.metadata.dialects.sourcePath, 'src/runtime.ts');
assert.equal(doc.metadata.dialects.sourceHash, 'sha256:runtime');
assert.equal(doc.metadata.dialects.summary.records, 2);
assert.equal(doc.metadata.dialects.summary.projectionReadiness, 'blocked');
assert.equal(doc.metadata.dialects.summary.dialectNames.includes('node.runtime'), true);
assert.equal(doc.metadata.dialects.dialects[0].id, 'dialect_registry_node_process');
assert.equal(doc.metadata.dialects.dialects[0].language, 'javascript');
assert.equal(doc.metadata.dialects.dialects[0].sourceHash, 'sha256:runtime');
assert.equal(doc.metadata.dialects.dialects[0].projection.disposition, 'unsupported');
assert.equal(doc.metadata.dialects.dialects[0].projection.targets[0], 'rust');
assert.equal(doc.metadata.dialects.externs[0].binding.symbol, 'virtual:routes');
assert.equal(doc.metadata.dialects.externs[0].sourceHash, 'sha256:runtime');
assert.equal(doc.metadata.dialects.externs[0].projection.evidenceIds[0], 'evidence_vite_routes_manifest');
assert.equal(doc.metadata.dialects.metadata.semanticEquivalenceClaim, false);

const syntaxReport = inspectFrontierSourceSyntax(`module DialectRegistrySyntax @id("mod_dialect_registry_syntax") {
universalDialectRegistry RuntimeDialects @id("dialect_registry_syntax") {
  language javascript
  path src/runtime.ts
  sourceHash sha256:runtime
  record nodeProcess @id("dialect_registry_syntax_node_process") dialect node.runtime kind runtime target rust readiness blocked
  dialect browserDom @id("dialect_registry_syntax_browser_dom") dialect browser.dom kind runtime target swiftui readiness needs-review
  extern viteRoutes @id("dialect_registry_syntax_vite_routes") dialect vite.plugin.virtual-module target rust readiness runtime-required
}
}`, { sourcePath: 'dialects.frontier' });

assert.equal(syntaxReport.summary.failClosed, false);
assert.equal(syntaxReport.summary.sourceSyntaxBlockFamilyCounts.universalDialectRegistry, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.language, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.sourcePath, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.sourceHash, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.dialect, 2);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.extern, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.universalDialectRegistry.language, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.universalDialectRegistry.sourcePath, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.universalDialectRegistry.sourceHash, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.universalDialectRegistry.dialect, 2);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.universalDialectRegistry.extern, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamiliesByBlockFamily.universalDialectRegistry.includes('dialect'), true);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamiliesByBlockFamily.universalDialectRegistry.includes('extern'), true);

const syntaxBlock = syntaxReport.recognizedBlocks.find((block) => block.id === 'dialect_registry_syntax');
const recordRow = syntaxBlock.children.find((child) => child.rowKind === 'record');
assert.equal(recordRow.normalizedRowKind, 'dialect');
assert.equal(recordRow.name, 'nodeProcess');
assert.equal(recordRow.sourceSpan.path, 'dialects.frontier');
assert.equal(recordRow.sourceSpan.blockKind, 'universalDialectRegistry');

const pathRow = syntaxBlock.children.find((child) => child.rowKind === 'path');
assert.equal(pathRow.normalizedRowKind, 'sourcePath');
assert.equal(pathRow.name, 'src/runtime.ts');

const unsupportedSyntaxReport = inspectFrontierSourceSyntax(`module UnknownDialectRegistrySyntax @id("mod_unknown_dialect_registry_syntax") {
dialectRegistry UnknownDialects @id("dialect_registry_unknown") {
  runtimePatch nodeProcess @id("dialect_registry_unknown_runtime_patch") dialect node.runtime
}
}`);

assert.equal(unsupportedSyntaxReport.summary.failClosed, true);
assert.equal(unsupportedSyntaxReport.summary.unknownChildCount, 1);
assert.equal(unsupportedSyntaxReport.summary.unknownChildKinds[0], 'runtimePatch');
assert.equal(unsupportedSyntaxReport.summary.sourceSyntaxRowFamilyCounts.runtimePatch, 1);
assert.equal(unsupportedSyntaxReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.dialectRegistry.runtimePatch, 1);
assert.equal(unsupportedSyntaxReport.unknownChildren[0].reason, 'unsupported-dialect-registry-row');
