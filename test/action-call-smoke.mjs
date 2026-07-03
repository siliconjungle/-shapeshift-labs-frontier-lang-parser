import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ActionCallProbe @id("mod_action_call_probe") {
action AddTodo @id("action_add_todo") {
  body {
    let normalized_title @id("bind_normalized_title") call Text value normalizeTitle(input.title)
    set title @id("patch_set_title") path /todos/title call Text value normalizeTitle(input.title)
    if accepted @id("guard_accepted") call Boolean condition canAccept(input.enabled) {
      set accepted @id("patch_set_accepted") path /todos/accepted value true
    }
    return patches
  }
}
}`;

const doc = parseFrontierSource(source);
const action = doc.nodes.action_add_todo;
assert.equal(action.body.length, 4);
assert.deepEqual(action.body[0], {
  kind: 'let',
  id: 'bind_normalized_title',
  name: 'normalized_title',
  callType: 'Text',
  value: {
    expression: 'normalizeTitle(input.title)',
    expressionAst: {
      kind: 'call',
      callee: 'normalizeTitle',
      args: [{ kind: 'ref', name: 'input.title', scope: 'input', path: ['title'] }],
      callType: 'Text'
    },
    callType: 'Text'
  }
});
assert.equal(action.body[1].id, 'patch_set_title');
assert.equal(action.body[1].callType, 'Text');
assert.equal(action.body[1].value.expressionAst.callee, 'normalizeTitle');
assert.equal(action.body[2].kind, 'if');
assert.equal(action.body[2].callType, 'Boolean');
assert.deepEqual(action.body[2].condition.expressionAst, {
  kind: 'call',
  callee: 'canAccept',
  args: [{ kind: 'ref', name: 'input.enabled', scope: 'input', path: ['enabled'] }],
  callType: 'Boolean'
});

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'action-call.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.recognizedChildCount, 5);
assert.equal(report.summary.unknownChildCount, 0);

const missingCallType = inspectFrontierSourceSyntax(`module MissingCallType @id("mod_missing_call_type") {
action AddTodo @id("action_add_todo") {
  body {
    let normalized @id("missing_action_call_type") value normalize(input.title)
  }
}
}`);
assert.equal(missingCallType.summary.failClosed, true);
assert.equal(missingCallType.unknownChildren[0].id, 'missing_action_call_type');
assert.equal(missingCallType.unknownChildren[0].reason, 'missing-action-call-type');

const unsupportedCallType = inspectFrontierSourceSyntax(`module UnsupportedCallType @id("mod_unsupported_call_type") {
action AddTodo @id("action_add_todo") {
  body {
    let normalized @id("unsupported_action_call_type") call TodoInput value normalize(input.title)
  }
}
}`);
assert.equal(unsupportedCallType.summary.failClosed, true);
assert.equal(unsupportedCallType.unknownChildren[0].id, 'unsupported_action_call_type');
assert.equal(unsupportedCallType.unknownChildren[0].reason, 'unsupported-action-call-type');

const unsupportedCallCallee = inspectFrontierSourceSyntax(`module UnsupportedCallCallee @id("mod_unsupported_call_callee") {
action AddTodo @id("action_add_todo") {
  body {
    let normalized @id("unsupported_action_call_callee") call Text value input.normalize(input.title)
  }
}
}`);
assert.equal(unsupportedCallCallee.summary.failClosed, true);
assert.equal(unsupportedCallCallee.unknownChildren[0].id, 'unsupported_action_call_callee');
assert.equal(unsupportedCallCallee.unknownChildren[0].reason, 'unsupported-action-call-callee');

const unsupportedNestedCall = inspectFrontierSourceSyntax(`module UnsupportedNestedCall @id("mod_unsupported_nested_call") {
action AddTodo @id("action_add_todo") {
  body {
    let normalized @id("unsupported_nested_call") call Text value normalize(format(input.title))
  }
}
}`);
assert.equal(unsupportedNestedCall.summary.failClosed, true);
assert.equal(unsupportedNestedCall.unknownChildren[0].id, 'unsupported_nested_call');
assert.equal(unsupportedNestedCall.unknownChildren[0].reason, 'unsupported-action-call-argument');
