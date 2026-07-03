import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ActionBodyProbe @id("mod_action_body_probe") {
action AddTodo @id("action_add_todo") {
  input TodoInput
  returns Patch
  reads TodoDb.todos
  writes TodoDb.todos
  uses Clock
  throws ValidationError, StorageError
  body {
    set title @id("patch_set_title") path /todos/title value input.title
    insert item @id("patch_insert_item") path /todos value input
    merge meta @id("patch_merge_meta") path /todos/meta value "created"
    remove oldTitle @id("patch_remove_old_title") path /todos/oldTitle
    callEffect persist @id("effect_call_persist") capability storage.write input input
    return patches
  }
}
}`;

const doc = parseFrontierSource(source);
const action = doc.nodes.action_add_todo;
assert.equal(action.kind, 'action');
assert.equal(action.input, 'TodoInput');
assert.equal(action.returns, 'Patch');
assert.deepEqual(action.reads, ['TodoDb.todos']);
assert.deepEqual(action.writes, ['TodoDb.todos']);
assert.deepEqual(action.uses, ['Clock']);
assert.deepEqual(action.throws, ['ValidationError', 'StorageError']);
assert.equal(action.body.length, 6);
assert.deepEqual(action.body[0], {
  kind: 'patch',
  op: 'set',
  id: 'patch_set_title',
  name: 'title',
  path: '/todos/title',
  value: { expression: 'input.title' }
});
assert.deepEqual(action.body[2].value, { value: 'created' });
assert.equal(action.body[3].op, 'remove');
assert.equal(action.body[4].kind, 'callEffect');
assert.equal(action.body[4].capability, 'storage.write');
assert.deepEqual(action.body[4].input, { expression: 'input' });
assert.equal(action.body[5].kind, 'return');
assert.deepEqual(action.body[5].value, { expression: 'patches' });

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'action-body.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.childCount, 6);
assert.equal(report.summary.recognizedChildCount, 6);
assert.deepEqual(report.summary.recognizedChildKinds, ['actionBodyRow']);
const actionBlock = report.recognizedBlocks.find((block) => block.id === 'action_add_todo');
assert.ok(actionBlock);
assert.equal(actionBlock.children[0].id, 'patch_set_title');
assert.equal(actionBlock.children[0].sourceSpan.path, 'action-body.frontier');
assert.equal(actionBlock.children[0].sourceSpan.blockId, 'action_add_todo');
assert.equal(source.slice(actionBlock.children[0].startOffset, actionBlock.children[0].endOffset), 'set title @id("patch_set_title") path /todos/title value input.title');

const unsupported = inspectFrontierSourceSyntax(`module UnsupportedActionBody @id("mod_unsupported_action_body") {
action AddTodo @id("action_add_todo") {
  body {
    mutateEverything danger @id("unsupported_action_body_row") value unknown
  }
}
}`);
assert.equal(unsupported.summary.failClosed, true);
assert.equal(unsupported.summary.unknownChildCount, 1);
assert.equal(unsupported.unknownChildren[0].id, 'unsupported_action_body_row');
assert.equal(unsupported.unknownChildren[0].reason, 'unsupported-action-body-row');
