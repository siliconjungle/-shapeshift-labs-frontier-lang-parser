import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const source = `module CoreBlockRows @id("mod_core_block_rows") {
migration TodoV1ToV2 @id("migration_todo_v1_v2") {
  fromVersion 1
  toVersion 2
  change addField Todo.title
  change renameTitle @id("migration_change_rename_title") kind rename path /title statement "Rename the title field."
  invariants title_present
}
capability HttpRequest @id("cap_http_request") {
  capability http.request
  category network
  input Json
  returns Json
  resources HttpClient
  adapter fetch @id("cap_adapter_fetch") target javascript platform browser package undici kind native symbol fetch
  adapter typescript symbol fetch platform node package undici kind library
  unsupportedTarget wasm @id("cap_unsupported_wasm") reason "No socket capability."
}
}`;

const doc = parseFrontierSource(source, { sourcePath: 'core-block-rows.frontier' });
const migration = doc.nodes.migration_todo_v1_v2;
const capability = doc.nodes.cap_http_request;

assert.equal(migration.changes[0].id, 'change_0');
assert.equal(migration.changes[0].kind, 'addField');
assert.equal(migration.changes[0].target, 'Todo.title');
assert.equal(migration.changes[0].statement, 'Todo.title');
assert.equal(migration.changes[0].sourceSpan.path, 'core-block-rows.frontier');
assert.equal(migration.changes[0].sourceSpan.blockKind, 'migration');

assert.equal(migration.changes[1].id, 'migration_change_rename_title');
assert.equal(migration.changes[1].name, 'renameTitle');
assert.equal(migration.changes[1].kind, 'rename');
assert.equal(migration.changes[1].target, '/title');
assert.equal(migration.changes[1].path, '/title');
assert.equal(migration.changes[1].statement, 'Rename the title field.');
assert.equal(migration.changes[1].sourceSpan.path, 'core-block-rows.frontier');
assert.equal(source.slice(migration.changes[1].sourceSpan.startOffset, migration.changes[1].sourceSpan.endOffset).startsWith('change renameTitle'), true);

assert.equal(capability.adapters[0].id, 'cap_adapter_fetch');
assert.equal(capability.adapters[0].name, 'fetch');
assert.equal(capability.adapters[0].target.language, 'javascript');
assert.equal(capability.adapters[0].target.platform, 'browser');
assert.equal(capability.adapters[0].symbol, 'fetch');
assert.equal(capability.adapters[0].sourceSpan.blockKind, 'capability');

assert.equal(capability.adapters[1].name, 'typescript');
assert.equal(capability.adapters[1].target.language, 'typescript');
assert.equal(capability.adapters[1].symbol, 'fetch');

assert.equal(capability.unsupportedTargets[0].id, 'cap_unsupported_wasm');
assert.equal(capability.unsupportedTargets[0].name, 'wasm');
assert.equal(capability.unsupportedTargets[0].target.language, 'wasm');
assert.equal(capability.unsupportedTargets[0].reason, 'No socket capability.');
assert.equal(capability.unsupportedTargets[0].sourceSpan.path, 'core-block-rows.frontier');
