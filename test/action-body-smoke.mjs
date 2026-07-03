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
    let can_write @id("bind_can_write") value input.enabled == true
    set title @id("patch_set_title") path /todos/title value normalized_title
    if valid @id("guard_valid_title") condition can_write && input.enabled {
      let status_text @id("bind_status_text") value "ready"
      set status @id("patch_set_status") path /todos/status value status_text
      callEffect persistWhenValid @id("effect_call_valid_persist") capability storage.write input input
    }
    insert item @id("patch_insert_item") path /todos value input
    merge meta @id("patch_merge_meta") path /todos/meta value "created"
    remove oldTitle @id("patch_remove_old_title") path /todos/oldTitle
    callEffect persist @id("effect_call_persist") capability storage.write input input
    let next_count @id("bind_next_count") type Number value input.count + 1
    set count @id("patch_set_count") path /todos/count type Number value next_count
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
assert.equal(action.body.length, 11);
assert.deepEqual(action.body[0], {
  kind: 'let',
  id: 'bind_normalized_title',
  name: 'normalized_title',
  value: { expression: 'input.title', expressionAst: { kind: 'ref', name: 'input.title', scope: 'input', path: ['title'] } }
});
assert.deepEqual(action.body[1], {
  kind: 'let',
  id: 'bind_can_write',
  name: 'can_write',
  value: {
    expression: 'input.enabled == true',
    expressionAst: {
      kind: 'binary',
      op: '==',
      left: { kind: 'ref', name: 'input.enabled', scope: 'input', path: ['enabled'] },
      right: { kind: 'literal', value: true }
    }
  }
});
assert.deepEqual(action.body[2], {
  kind: 'patch',
  op: 'set',
  id: 'patch_set_title',
  name: 'title',
  path: '/todos/title',
  value: { expression: 'normalized_title', expressionAst: { kind: 'ref', name: 'normalized_title', scope: 'local', path: ['normalized_title'] } }
});
assert.equal(action.body[3].kind, 'if');
assert.equal(action.body[3].id, 'guard_valid_title');
assert.equal(action.body[3].name, 'valid');
assert.deepEqual(action.body[3].condition, {
  expression: 'can_write && input.enabled',
  expressionAst: {
    kind: 'logical',
    op: '&&',
    left: { kind: 'ref', name: 'can_write', scope: 'local', path: ['can_write'] },
    right: { kind: 'ref', name: 'input.enabled', scope: 'input', path: ['enabled'] }
  }
});
assert.equal(action.body[3].body.length, 3);
assert.deepEqual(action.body[3].body[0], {
  kind: 'let',
  id: 'bind_status_text',
  name: 'status_text',
  value: { value: 'ready' }
});
assert.equal(action.body[3].body[1].id, 'patch_set_status');
assert.deepEqual(action.body[3].body[1].value, { expression: 'status_text', expressionAst: { kind: 'ref', name: 'status_text', scope: 'local', path: ['status_text'] } });
assert.equal(action.body[3].body[2].kind, 'callEffect');
assert.equal(action.body[3].body[2].capability, 'storage.write');
assert.deepEqual(action.body[5].value, { value: 'created' });
assert.equal(action.body[6].op, 'remove');
assert.equal(action.body[7].kind, 'callEffect');
assert.equal(action.body[7].capability, 'storage.write');
assert.deepEqual(action.body[7].input, { expression: 'input', expressionAst: { kind: 'ref', name: 'input', scope: 'input', path: [] } });
assert.deepEqual(action.body[8], {
  kind: 'let',
  id: 'bind_next_count',
  name: 'next_count',
  valueType: 'Number',
  value: {
    expression: 'input.count + 1',
    expressionAst: {
      kind: 'binary',
      op: '+',
      left: { kind: 'ref', name: 'input.count', scope: 'input', path: ['count'] },
      right: { kind: 'literal', value: 1 }
    },
    valueType: 'Number'
  }
});
assert.deepEqual(action.body[9], {
  kind: 'patch',
  op: 'set',
  id: 'patch_set_count',
  name: 'count',
  path: '/todos/count',
  valueType: 'Number',
  value: { expression: 'next_count', expressionAst: { kind: 'ref', name: 'next_count', scope: 'local', path: ['next_count'] }, valueType: 'Number' }
});
assert.equal(action.body[10].kind, 'return');
assert.deepEqual(action.body[10].value, { expression: 'patches', expressionAst: { kind: 'ref', name: 'patches', scope: 'patches', path: [] } });

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'action-body.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.childCount, 14);
assert.equal(report.summary.recognizedChildCount, 14);
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
assert.equal(actionBlock.children.find((child) => child.id === 'bind_next_count').rowKind, 'let');
assert.equal(actionBlock.children.find((child) => child.id === 'patch_set_count').rowKind, 'set');

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

const unsupportedBindingSource = `module UnsupportedActionBinding @id("mod_unsupported_action_binding") {
action AddTodo @id("action_add_todo") {
  body {
    let normalized @id("unsupported_action_binding") value normalize(input.title)
  }
}
}`;
const unsupportedBindingDoc = parseFrontierSource(unsupportedBindingSource);
assert.equal((unsupportedBindingDoc.nodes.action_add_todo.body ?? []).length, 0);
const unsupportedBinding = inspectFrontierSourceSyntax(unsupportedBindingSource);
assert.equal(unsupportedBinding.summary.failClosed, true);
assert.equal(unsupportedBinding.summary.unknownChildCount, 1);
assert.equal(unsupportedBinding.unknownChildren[0].id, 'unsupported_action_binding');
assert.equal(unsupportedBinding.unknownChildren[0].rowKind, 'let');
assert.equal(unsupportedBinding.unknownChildren[0].reason, 'unsupported-action-binding-value');

const missingBindingValue = inspectFrontierSourceSyntax(`module MissingActionBinding @id("mod_missing_action_binding") {
action AddTodo @id("action_add_todo") {
  body {
    let normalized @id("missing_action_binding")
  }
}
}`);
assert.equal(missingBindingValue.summary.failClosed, true);
assert.equal(missingBindingValue.summary.unknownChildCount, 1);
assert.equal(missingBindingValue.unknownChildren[0].reason, 'unsupported-action-binding-value');

const unsupportedConditionSource = `module UnsupportedActionCondition @id("mod_unsupported_action_condition") {
action AddTodo @id("action_add_todo") {
  body {
    if guarded @id("unsupported_action_condition") condition input.enabled === true {
      set title @id("nested_patch") path /todos/title value input.title
    }
  }
}
}`;
assert.equal((parseFrontierSource(unsupportedConditionSource).nodes.action_add_todo.body ?? []).length, 0);
const unsupportedCondition = inspectFrontierSourceSyntax(unsupportedConditionSource);
assert.equal(unsupportedCondition.summary.failClosed, true);
assert.equal(unsupportedCondition.unknownChildren[0].id, 'unsupported_action_condition');
assert.equal(unsupportedCondition.unknownChildren[0].reason, 'unsupported-action-expression-operator');

const unsupportedPatchValueSource = `module UnsupportedActionPatchValue @id("mod_unsupported_action_patch_value") {
action AddTodo @id("action_add_todo") {
  body {
    set total @id("unsupported_patch_value") path /todos/total value input.count + 1
  }
}
}`;
assert.equal((parseFrontierSource(unsupportedPatchValueSource).nodes.action_add_todo.body ?? []).length, 0);
const unsupportedPatchValue = inspectFrontierSourceSyntax(unsupportedPatchValueSource);
assert.equal(unsupportedPatchValue.summary.failClosed, true);
assert.equal(unsupportedPatchValue.unknownChildren[0].id, 'unsupported_patch_value');
assert.equal(unsupportedPatchValue.unknownChildren[0].reason, 'missing-action-expression-type');

const unsupportedPatchValueTypeSource = `module UnsupportedActionPatchValueType @id("mod_unsupported_action_patch_value_type") {
action AddTodo @id("action_add_todo") {
  body {
    set total @id("unsupported_patch_value_type") path /todos/total type Text value input.count + 1
  }
}
}`;
assert.equal((parseFrontierSource(unsupportedPatchValueTypeSource).nodes.action_add_todo.body ?? []).length, 0);
const unsupportedPatchValueType = inspectFrontierSourceSyntax(unsupportedPatchValueTypeSource);
assert.equal(unsupportedPatchValueType.summary.failClosed, true);
assert.equal(unsupportedPatchValueType.unknownChildren[0].id, 'unsupported_patch_value_type');
assert.equal(unsupportedPatchValueType.unknownChildren[0].reason, 'unsupported-action-expression-type');

const unsupportedRefSource = `module UnsupportedActionRef @id("mod_unsupported_action_ref") {
action AddTodo @id("action_add_todo") {
  body {
    set enabled @id("unsupported_patch_ref") path /todos/enabled value input..enabled
  }
}
}`;
assert.equal((parseFrontierSource(unsupportedRefSource).nodes.action_add_todo.body ?? []).length, 0);
const unsupportedRef = inspectFrontierSourceSyntax(unsupportedRefSource);
assert.equal(unsupportedRef.summary.failClosed, true);
assert.equal(unsupportedRef.unknownChildren[0].id, 'unsupported_patch_ref');
assert.equal(unsupportedRef.unknownChildren[0].reason, 'unsupported-action-expression-ref');
