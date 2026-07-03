import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierFile } from '../dist/index.js';

const source = `module SemanticEditRecords @id("mod_semantic_edit_records")

semanticEdits MergeEdits @id("semantic_edits_merge") {
  script renameUser @id("script_rename") language frontier target rust sourcePath semantic-edit.frontier targetPath src/generated/user.rs route conversion_frontier_to_rust status ready operation op_rename semanticKey function:renameUser semanticIdentityHash semantic_hash sourceIdentityHash source_hash operationContentHash op_hash editContentHash edit_hash baseHash base_hash workerHash worker_hash headHash head_hash sourceBackprojection exact-source sourceMap source_map_user sourceMapLink source_map_link_user sourceMapMapping source_map_mapping_user evidence evidence_replay ownerKey symbol:renameUser conflictKey semantic-edit.frontier:renameUser reasonCode route-bound summary "Script evidence only."
  projection renameUserProjection @id("projection_rename") script script_rename language frontier target rust sourcePath semantic-edit.frontier targetPath src/generated/user.rs route conversion_frontier_to_rust status projected edit op_rename semanticKey function:renameUser semanticIdentityHash semantic_hash sourceIdentityHash source_hash operationContentHash op_hash editContentHash edit_hash projectedHash projected_hash sourceMap source_map_user sourceMapLink source_map_link_user sourceMapMapping source_map_mapping_user evidence evidence_replay reasonCode projected
  replay renameUserReplay @id("replay_rename") script script_rename projection projection_rename language frontier target rust sourcePath semantic-edit.frontier route conversion_frontier_to_rust status accepted-clean action apply currentHash current_hash outputHash output_hash edit op_rename semanticKey function:renameUser semanticIdentityHash semantic_hash sourceIdentityHash source_hash operationContentHash op_hash editContentHash edit_hash reasonCode clean evidence evidence_replay
}
`;

const syntax = inspectFrontierSourceSyntax(source, { sourcePath: 'semantic-edit.frontier' });
assert.equal(syntax.summary.failClosed, false);
assert.equal(syntax.summary.recognizedKinds.includes('semanticEdits'), true);
assert.equal(syntax.summary.recognizedChildKinds.includes('semanticEditRecordRow'), true);
assert.equal(syntax.recognizedBlocks[0].children.length, 3);
assert.equal(syntax.recognizedBlocks[0].children[0].normalizedRowKind, 'script');
assert.equal(syntax.recognizedBlocks[0].children[1].normalizedRowKind, 'projection');
assert.equal(syntax.recognizedBlocks[0].children[2].normalizedRowKind, 'replay');

const doc = parseFrontierFile('semantic-edit.frontier', source);
const records = doc.metadata.semanticEditRecords;
assert.equal(records.id, 'semantic_edits_merge');
assert.equal(records.scriptIds[0], 'script_rename');
assert.equal(records.projectionIds[0], 'projection_rename');
assert.equal(records.replayIds[0], 'replay_rename');
assert.equal(records.operationIds.includes('op_rename'), true);
assert.equal(records.evidenceIds.includes('evidence_replay'), true);
assert.equal(records.sourceMapIds.includes('source_map_user'), true);
assert.equal(records.sourceMapLinkIds.includes('source_map_link_user'), true);
assert.equal(records.sourceMapMappingIds.includes('source_map_mapping_user'), true);
assert.equal(records.claims.autoMergeClaim, false);
assert.equal(records.claims.semanticEquivalenceClaim, false);
assert.equal(records.summary.scriptCount, 1);
assert.equal(records.summary.projectionCount, 1);
assert.equal(records.summary.replayCount, 1);

const script = records.scripts[0];
assert.equal(script.kind, 'frontier.lang.semanticEditScript');
assert.equal(script.operations[0].id, 'op_rename');
assert.equal(script.operations[0].semanticKey, 'function:renameUser');
assert.equal(script.operations[0].semanticIdentityHash, 'semantic_hash');
assert.equal(script.operations[0].sourceIdentityHash, 'source_hash');
assert.equal(script.operations[0].operationContentHash, 'op_hash');
assert.equal(script.operations[0].editContentHash, 'edit_hash');
assert.equal(script.admission.autoMergeClaim, false);
assert.equal(script.metadata.sourceBackprojectionMode, 'exact-source');
assert.equal(script.sourceSpan.path, 'semantic-edit.frontier');
assert.equal(script.sourceSpan.blockId, 'semantic_edits_merge');

const projection = records.projections[0];
assert.equal(projection.kind, 'frontier.lang.semanticEditProjection');
assert.equal(projection.scriptId, 'script_rename');
assert.equal(projection.status, 'projected');
assert.equal(projection.edits[0].operationId, 'op_rename');
assert.equal(projection.edits[0].editContentHash, 'edit_hash');

const replay = records.replays[0];
assert.equal(replay.kind, 'frontier.lang.semanticEditReplay');
assert.equal(replay.scriptId, 'script_rename');
assert.equal(replay.projectionId, 'projection_rename');
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.admission.action, 'apply');
assert.equal(replay.currentHash, 'current_hash');
assert.equal(replay.outputHash, 'output_hash');
assert.equal(replay.edits[0].reasonCodes[0], 'clean');
assert.equal(replay.appliedOperations[0], 'op_rename');
