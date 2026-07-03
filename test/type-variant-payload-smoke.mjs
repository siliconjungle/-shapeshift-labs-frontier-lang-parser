import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module VariantPayloads @id("mod_variant_payloads") {
type LoadState @id("type_load_state") {
  variant Loading @id("variant_loading")
  variant Ready @id("variant_ready") (value: Text, stale?: Boolean, meta @id("variant_ready_meta"): Map<Text, Json>)
  variant Failed @id("variant_failed") (message @id("variant_failed_message"): Text)
}
}`;

const doc = parseFrontierSource(source);
assert.equal(doc.nodes.type_load_state.kind, 'type');
assert.equal(doc.nodes.type_load_state.fields, undefined);
assert.deepEqual(doc.nodes.type_load_state.variants, [
  { id: 'variant_loading', name: 'Loading' },
  {
    id: 'variant_ready',
    name: 'Ready',
    fields: [
      { id: 'variant_field_Ready_value', name: 'value', type: 'Text' },
      { id: 'variant_field_Ready_stale', name: 'stale', type: 'Boolean', optional: true },
      { id: 'variant_ready_meta', name: 'meta', type: { kind: 'map', key: 'Text', value: 'Json' } }
    ]
  },
  {
    id: 'variant_failed',
    name: 'Failed',
    fields: [
      { id: 'variant_failed_message', name: 'message', type: 'Text' }
    ]
  }
]);

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'variant-payloads.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.unknownChildCount, 0);
const typeBlock = report.recognizedBlocks.find((block) => block.id === 'type_load_state');
assert.equal(typeBlock.children.length, 3);
assert.equal(typeBlock.children[1].kind, 'typeVariant');
assert.equal(typeBlock.children[1].fieldCount, 3);
assert.deepEqual(typeBlock.children[1].fieldIds, ['value', 'stale', 'variant_ready_meta']);

const malformed = inspectFrontierSourceSyntax(`module MalformedVariantPayload @id("mod_malformed_variant_payload") {
type BrokenState @id("type_broken_state") {
  variant Broken @id("variant_broken") (value Text)
}
}`);
assert.equal(malformed.summary.failClosed, true);
assert.equal(malformed.unknownChildren[0].id, 'variant_broken');
assert.equal(malformed.unknownChildren[0].reason, 'malformed-type-variant-payload');

const duplicate = inspectFrontierSourceSyntax(`module DuplicateVariantField @id("mod_duplicate_variant_field") {
type DuplicateState @id("type_duplicate_state") {
  variant Ready @id("variant_ready") (value: Text, value: Json)
}
}`);
assert.equal(duplicate.summary.failClosed, true);
assert.equal(duplicate.unknownChildren[0].id, 'variant_ready');
assert.equal(duplicate.unknownChildren[0].reason, 'duplicate-type-variant-field-id');
