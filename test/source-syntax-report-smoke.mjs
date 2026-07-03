import assert from 'node:assert/strict';
import { FrontierSourceBlockKinds, inspectFrontierSourceSyntax } from '../dist/index.js';

const syntaxReport = inspectFrontierSourceSyntax(`module SyntaxProbe @id("mod_syntax_probe") {
entity Todo @id("ent_todo") {
  title @id("field_title"): Text
}
view TodoView @id("view_todo") {
  render Button @id("render_todo_button") {
    text "Save"
  }
}
futureSurface Experimental @id("future_surface") {
  value test
}
}
possibilitySpace ProjectionSpace @id("space_projection") {
  subject ent_todo
  target rust
}`);

assert.equal(syntaxReport.kind, 'frontier.lang.sourceSyntaxReport');
assert.equal(syntaxReport.documentId, 'mod_syntax_probe');
assert.equal(syntaxReport.summary.blockCount, 4);
assert.equal(syntaxReport.summary.recognizedBlockCount, 3);
assert.equal(syntaxReport.summary.unknownBlockCount, 1);
assert.equal(syntaxReport.summary.failClosed, true);
assert.equal(syntaxReport.summary.unsupportedSyntax, true);
assert.deepEqual(syntaxReport.summary.unknownKinds, ['futureSurface']);
assert.equal(syntaxReport.unknownBlocks[0].id, 'future_surface');
assert.equal(syntaxReport.unknownBlocks[0].moduleId, 'mod_syntax_probe');
assert.equal(syntaxReport.unknownBlocks[0].reason, 'unsupported-top-level-block');
assert.equal(syntaxReport.blocks.some((block) => block.kind === 'render'), false);
assert.equal(syntaxReport.recognizedBlocks.some((block) => block.kind === 'possibilitySpace'), true);
assert.equal(syntaxReport.metadata.autoMergeClaim, false);
assert.equal(syntaxReport.metadata.semanticEquivalenceClaim, false);
assert.equal(FrontierSourceBlockKinds.includes('semanticResourceGraph'), true);
