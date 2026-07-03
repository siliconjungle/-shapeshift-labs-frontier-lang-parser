import assert from 'node:assert/strict';
import { parseFrontierSource } from '../src/index.js';

const source = `
module TargetProjectionAggregate @id("mod_target_projection_aggregate")
target rust @id("target_rust") {
  language rust
  package example_todo
  emitPath src/generated/todo.rs
  moduleFormat crate
  projection rustAdapter @id("target_projection_rust") disposition target-adapter readiness needs-review adapter rust_codegen represented semantic-symbol|source-map missing semantic-ownership evidence artifact_projection proof artifact_projection loss loss_borrow missingEvidence translation-borrow-scope:borrow-across-await
  layer ownership @id("target_layer_rust_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
}
`;

const doc = parseFrontierSource(source, { sourcePath: 'target-projection-aggregate.frontier' });

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

const contract = doc.nodes.target_rust.metadata.projectionContracts[0];
const layer = doc.nodes.target_rust.metadata.projectionLayers[0];
assert.equal(contract.sourceSpan.path, 'target-projection-aggregate.frontier');
assert.equal(contract.sourceSpan.sourceId, 'mod_target_projection_aggregate');
assert.equal(contract.sourceSpan.blockId, 'target_rust');
assert.equal(contract.sourceSpan.blockKind, 'target');
assert.equal(source.slice(contract.sourceSpan.startOffset, contract.sourceSpan.endOffset).startsWith('projection rustAdapter'), true);
assert.deepEqual(contract.authoredSourceSpan, contract.sourceSpan);
assert.equal(layer.sourceSpan.path, 'target-projection-aggregate.frontier');
assert.equal(layer.sourceSpan.blockId, 'target_rust');
assert.equal(source.slice(layer.sourceSpan.startOffset, layer.sourceSpan.endOffset).startsWith('layer ownership'), true);
assert.deepEqual(doc.metadata.targetProjections.projectionContracts[0].sourceSpan, contract.sourceSpan);
assert.deepEqual(doc.metadata.universalAst.targetProjections.projectionContracts[0].sourceSpan, contract.sourceSpan);
