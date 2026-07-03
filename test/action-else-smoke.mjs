import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ActionElseProbe @id("mod_action_else_probe") {
action AddTodo @id("action_add_todo") {
  body {
    let can_write @id("bind_can_write") value input.enabled == true
    if valid @id("guard_valid") condition can_write && input.enabled {
      set status @id("patch_status_ready") path /todos/status value "ready"
    } else invalid @id("else_invalid") {
      set status @id("patch_status_blocked") path /todos/status value "blocked"
    }
    return patches
  }
}
}`;

const doc = parseFrontierSource(source);
const action = doc.nodes.action_add_todo;
assert.equal(action.body.length, 3);
assert.equal(action.body[1].kind, 'if');
assert.equal(action.body[1].id, 'guard_valid');
assert.equal(action.body[1].elseId, 'else_invalid');
assert.equal(action.body[1].elseName, 'invalid');
assert.deepEqual(action.body[1].body[0], {
  kind: 'patch',
  op: 'set',
  id: 'patch_status_ready',
  name: 'status',
  path: '/todos/status',
  value: { value: 'ready' }
});
assert.deepEqual(action.body[1].elseBody[0], {
  kind: 'patch',
  op: 'set',
  id: 'patch_status_blocked',
  name: 'status',
  path: '/todos/status',
  value: { value: 'blocked' }
});

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'action-else.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.unknownChildCount, 0);
const actionBlock = report.recognizedBlocks.find((block) => block.id === 'action_add_todo');
assert.equal(actionBlock.children.find((child) => child.id === 'guard_valid').rowKind, 'if');
assert.equal(actionBlock.children.find((child) => child.id === 'else_invalid').rowKind, 'else');
assert.equal(actionBlock.children.find((child) => child.id === 'else_invalid').parentActionBodyId, 'guard_valid');
assert.equal(actionBlock.children.find((child) => child.id === 'patch_status_ready').parentActionBodyId, 'guard_valid');
assert.equal(actionBlock.children.find((child) => child.id === 'patch_status_blocked').parentActionBodyId, 'else_invalid');

const standaloneElseSource = `module StandaloneElse @id("mod_standalone_else") {
action AddTodo @id("action_add_todo") {
  body {
    else @id("standalone_else") {
      set status @id("nested_patch_should_not_escape") path /todos/status value "blocked"
    }
  }
}
}`;
assert.equal((parseFrontierSource(standaloneElseSource).nodes.action_add_todo.body ?? []).length, 0);
const standaloneElse = inspectFrontierSourceSyntax(standaloneElseSource);
assert.equal(standaloneElse.summary.failClosed, true);
assert.equal(standaloneElse.summary.unknownChildCount, 1);
assert.equal(standaloneElse.unknownChildren[0].id, 'standalone_else');
assert.equal(standaloneElse.unknownChildren[0].rowKind, 'else');
assert.equal(standaloneElse.unknownChildren[0].reason, 'unsupported-action-body-row');
