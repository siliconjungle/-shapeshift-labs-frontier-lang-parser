import assert from 'node:assert/strict';
import { parseFrontierSource } from '../src/index.js';

const source = `
module SemanticEditOperations @id("mod_semantic_edit_operations")
operations MergeOps @id("semantic_ops_merge") {
  operation renameUser @id("op_rename_user") op semantic-edit language typescript target rust sourcePath src/user.ts targetPath src/user.rs route conversion_typescript_to_rust semanticKey function:renameUser semanticIdentityHash semantic_hash sourceIdentityHash source_hash operationContentHash op_hash editContentHash edit_hash semanticEditScript script_rename semanticEditProjection projection_rename semanticEditReplay replay_rename replayStatus accepted-clean replayAction apply replayCurrentHash current_hash replayOutputHash output_hash admissionStatus ready admissionAction admit admissionReadiness ready semanticTransform transform_rename transformKey semantic-transform:typescript->rust:function:renameUser transformIdentityHash transform_hash transformContentHash transform_content_hash projectionIdentityHash projection_hash sourceBackprojection exact-source sourceMap source_map_user sourceMapLink source_map_link_user sourceMapMapping source_map_mapping_user evidence evidence_replay ownerKey symbol:renameUser conflictKey src/user.ts:renameUser readiness ready
  operation renameTitle @id("op_rename_title") kind edit language typescript sourcePath src/todo.ts semanticKey field:Todo.title editScript edit_script_rename_title patch patch_rename_title patchHash sha256:patch editScriptHash sha256:edit-script baseHash sha256:base targetHash sha256:target projectionContract target_projection_ts projectionLayer target_layer_ts targetProjection target_projection_contract projectionHash sha256:projection replayRecord replay_rename_title replayEvent event_rename_title finalHash sha256:final replayHash sha256:replay deterministic replayComplete admissionDecision admission_title_safe semanticMergeCandidate candidate_title_safe classification safe decision merge autoMergeable transform rename-symbol transformHash sha256:transform identityHash sha256:identity conflictKeyKind symbol evidence evidence_replay readiness ready
}
`;

const doc = parseFrontierSource(source, { sourcePath: 'semantic-edit-operations.frontier' });
const operation = doc.metadata.semanticOperations.operations[0];
const canonical = doc.metadata.semanticOperations.operations[1];

assert.equal(operation.id, 'op_rename_user');
assert.equal(operation.operationKind, 'semantic-edit');
assert.equal(operation.sourcePath, 'src/user.ts');
assert.equal(operation.targetPath, 'src/user.rs');
assert.equal(operation.routeId, 'conversion_typescript_to_rust');
assert.equal(operation.semanticKey, 'function:renameUser');
assert.equal(operation.semanticIdentityHash, 'semantic_hash');
assert.equal(operation.sourceIdentityHash, 'source_hash');
assert.equal(operation.operationContentHash, 'op_hash');
assert.equal(operation.editContentHash, 'edit_hash');
assert.equal(operation.semanticEditScriptId, 'script_rename');
assert.equal(operation.semanticEditProjectionId, 'projection_rename');
assert.equal(operation.semanticEditReplayId, 'replay_rename');
assert.equal(operation.replayStatus, 'accepted-clean');
assert.equal(operation.replayAction, 'apply');
assert.equal(operation.replayCurrentHash, 'current_hash');
assert.equal(operation.replayOutputHash, 'output_hash');
assert.equal(operation.admissionStatus, 'ready');
assert.equal(operation.admissionAction, 'admit');
assert.equal(operation.admissionReadiness, 'ready');
assert.equal(operation.semanticTransformId, 'transform_rename');
assert.equal(operation.transformKey, 'semantic-transform:typescript->rust:function:renameUser');
assert.equal(operation.transformIdentityHash, 'transform_hash');
assert.equal(operation.transformContentHash, 'transform_content_hash');
assert.equal(operation.projectionIdentityHash, 'projection_hash');
assert.equal(operation.sourceBackprojectionMode, 'exact-source');
assert.deepEqual(operation.sourceBackprojection, { mode: 'exact-source' });
assert.deepEqual(operation.sourceMapIds, ['source_map_user']);
assert.deepEqual(operation.sourceMapLinkIds, ['source_map_link_user']);
assert.deepEqual(operation.sourceMapMappingIds, ['source_map_mapping_user']);
assert.deepEqual(operation.evidenceIds, ['evidence_replay']);
assert.deepEqual(operation.ownershipKeys, ['symbol:renameUser']);
assert.deepEqual(operation.conflictKeys, ['src/user.ts:renameUser']);
assert.equal(operation.sourceSpan.path, 'semantic-edit-operations.frontier');
assert.equal(operation.sourceSpan.sourceId, 'mod_semantic_edit_operations');
assert.equal(operation.sourceSpan.blockId, 'semantic_ops_merge');
assert.equal(operation.sourceSpan.blockKind, 'operations');
assert.equal(source.slice(operation.sourceSpan.startOffset, operation.sourceSpan.endOffset).startsWith('operation renameUser'), true);
assert.deepEqual(operation.authoredSourceSpan, operation.sourceSpan);

assert.equal(canonical.id, 'op_rename_title');
assert.equal(canonical.operationKind, 'edit');
assert.deepEqual(canonical.editScriptIds, ['edit_script_rename_title']);
assert.deepEqual(canonical.patchIds, ['patch_rename_title']);
assert.equal(canonical.patchHash, 'sha256:patch');
assert.equal(canonical.editScriptHash, 'sha256:edit-script');
assert.equal(canonical.baseHash, 'sha256:base');
assert.equal(canonical.targetHash, 'sha256:target');
assert.deepEqual(canonical.projectionContractIds, ['target_projection_ts']);
assert.deepEqual(canonical.projectionLayerIds, ['target_layer_ts']);
assert.deepEqual(canonical.targetProjectionIds, ['target_projection_contract']);
assert.equal(canonical.projectionHash, 'sha256:projection');
assert.deepEqual(canonical.replayRecordIds, ['replay_rename_title']);
assert.deepEqual(canonical.replayEventIds, ['event_rename_title']);
assert.equal(canonical.finalHash, 'sha256:final');
assert.equal(canonical.replayHash, 'sha256:replay');
assert.equal(canonical.deterministic, true);
assert.equal(canonical.replayComplete, true);
assert.deepEqual(canonical.admissionDecisionIds, ['admission_title_safe']);
assert.deepEqual(canonical.semanticMergeCandidateIds, ['candidate_title_safe']);
assert.equal(canonical.classification, 'safe');
assert.equal(canonical.decision, 'merge');
assert.equal(canonical.autoMergeable, true);
assert.equal(canonical.transformId, 'rename-symbol');
assert.equal(canonical.transformHash, 'sha256:transform');
assert.equal(canonical.identityHash, 'sha256:identity');
assert.deepEqual(canonical.conflictKeyKinds, ['symbol']);
assert.equal(canonical.sourceSpan.path, 'semantic-edit-operations.frontier');
assert.equal(source.slice(canonical.sourceSpan.startOffset, canonical.sourceSpan.endOffset).startsWith('operation renameTitle'), true);
assert.deepEqual(canonical.authoredSourceSpan, canonical.sourceSpan);
