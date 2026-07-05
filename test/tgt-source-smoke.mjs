import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax } from '../dist/index.js';

const targetRowsReport = inspectFrontierSourceSyntax(`module TargetRows @id("mod_target_rows") {
target typescript @id("target_ts") {
  targetLanguage typescript
  package todo-ui
  targetPath src/generated/todo.ts
  path src/todo.frontier
  sourceHash sha256:source
  targetHash sha256:target
  runtime browser
  runtimeHost web
  moduleFormat esm
  projection reactAdapter @id("target_projection_react") readiness ready evidence evidence_projection
  lower emitTs @id("target_lower_ts") adapter ts_codegen proofEvidence evidence_projection
  layer view @id("target_layer_view") kind ui status represented
  proofEvidence projectionRun @id("target_evidence_projection") kind gate status passed
  sourceMap generated @id("target_source_map") generated src/generated/todo.ts
  loss closure @id("target_loss_closure") kind runtime
  gap runtime @id("target_gap_runtime") code target-runtime-proof
}
}`, { sourcePath: 'target-rows.frontier' });

const targetCounts = targetRowsReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.target;

assert.equal(targetRowsReport.summary.failClosed, false);
assert.equal(targetCounts.language, 1);
assert.equal(targetCounts.packageName, 1);
assert.equal(targetCounts.emitPath, 1);
assert.equal(targetCounts.sourcePath, 1);
assert.equal(targetCounts.sourceHash, 1);
assert.equal(targetCounts.targetHash, 1);
assert.equal(targetCounts.runtime, 1);
assert.equal(targetCounts.runtimeHost, 1);
assert.equal(targetCounts.moduleFormat, 1);
assert.equal(targetCounts.projection, 1);
assert.equal(targetCounts.lowering, 1);
assert.equal(targetCounts.layer, 1);
assert.equal(targetCounts.evidence, 1);
assert.equal(targetCounts.sourceMap, 1);
assert.equal(targetCounts.loss, 1);
assert.equal(targetCounts.proofGap, 1);

const targetBlock = targetRowsReport.recognizedBlocks.find((block) => block.id === 'target_ts');
const languageRow = targetBlock.children.find((child) => child.rowKind === 'targetLanguage');
const packageRow = targetBlock.children.find((child) => child.rowKind === 'package');
const targetPathRow = targetBlock.children.find((child) => child.rowKind === 'targetPath');
const pathRow = targetBlock.children.find((child) => child.rowKind === 'path');
const lowerRow = targetBlock.children.find((child) => child.rowKind === 'lower');
const proofEvidenceRow = targetBlock.children.find((child) => child.rowKind === 'proofEvidence');

assert.equal(languageRow.normalizedRowKind, 'language');
assert.equal(packageRow.normalizedRowKind, 'packageName');
assert.equal(targetPathRow.normalizedRowKind, 'emitPath');
assert.equal(pathRow.normalizedRowKind, 'sourcePath');
assert.equal(lowerRow.normalizedRowKind, 'lowering');
assert.equal(proofEvidenceRow.normalizedRowKind, 'evidence');
assert.equal(pathRow.sourceSpan.path, 'target-rows.frontier');
assert.equal(pathRow.sourceSpan.blockKind, 'target');

const unknownTargetRowsReport = inspectFrontierSourceSyntax(`module UnknownTargetRows @id("mod_unknown_target_rows") {
target rust @id("target_rust") {
  shaderStage vertex @id("target_shader_stage")
}
}`);

assert.equal(unknownTargetRowsReport.summary.failClosed, true);
assert.equal(unknownTargetRowsReport.summary.unknownChildCount, 1);
assert.equal(unknownTargetRowsReport.summary.sourceSyntaxRowFamilyCounts.shaderStage, 1);
assert.equal(unknownTargetRowsReport.unknownChildren[0].reason, 'unsupported-target-projection-row');
