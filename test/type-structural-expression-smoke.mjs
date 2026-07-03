import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `
module FrontierStructuralTypeProbe @id("mod_frontier_structural_type_probe")

type ApiError @id("type_api_error") {
  message: Text
}

type UserPatch @id("type_user_patch") {
  patch @id("field_patch"): Record<id: Text, displayName?: Text, audit @id("field_audit"): Record<actor: Text, at: Instant>>
  status @id("field_status"): Union<Pending, Applied(value: Record<version: Int, changed?: Boolean>), Failed(error: ApiError)>
}

entity Profile @id("ent_profile") {
  snapshot @id("field_snapshot"): Record<id: Text, displayName?: Text>
}

view PatchPanel @id("view_patch_panel") {
  prop status @id("view_prop_status"): Union<Pending, Applied(value: Record<version: Int>), Failed(error: ApiError)>
}
`;

const document = parseFrontierSource(source);
const report = inspectFrontierSourceSyntax(source, { sourcePath: 'structural-type-expressions.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.unknownChildCount, 0);

assert.deepEqual(document.nodes.type_user_patch.fields[0].type, {
  kind: 'record',
  fields: [
    { id: 'record_field_id', name: 'id', type: 'Text' },
    { id: 'record_field_displayName', name: 'displayName', type: 'Text', optional: true },
    {
      id: 'field_audit',
      name: 'audit',
      type: {
        kind: 'record',
        fields: [
          { id: 'record_field_actor', name: 'actor', type: 'Text' },
          { id: 'record_field_at', name: 'at', type: 'Instant' }
        ]
      }
    }
  ]
});

assert.deepEqual(document.nodes.type_user_patch.fields[1].type, {
  kind: 'union',
  variants: [
    { name: 'Pending' },
    {
      name: 'Applied',
      fields: [
        {
          id: 'variant_field_Applied_value',
          name: 'value',
          type: {
            kind: 'record',
            fields: [
              { id: 'record_field_version', name: 'version', type: 'Int' },
              { id: 'record_field_changed', name: 'changed', type: 'Boolean', optional: true }
            ]
          }
        }
      ]
    },
    {
      name: 'Failed',
      fields: [{ id: 'variant_field_Failed_error', name: 'error', type: 'ApiError' }]
    }
  ]
});

assert.deepEqual(document.nodes.ent_profile.fields[0].type, {
  kind: 'record',
  fields: [
    { id: 'record_field_id', name: 'id', type: 'Text' },
    { id: 'record_field_displayName', name: 'displayName', type: 'Text', optional: true }
  ]
});

assert.equal(document.nodes.view_patch_panel.props[0].type.kind, 'union');

const genericRef = parseFrontierSource(`
module FrontierGenericTypeProbe @id("mod_frontier_generic_type_probe")

type ResultHolder @id("type_result_holder") {
  result @id("field_result"): Result<Text, ApiError>
}
`);
assert.deepEqual(genericRef.nodes.type_result_holder.fields[0].type, {
  kind: 'ref',
  name: 'Result',
  args: ['Text', 'ApiError']
});

const malformedRecordSource = `
module FrontierMalformedRecordProbe @id("mod_frontier_malformed_record_probe")

type BrokenRecord @id("type_broken_record") {
  patch @id("field_patch"): Record<id Text>
}
`;
const malformedRecord = inspectFrontierSourceSyntax(malformedRecordSource, { sourcePath: 'malformed-record.frontier' });
assert.equal(malformedRecord.summary.failClosed, true);
assert.equal(malformedRecord.unknownChildren[0].reason, 'malformed-structural-record-field');
assert.equal(parseFrontierSource(malformedRecordSource).nodes.type_broken_record.fields[0].type, 'Record<id Text>');

const duplicateRecordSource = `
module FrontierDuplicateRecordProbe @id("mod_frontier_duplicate_record_probe")

type DuplicateRecord @id("type_duplicate_record") {
  patch @id("field_patch"): Record<id: Text, id: Json>
}
`;
const duplicateRecord = inspectFrontierSourceSyntax(duplicateRecordSource, { sourcePath: 'duplicate-record.frontier' });
assert.equal(duplicateRecord.summary.failClosed, true);
assert.equal(duplicateRecord.unknownChildren[0].reason, 'duplicate-structural-record-field-id');
assert.equal(parseFrontierSource(duplicateRecordSource).nodes.type_duplicate_record.fields[0].type, 'Record<id: Text, id: Json>');

const duplicateRecordNameSource = `
module FrontierDuplicateRecordNameProbe @id("mod_frontier_duplicate_record_name_probe")

type DuplicateRecordName @id("type_duplicate_record_name") {
  patch @id("field_patch"): Record<id @id("field_first"): Text, id @id("field_second"): Json>
}
`;
const duplicateRecordName = inspectFrontierSourceSyntax(duplicateRecordNameSource, { sourcePath: 'duplicate-record-name.frontier' });
assert.equal(duplicateRecordName.summary.failClosed, true);
assert.equal(duplicateRecordName.unknownChildren[0].reason, 'duplicate-structural-record-field-name');
assert.equal(parseFrontierSource(duplicateRecordNameSource).nodes.type_duplicate_record_name.fields[0].type, 'Record<id @id("field_first"): Text, id @id("field_second"): Json>');

const emptyUnionPayloadSource = `
module FrontierEmptyUnionPayloadProbe @id("mod_frontier_empty_union_payload_probe")

type EmptyUnionPayload @id("type_empty_union_payload") {
  status @id("field_status"): Union<Ready()>
}
`;
const emptyUnionPayload = inspectFrontierSourceSyntax(emptyUnionPayloadSource, { sourcePath: 'empty-union-payload.frontier' });
assert.equal(emptyUnionPayload.summary.failClosed, true);
assert.equal(emptyUnionPayload.unknownChildren[0].reason, 'empty-structural-union-variant-payload');
assert.equal(parseFrontierSource(emptyUnionPayloadSource).nodes.type_empty_union_payload.fields[0].type, 'Union<Ready()>');

const duplicateUnionPayloadSource = `
module FrontierDuplicateUnionPayloadProbe @id("mod_frontier_duplicate_union_payload_probe")

type DuplicateUnionPayload @id("type_duplicate_union_payload") {
  status @id("field_status"): Union<Ready(value: Text, value: Json)>
}
`;
const duplicateUnionPayload = inspectFrontierSourceSyntax(duplicateUnionPayloadSource, { sourcePath: 'duplicate-union-payload.frontier' });
assert.equal(duplicateUnionPayload.summary.failClosed, true);
assert.equal(duplicateUnionPayload.unknownChildren[0].reason, 'duplicate-structural-union-variant-field-id');
assert.equal(parseFrontierSource(duplicateUnionPayloadSource).nodes.type_duplicate_union_payload.fields[0].type, 'Union<Ready(value: Text, value: Json)>');

const duplicateUnionVariantSource = `
module FrontierDuplicateUnionVariantProbe @id("mod_frontier_duplicate_union_variant_probe")

type DuplicateUnionVariant @id("type_duplicate_union_variant") {
  status @id("field_status"): Union<Ready(value: Text), Ready(error: Json)>
}
`;
const duplicateUnionVariant = inspectFrontierSourceSyntax(duplicateUnionVariantSource, { sourcePath: 'duplicate-union-variant.frontier' });
assert.equal(duplicateUnionVariant.summary.failClosed, true);
assert.equal(duplicateUnionVariant.unknownChildren[0].reason, 'duplicate-structural-union-variant-name');
assert.equal(parseFrontierSource(duplicateUnionVariantSource).nodes.type_duplicate_union_variant.fields[0].type, 'Union<Ready(value: Text), Ready(error: Json)>');
