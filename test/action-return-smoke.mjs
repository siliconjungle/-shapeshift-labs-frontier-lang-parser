import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const typedReturnSource = `module TypedReturn @id("mod_typed_return") {
action NextCount @id("action_next_count") {
  input TodoInput
  returns Number
  body {
    return @id("return_next_count") type Number value input.count + 1
  }
}

action NormalizedTitle @id("action_normalized_title") {
  input TodoInput
  returns Text
  body {
    return @id("return_normalized_title") call Text value normalize_title(input.title)
  }
}
}`;

const typedReturnDoc = parseFrontierSource(typedReturnSource);
assert.deepEqual(typedReturnDoc.nodes.action_next_count.body[0], {
  kind: 'return',
  id: 'return_next_count',
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
assert.deepEqual(typedReturnDoc.nodes.action_normalized_title.body[0], {
  kind: 'return',
  id: 'return_normalized_title',
  callType: 'Text',
  value: {
    expression: 'normalize_title(input.title)',
    expressionAst: {
      kind: 'call',
      callee: 'normalize_title',
      args: [{ kind: 'ref', name: 'input.title', scope: 'input', path: ['title'] }],
      callType: 'Text'
    },
    callType: 'Text'
  }
});
const typedReturnReport = inspectFrontierSourceSyntax(typedReturnSource, { sourcePath: 'typed-return.frontier' });
assert.equal(typedReturnReport.summary.failClosed, false);
assert.equal(typedReturnReport.summary.unknownChildCount, 0);
assert.equal(typedReturnReport.recognizedBlocks.find((block) => block.id === 'action_next_count').children[0].id, 'return_next_count');

const unsupportedReturnExpressionSource = `module UnsupportedReturnExpression @id("mod_unsupported_return_expression") {
action NextCount @id("action_next_count") {
  body {
    return @id("unsupported_return_expression") value input.count + 1
  }
}
}`;
assert.equal((parseFrontierSource(unsupportedReturnExpressionSource).nodes.action_next_count.body ?? []).length, 0);
const unsupportedReturnExpression = inspectFrontierSourceSyntax(unsupportedReturnExpressionSource);
assert.equal(unsupportedReturnExpression.summary.failClosed, true);
assert.equal(unsupportedReturnExpression.unknownChildren[0].id, 'unsupported_return_expression');
assert.equal(unsupportedReturnExpression.unknownChildren[0].reason, 'missing-action-expression-type');

const unsupportedReturnCallSource = `module UnsupportedReturnCall @id("mod_unsupported_return_call") {
action NormalizedTitle @id("action_normalized_title") {
  body {
    return @id("unsupported_return_call") value normalize_title(input.title)
  }
}
}`;
assert.equal((parseFrontierSource(unsupportedReturnCallSource).nodes.action_normalized_title.body ?? []).length, 0);
const unsupportedReturnCall = inspectFrontierSourceSyntax(unsupportedReturnCallSource);
assert.equal(unsupportedReturnCall.summary.failClosed, true);
assert.equal(unsupportedReturnCall.unknownChildren[0].id, 'unsupported_return_call');
assert.equal(unsupportedReturnCall.unknownChildren[0].reason, 'missing-action-call-type');
