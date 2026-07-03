import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const document = parseFrontierSource(`
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
`);

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
