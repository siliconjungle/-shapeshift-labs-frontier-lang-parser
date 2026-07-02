import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const doc = parseFrontierSource(`
module DialectRegistryProbe @id("mod_dialect_registry_probe")

dialectRegistry RuntimeDialects @id("dialect_registry_runtime") {
  language javascript
  sourcePath src/runtime.ts
  dialect nodeProcess @id("dialect_registry_node_process") dialect node.runtime kind runtime name process.env target rust disposition unsupported readiness blocked loss loss_node_process_projection evidence evidence_node_runtime sourceMap sourcemap_runtime
  extern viteRoutes @id("dialect_registry_vite_routes") dialect vite.plugin.virtual-module externKind generatorArtifact target rust disposition runtime-required readiness needs-review evidence evidence_vite_routes_manifest bindingSymbol virtual:routes module vite
}
`);

assert.equal(doc.metadata.dialects.id, 'dialect_registry_runtime');
assert.equal(doc.metadata.dialects.kind, 'frontier.lang.universalDialectRegistry');
assert.equal(doc.metadata.dialects.summary.records, 2);
assert.equal(doc.metadata.dialects.summary.projectionReadiness, 'blocked');
assert.equal(doc.metadata.dialects.summary.dialectNames.includes('node.runtime'), true);
assert.equal(doc.metadata.dialects.dialects[0].id, 'dialect_registry_node_process');
assert.equal(doc.metadata.dialects.dialects[0].projection.disposition, 'unsupported');
assert.equal(doc.metadata.dialects.dialects[0].projection.targets[0], 'rust');
assert.equal(doc.metadata.dialects.externs[0].binding.symbol, 'virtual:routes');
assert.equal(doc.metadata.dialects.externs[0].projection.evidenceIds[0], 'evidence_vite_routes_manifest');
assert.equal(doc.metadata.dialects.metadata.semanticEquivalenceClaim, false);
