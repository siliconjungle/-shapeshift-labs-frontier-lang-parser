import assert from 'node:assert/strict';
import { parseFrontierSource } from '../src/index.js';

const doc = parseFrontierSource(`
module TargetProjectionAggregate @id("mod_target_projection_aggregate")
target rust @id("target_rust") {
  language rust
  package example_todo
  emitPath src/generated/todo.rs
  moduleFormat crate
  projection rustAdapter @id("target_projection_rust") disposition target-adapter readiness needs-review adapter rust_codegen represented semantic-symbol|source-map missing semantic-ownership evidence artifact_projection proof artifact_projection loss loss_borrow missingEvidence translation-borrow-scope:borrow-across-await
  layer ownership @id("target_layer_rust_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
}
`);

assert.equal(doc.nodes.target_rust.metadata.projectionContracts[0].id, 'target_projection_rust');
assert.equal(doc.metadata.targetProjections.targets[0].target.language, 'rust');
assert.equal(doc.metadata.targetProjections.targets[0].target.emitPath, 'src/generated/todo.rs');
assert.equal(doc.metadata.targetProjections.targets[0].projectionContracts[0].targetId, 'target_rust');
assert.equal(doc.metadata.targetProjections.projectionContractIds[0], 'target_projection_rust');
assert.equal(doc.metadata.targetProjections.proofEvidenceIds[0], 'artifact_projection');
assert.equal(doc.metadata.targetProjections.claims.autoMergeClaim, false);
assert.equal(doc.metadata.targetProjections.claims.semanticEquivalenceClaim, false);
assert.equal(doc.metadata.universalAst.targetProjections.projectionLayerIds[0], 'target_layer_rust_ownership');
assert.equal(doc.metadata.universalAst.targetProjections.targets[0].projectionContracts[0].autoMergeClaim, false);
