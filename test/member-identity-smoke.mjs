import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const duplicateEntityFieldNameSource = `module DuplicateEntityFieldName @id("mod_duplicate_entity_field_name") {
entity User @id("ent_user") {
  name @id("field_user_name"): Text
  name @id("field_user_display_name"): Json
}
}`;
const duplicateEntityFieldName = inspectFrontierSourceSyntax(duplicateEntityFieldNameSource);
assert.equal(duplicateEntityFieldName.summary.failClosed, true);
assert.equal(duplicateEntityFieldName.unknownChildren[0].id, 'field_user_display_name');
assert.equal(duplicateEntityFieldName.unknownChildren[0].reason, 'duplicate-entity-field-name');
assert.deepEqual(parseFrontierSource(duplicateEntityFieldNameSource).nodes.ent_user.fields, [
  { id: 'field_user_name', name: 'name', type: 'Text', key: false, merge: undefined, semantic: undefined }
]);

const duplicateEntityFieldIdSource = `module DuplicateEntityFieldId @id("mod_duplicate_entity_field_id") {
entity User @id("ent_user") {
  name @id("field_user_identity"): Text
  email @id("field_user_identity"): Text
}
}`;
const duplicateEntityFieldId = inspectFrontierSourceSyntax(duplicateEntityFieldIdSource);
assert.equal(duplicateEntityFieldId.summary.failClosed, true);
assert.equal(duplicateEntityFieldId.unknownChildren[0].reason, 'duplicate-entity-field-id');
assert.equal(parseFrontierSource(duplicateEntityFieldIdSource).nodes.ent_user.fields.length, 1);

const duplicateStateCollectionSource = `module DuplicateStateCollection @id("mod_duplicate_state_collection") {
state UserDb @id("state_user_db") {
  users @id("collection_users"): Map<Text, Json>
  users @id("collection_archived_users"): Map<Text, Json>
}
}`;
const duplicateStateCollection = inspectFrontierSourceSyntax(duplicateStateCollectionSource);
assert.equal(duplicateStateCollection.summary.failClosed, true);
assert.equal(duplicateStateCollection.unknownChildren[0].id, 'collection_archived_users');
assert.equal(duplicateStateCollection.unknownChildren[0].reason, 'duplicate-state-collection-name');
assert.equal(parseFrontierSource(duplicateStateCollectionSource).nodes.state_user_db.collections.length, 1);

const duplicateTypeFieldSource = `module DuplicateTypeField @id("mod_duplicate_type_field") {
type UserInput @id("type_user_input") {
  name @id("type_field_user_name"): Text
  displayName @id("type_field_user_name"): Text
}
}`;
const duplicateTypeField = inspectFrontierSourceSyntax(duplicateTypeFieldSource);
assert.equal(duplicateTypeField.summary.failClosed, true);
assert.equal(duplicateTypeField.unknownChildren[0].id, 'type_field_user_name');
assert.equal(duplicateTypeField.unknownChildren[0].reason, 'duplicate-type-field-id');
assert.deepEqual(parseFrontierSource(duplicateTypeFieldSource).nodes.type_user_input.fields, [
  { id: 'type_field_user_name', name: 'name', type: 'Text' }
]);
