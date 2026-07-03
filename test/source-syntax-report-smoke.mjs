import assert from 'node:assert/strict';
import { FrontierSourceBlockKinds, inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const syntaxReport = inspectFrontierSourceSyntax(`module SyntaxProbe @id("mod_syntax_probe") {
entity Todo @id("ent_todo") {
  title @id("field_title"): Text
}
view TodoView @id("view_todo") {
  render Button @id("render_todo_button") {
    text "{"
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
assert.equal(syntaxReport.summary.malformedBlockCount, 0);
assert.equal(syntaxReport.summary.diagnosticCount, 0);
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

const malformedReport = inspectFrontierSourceSyntax(`module Broken @id("mod_broken") {
entity Todo @id("ent_todo") {
  title: Text
`);

assert.equal(malformedReport.summary.failClosed, true);
assert.equal(malformedReport.summary.malformedBlockCount, 1);
assert.equal(malformedReport.summary.diagnosticCount, 2);
assert.equal(malformedReport.blocks[0].malformed, true);
assert.equal(malformedReport.blocks[0].diagnostics[0].reason, 'unterminated-block');
assert.deepEqual(malformedReport.diagnostics.map((diagnostic) => diagnostic.reason), [
  'unterminated-block',
  'unterminated-block'
]);

const unicodeSource = `module Cafe @id("mod_cafe") {
entity Café @id("ent_cafe") {
}
}`;
const unicodeReport = inspectFrontierSourceSyntax(unicodeSource);
assert.equal(unicodeReport.metadata.sourceBytes, new TextEncoder().encode(unicodeSource).length);

const robustParseDoc = parseFrontierSource(`module RobustParse @id("mod_robust_parse") {
view Detail @id("view_detail") {
  render Label @id("render_detail_label") {
    text "}"
    prop marker "{literal}"
    # { ignored by the nested block scanner
  }
}
action Save @id("action_save") {
  input TodoInput
}
}`);

assert.equal(robustParseDoc.nodes.view_detail.renders[0].text, '}');
assert.equal(robustParseDoc.nodes.view_detail.renders[0].props[0].value, '{literal}');
assert.equal(robustParseDoc.nodes.action_save.name, 'Save');

const conversionSyntaxSource = `module ConversionSyntaxProbe @id("mod_conversion_syntax_probe") {
conversion JsToRust @id("conversion_js_rust") {
  sourceLanguage javascript
  target rust
  constraint type publicApi @id("type_constraint_public_api") role source kind public-function symbol symbol:addTodo evidence evidence_type
  constraint resourceTransfer todoStore @id("resource_transfer_todo_store") role source kind owner resource TodoStore evidence evidence_resource
}
}`;
const conversionSyntaxReport = inspectFrontierSourceSyntax(conversionSyntaxSource, { sourcePath: 'conversion-syntax.frontier' });
const conversionBlock = conversionSyntaxReport.recognizedBlocks.find((block) => block.id === 'conversion_js_rust');
assert.equal(conversionSyntaxReport.summary.childCount, 2);
assert.equal(conversionSyntaxReport.summary.recognizedChildCount, 2);
assert.deepEqual(conversionSyntaxReport.summary.recognizedChildKinds, ['conversionConstraint']);
assert.equal(conversionBlock.children[0].kind, 'conversionConstraint');
assert.equal(conversionBlock.children[0].family, 'type');
assert.equal(conversionBlock.children[0].id, 'type_constraint_public_api');
assert.equal(conversionBlock.children[0].sourceSpan.path, 'conversion-syntax.frontier');
assert.equal(conversionBlock.children[0].sourceSpan.sourceId, 'mod_conversion_syntax_probe');
assert.equal(conversionBlock.children[0].sourceSpan.blockId, 'conversion_js_rust');
assert.equal(conversionSyntaxSource.slice(conversionBlock.children[0].startOffset, conversionBlock.children[0].endOffset).startsWith('constraint type publicApi'), true);
