import assert from 'node:assert/strict';
import { parseFrontierSource } from '../src/index.js';

const source = `
module TargetProjectionAggregate @id("mod_target_projection_aggregate")
target rust @id("target_rust") {
  targetLanguage rust
  source frontier
  packageName example_todo
  targetPath src/generated/todo.rs
  path src/todo.frontier
  sourceHash sha256:frontier
  targetHash sha256:rust
  runtime native
  runtimeHost rust-cli
  moduleFormat crate
  status partial
  readiness needs-review
  projection rustAdapter @id("target_projection_rust") disposition target-adapter readiness needs-review adapter rust_codegen represented semantic-symbol|source-map missing semantic-ownership evidence artifact_projection proof artifact_projection loss loss_borrow missingEvidence translation-borrow-scope:borrow-across-await
  layer ownership @id("target_layer_rust_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
  proofEvidence projectionRun @id("artifact_projection") kind conversion-replay-proof status passed path reports/projection.json command "npm run projection:rust" sourceHash sha256:frontier targetHash sha256:rust
  sourceMap generatedRust @id("target_sourcemap_rust") sourcePath src/todo.frontier targetPath src/generated/todo.rs sourceHash sha256:frontier targetHash sha256:rust evidence artifact_projection
  loss borrowScope @id("loss_borrow") kind ownership severity warning evidence artifact_projection
  gap runtimeProbe @id("target_gap_runtime_probe") code runtime-proof-missing status missing missingEvidence browser-runtime-proof
}
`;

const doc = parseFrontierSource(source, { sourcePath: 'target-projection-aggregate.frontier' });

assert.equal(doc.nodes.target_rust.metadata.projectionContracts[0].id, 'target_projection_rust');
assert.equal(doc.metadata.targetProjections.targets[0].target.language, 'rust');
assert.equal(doc.metadata.targetProjections.targets[0].target.sourceLanguage, 'frontier');
assert.equal(doc.metadata.targetProjections.targets[0].target.sourcePath, 'src/todo.frontier');
assert.equal(doc.metadata.targetProjections.targets[0].target.sourceHash, 'sha256:frontier');
assert.equal(doc.metadata.targetProjections.targets[0].target.targetHash, 'sha256:rust');
assert.equal(doc.metadata.targetProjections.targets[0].target.runtime, 'native');
assert.equal(doc.metadata.targetProjections.targets[0].target.runtimeHost, 'rust-cli');
assert.equal(doc.metadata.targetProjections.targets[0].target.emitPath, 'src/generated/todo.rs');
assert.equal(doc.metadata.targetProjections.targets[0].projectionContracts[0].targetId, 'target_rust');
assert.equal(doc.metadata.targetProjections.projectionContractIds[0], 'target_projection_rust');
assert.equal(doc.metadata.targetProjections.targetEvidenceIds[0], 'artifact_projection');
assert.equal(doc.metadata.targetProjections.targetSourceMapIds[0], 'target_sourcemap_rust');
assert.equal(doc.metadata.targetProjections.targetLossIds[0], 'loss_borrow');
assert.equal(doc.metadata.targetProjections.targetProofGapIds[0], 'target_gap_runtime_probe');
assert.equal(doc.metadata.targetProjections.proofGapCodes[0], 'runtime-proof-missing');
assert.equal(doc.metadata.targetProjections.proofEvidenceIds[0], 'artifact_projection');
assert.equal(doc.metadata.targetProjections.claims.autoMergeClaim, false);
assert.equal(doc.metadata.targetProjections.claims.semanticEquivalenceClaim, false);
assert.equal(doc.metadata.universalAst.targetProjections.projectionLayerIds[0], 'target_layer_rust_ownership');
assert.equal(doc.metadata.universalAst.targetProjections.targets[0].projectionContracts[0].autoMergeClaim, false);

const contract = doc.nodes.target_rust.metadata.projectionContracts[0];
const layer = doc.nodes.target_rust.metadata.projectionLayers[0];
const evidence = doc.nodes.target_rust.metadata.targetEvidence[0];
const sourceMap = doc.nodes.target_rust.metadata.targetSourceMaps[0];
const loss = doc.nodes.target_rust.metadata.targetLosses[0];
const gap = doc.nodes.target_rust.metadata.targetProofGaps[0];
assert.equal(contract.sourceSpan.path, 'target-projection-aggregate.frontier');
assert.equal(contract.sourceSpan.sourceId, 'mod_target_projection_aggregate');
assert.equal(contract.sourceSpan.blockId, 'target_rust');
assert.equal(contract.sourceSpan.blockKind, 'target');
assert.equal(source.slice(contract.sourceSpan.startOffset, contract.sourceSpan.endOffset).startsWith('projection rustAdapter'), true);
assert.deepEqual(contract.authoredSourceSpan, contract.sourceSpan);
assert.equal(layer.sourceSpan.path, 'target-projection-aggregate.frontier');
assert.equal(layer.sourceSpan.blockId, 'target_rust');
assert.equal(source.slice(layer.sourceSpan.startOffset, layer.sourceSpan.endOffset).startsWith('layer ownership'), true);
assert.equal(evidence.status, 'passed');
assert.equal(evidence.command, 'npm run projection:rust');
assert.equal(sourceMap.targetHash, 'sha256:rust');
assert.equal(loss.lossKind, 'ownership');
assert.equal(gap.failClosed, true);
assert.equal(source.slice(gap.sourceSpan.startOffset, gap.sourceSpan.endOffset).startsWith('gap runtimeProbe'), true);
assert.deepEqual(doc.metadata.targetProjections.projectionContracts[0].sourceSpan, contract.sourceSpan);
assert.deepEqual(doc.metadata.universalAst.targetProjections.projectionContracts[0].sourceSpan, contract.sourceSpan);
