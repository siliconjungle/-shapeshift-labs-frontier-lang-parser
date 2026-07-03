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
    let normalized_title @id("bind_normalized_title") value input.title
    set title @id("patch_set_title") path /todos/title value normalized_title
    if valid @id("guard_valid_title") condition input.enabled {
      let status_text @id("bind_status_text") value "ready"
      set status @id("patch_set_status") path /todos/status value status_text
      callEffect persistWhenValid @id("effect_call_valid_persist") capability storage.write input input
    }
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
assert.equal(action.body.length, 8);
assert.deepEqual(action.body[0], {
  kind: 'let',
  id: 'bind_normalized_title',
  name: 'normalized_title',
  value: { expression: 'input.title' }
});
assert.deepEqual(action.body[1], {
  kind: 'patch',
  op: 'set',
  id: 'patch_set_title',
  name: 'title',
  path: '/todos/title',
  value: { expression: 'normalized_title' }
});
assert.equal(action.body[2].kind, 'if');
assert.equal(action.body[2].id, 'guard_valid_title');
assert.equal(action.body[2].name, 'valid');
assert.deepEqual(action.body[2].condition, { expression: 'input.enabled' });
assert.equal(action.body[2].body.length, 3);
assert.deepEqual(action.body[2].body[0], {
  kind: 'let',
  id: 'bind_status_text',
  name: 'status_text',
  value: { value: 'ready' }
});
assert.equal(action.body[2].body[1].id, 'patch_set_status');
assert.deepEqual(action.body[2].body[1].value, { expression: 'status_text' });
assert.equal(action.body[2].body[2].kind, 'callEffect');
assert.equal(action.body[2].body[2].capability, 'storage.write');
assert.deepEqual(action.body[4].value, { value: 'created' });
assert.equal(action.body[5].op, 'remove');
assert.equal(action.body[6].kind, 'callEffect');
assert.equal(action.body[6].capability, 'storage.write');
assert.deepEqual(action.body[6].input, { expression: 'input' });
assert.equal(action.body[7].kind, 'return');
assert.deepEqual(action.body[7].value, { expression: 'patches' });

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'action-body.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.childCount, 11);
assert.equal(report.summary.recognizedChildCount, 11);
assert.deepEqual(report.summary.recognizedChildKinds, ['actionBodyRow']);
const actionBlock = report.recognizedBlocks.find((block) => block.id === 'action_add_todo');
assert.ok(actionBlock);
assert.equal(actionBlock.children[0].id, 'bind_normalized_title');
assert.equal(actionBlock.children[0].sourceSpan.path, 'action-body.frontier');
assert.equal(actionBlock.children[0].sourceSpan.blockId, 'action_add_todo');
assert.equal(source.slice(actionBlock.children[0].startOffset, actionBlock.children[0].endOffset), 'let normalized_title @id("bind_normalized_title") value input.title');
const guardChild = actionBlock.children.find((child) => child.id === 'guard_valid_title');
assert.equal(guardChild.rowKind, 'if');
assert.equal(guardChild.name, 'valid');
const nestedBindingChild = actionBlock.children.find((child) => child.id === 'bind_status_text');
assert.equal(nestedBindingChild.rowKind, 'let');
assert.equal(nestedBindingChild.parentActionBodyId, 'guard_valid_title');
const nestedPatchChild = actionBlock.children.find((child) => child.id === 'patch_set_status');
assert.equal(nestedPatchChild.parentActionBodyId, 'guard_valid_title');

const unsupported = inspectFrontierSourceSyntax(`module UnsupportedActionBody @id("mod_unsupported_action_body") {
action AddTodo @id("action_add_todo") {
  body {
    if guarded @id("guard_unsupported") condition input.enabled {
      mutateEverything danger @id("unsupported_action_body_row") value unknown
    }
  }
}
}`);
assert.equal(unsupported.summary.failClosed, true);
assert.equal(unsupported.summary.unknownChildCount, 1);
assert.equal(unsupported.unknownChildren[0].id, 'unsupported_action_body_row');
assert.equal(unsupported.unknownChildren[0].reason, 'unsupported-action-body-row');
assert.equal(unsupported.blocks[0].children.find((child) => child.id === 'guard_unsupported').recognized, true);
