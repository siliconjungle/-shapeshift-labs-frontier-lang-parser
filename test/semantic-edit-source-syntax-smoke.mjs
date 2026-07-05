import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const operationsSource = `module SemanticEditOperationRows @id("mod_semantic_edit_operation_rows") {
operations MergeOps @id("semantic_ops_merge") {
  op renameUser @id("op_rename_user") kind semantic-edit language frontier sourcePath semantic-edit.frontier semanticKey function:renameUser evidence evidence_replay
  semanticOperation renameTitle @id("op_rename_title") kind semantic-edit language frontier sourcePath semantic-edit.frontier semanticKey field:Todo.title evidence evidence_replay
}
}`;

const operationsReport = inspectFrontierSourceSyntax(operationsSource, { sourcePath: 'semantic-edit-ops.frontier' });
const operationCounts = operationsReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.operations;

assert.equal(operationsReport.summary.failClosed, false);
assert.equal(operationCounts.operation, 2);

const operationsBlock = operationsReport.recognizedBlocks.find((block) => block.id === 'semantic_ops_merge');
const opRow = operationsBlock.children.find((child) => child.rowKind === 'op');
const semanticOperationRow = operationsBlock.children.find((child) => child.rowKind === 'semanticOperation');
assert.equal(opRow.normalizedRowKind, 'operation');
assert.equal(semanticOperationRow.normalizedRowKind, 'operation');
assert.equal(semanticOperationRow.sourceSpan.path, 'semantic-edit-ops.frontier');
assert.equal(semanticOperationRow.sourceSpan.blockKind, 'operations');

const operationsDoc = parseFrontierSource(operationsSource, { sourcePath: 'semantic-edit-ops.frontier' });
assert.equal(operationsDoc.metadata.semanticOperations.operations.length, 2);
assert.equal(operationsDoc.metadata.semanticOperations.operations[1].id, 'op_rename_title');
assert.equal(operationsDoc.metadata.semanticOperations.operations[1].semanticKey, 'field:Todo.title');

const unknownOperation = inspectFrontierSourceSyntax(`module UnknownSemanticOperationRows @id("mod_unknown_semantic_operation_rows") {
operations BrokenOps @id("ops_broken") {
  patchPlan rename @id("op_patch_plan")
}
}`);

assert.equal(unknownOperation.summary.failClosed, true);
assert.equal(unknownOperation.summary.unknownChildCount, 1);
assert.equal(unknownOperation.summary.sourceSyntaxRowFamilyCounts.patchPlan, 1);
assert.equal(unknownOperation.unknownChildren[0].reason, 'unsupported-semantic-operation-row');

const recordsSource = `module SemanticEditRecordRows @id("mod_semantic_edit_record_rows") {
semanticEdits MergeEdits @id("semantic_edits_merge") {
  semanticEditScript renameUser @id("script_rename") language frontier sourcePath semantic-edit.frontier status ready operation op_rename semanticKey function:renameUser evidence evidence_replay
  semanticEditProjection renameUserProjection @id("projection_rename") script script_rename language frontier sourcePath semantic-edit.frontier status projected edit op_rename semanticKey function:renameUser evidence evidence_replay
  semanticEditReplay renameUserReplay @id("replay_rename") script script_rename projection projection_rename language frontier sourcePath semantic-edit.frontier status accepted-clean action apply edit op_rename semanticKey function:renameUser evidence evidence_replay
}
}`;

const recordsReport = inspectFrontierSourceSyntax(recordsSource, { sourcePath: 'semantic-edit-records.frontier' });
const recordCounts = recordsReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.semanticEdits;

assert.equal(recordsReport.summary.failClosed, false);
assert.equal(recordCounts.script, 1);
assert.equal(recordCounts.projection, 1);
assert.equal(recordCounts.replay, 1);

const recordsBlock = recordsReport.recognizedBlocks.find((block) => block.id === 'semantic_edits_merge');
assert.equal(recordsBlock.children[0].normalizedRowKind, 'script');
assert.equal(recordsBlock.children[1].normalizedRowKind, 'projection');
assert.equal(recordsBlock.children[2].normalizedRowKind, 'replay');
assert.equal(recordsBlock.children[0].sourceSpan.path, 'semantic-edit-records.frontier');
assert.equal(recordsBlock.children[0].sourceSpan.blockKind, 'semanticEdits');

const recordsDoc = parseFrontierSource(recordsSource, { sourcePath: 'semantic-edit-records.frontier' });
assert.equal(recordsDoc.metadata.semanticEditRecords.scriptIds[0], 'script_rename');
assert.equal(recordsDoc.metadata.semanticEditRecords.projectionIds[0], 'projection_rename');
assert.equal(recordsDoc.metadata.semanticEditRecords.replayIds[0], 'replay_rename');
assert.equal(recordsDoc.metadata.semanticEditRecords.operationIds[0], 'op_rename');

const unknownRecord = inspectFrontierSourceSyntax(`module UnknownSemanticEditRows @id("mod_unknown_semantic_edit_rows") {
semanticEdits BrokenEdits @id("edits_broken") {
  scriptPatch rename @id("script_patch")
}
}`);

assert.equal(unknownRecord.summary.failClosed, true);
assert.equal(unknownRecord.summary.unknownChildCount, 1);
assert.equal(unknownRecord.summary.sourceSyntaxRowFamilyCounts.scriptPatch, 1);
assert.equal(unknownRecord.unknownChildren[0].reason, 'unsupported-semantic-edit-record-row');
