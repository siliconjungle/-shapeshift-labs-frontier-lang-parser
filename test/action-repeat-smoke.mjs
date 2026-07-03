import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ActionRepeatProbe @id("mod_action_repeat_probe") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index @id("repeat_items") times input.count {
      set lastIndex @id("patch_last_index") path /lastIndex value index
    }
  }
}
}`;

const action = parseFrontierSource(source).nodes.action_record_last_index;
assert.equal(action.body.length, 1);
assert.deepEqual(action.body[0], {
  kind: 'repeat',
  repeatKind: 'times',
  id: 'repeat_items',
  name: 'index',
  indexName: 'index',
  count: {
    expression: 'input.count',
    expressionAst: { kind: 'ref', name: 'input.count', scope: 'input', path: ['count'] }
  },
  body: [
    {
      kind: 'patch',
      op: 'set',
      id: 'patch_last_index',
      name: 'lastIndex',
      path: '/lastIndex',
      value: {
        expression: 'index',
        expressionAst: { kind: 'ref', name: 'index', scope: 'local', path: ['index'] }
      }
    }
  ]
});

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'action-repeat.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.unknownChildCount, 0);
const actionBlock = report.recognizedBlocks.find((block) => block.id === 'action_record_last_index');
assert.equal(actionBlock.children.find((child) => child.id === 'repeat_items').rowKind, 'repeat');
assert.equal(actionBlock.children.find((child) => child.id === 'patch_last_index').parentActionBodyId, 'repeat_items');

const literalCountSource = `module LiteralRepeat @id("mod_literal_repeat") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index @id("repeat_literal") times 3 {
      set lastIndex @id("patch_last_index") path /lastIndex value index
    }
  }
}
}`;
assert.equal(parseFrontierSource(literalCountSource).nodes.action_record_last_index.body[0].count.value, 3);
assert.equal(inspectFrontierSourceSyntax(literalCountSource).summary.failClosed, false);

const missingIndexSource = `module MissingIndex @id("mod_missing_index") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat @id("repeat_missing_index") times input.count {
      set lastIndex @id("missing_index_patch_should_not_escape") path /lastIndex value 0
    }
  }
}
}`;
assert.equal((parseFrontierSource(missingIndexSource).nodes.action_record_last_index.body ?? []).length, 0);
const missingIndex = inspectFrontierSourceSyntax(missingIndexSource);
assert.equal(missingIndex.summary.failClosed, true);
assert.equal(missingIndex.unknownChildren[0].id, 'repeat_missing_index');
assert.equal(missingIndex.unknownChildren[0].reason, 'missing-action-repeat-index');
assert.equal(missingIndex.blocks[0].children.some((child) => child.id === 'missing_index_patch_should_not_escape'), false);

const missingIdSource = `module MissingId @id("mod_missing_id") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index times input.count {
      set lastIndex @id("missing_id_patch_should_not_escape") path /lastIndex value 0
    }
  }
}
}`;
assert.equal((parseFrontierSource(missingIdSource).nodes.action_record_last_index.body ?? []).length, 0);
const missingId = inspectFrontierSourceSyntax(missingIdSource);
assert.equal(missingId.summary.failClosed, true);
assert.equal(missingId.unknownChildren[0].reason, 'missing-action-repeat-id');
assert.equal(missingId.blocks[0].children.some((child) => child.id === 'missing_id_patch_should_not_escape'), false);

const missingCountSource = `module MissingCount @id("mod_missing_count") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index @id("repeat_missing_count") {
      set lastIndex @id("missing_count_patch_should_not_escape") path /lastIndex value 0
    }
  }
}
}`;
assert.equal((parseFrontierSource(missingCountSource).nodes.action_record_last_index.body ?? []).length, 0);
const missingCount = inspectFrontierSourceSyntax(missingCountSource);
assert.equal(missingCount.summary.failClosed, true);
assert.equal(missingCount.unknownChildren[0].id, 'repeat_missing_count');
assert.equal(missingCount.unknownChildren[0].reason, 'missing-action-repeat-count');
assert.equal(missingCount.blocks[0].children.some((child) => child.id === 'missing_count_patch_should_not_escape'), false);

const missingCountAfterTimesSource = `module MissingCountAfterTimes @id("mod_missing_count_after_times") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index @id("repeat_missing_count_after_times") times {
      set lastIndex @id("missing_count_after_times_patch_should_not_escape") path /lastIndex value 0
    }
  }
}
}`;
assert.equal((parseFrontierSource(missingCountAfterTimesSource).nodes.action_record_last_index.body ?? []).length, 0);
const missingCountAfterTimes = inspectFrontierSourceSyntax(missingCountAfterTimesSource);
assert.equal(missingCountAfterTimes.summary.failClosed, true);
assert.equal(missingCountAfterTimes.unknownChildren[0].id, 'repeat_missing_count_after_times');
assert.equal(missingCountAfterTimes.unknownChildren[0].reason, 'missing-action-repeat-count');
assert.equal(missingCountAfterTimes.blocks[0].children.some((child) => child.id === 'missing_count_after_times_patch_should_not_escape'), false);

const unsupportedCountSource = `module UnsupportedCount @id("mod_unsupported_count") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index @id("repeat_string_count") times "3" {
      set lastIndex @id("string_count_patch_should_not_escape") path /lastIndex value 0
    }
  }
}
}`;
assert.equal((parseFrontierSource(unsupportedCountSource).nodes.action_record_last_index.body ?? []).length, 0);
const unsupportedCount = inspectFrontierSourceSyntax(unsupportedCountSource);
assert.equal(unsupportedCount.summary.failClosed, true);
assert.equal(unsupportedCount.unknownChildren[0].id, 'repeat_string_count');
assert.equal(unsupportedCount.unknownChildren[0].reason, 'unsupported-action-repeat-count');
assert.equal(unsupportedCount.blocks[0].children.some((child) => child.id === 'string_count_patch_should_not_escape'), false);

const fractionalCountSource = `module FractionalCount @id("mod_fractional_count") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index @id("repeat_fractional_count") times 1.5 {
      set lastIndex @id("fractional_count_patch_should_not_escape") path /lastIndex value 0
    }
  }
}
}`;
assert.equal((parseFrontierSource(fractionalCountSource).nodes.action_record_last_index.body ?? []).length, 0);
const fractionalCount = inspectFrontierSourceSyntax(fractionalCountSource);
assert.equal(fractionalCount.summary.failClosed, true);
assert.equal(fractionalCount.unknownChildren[0].reason, 'unsupported-action-repeat-count');
assert.equal(fractionalCount.blocks[0].children.some((child) => child.id === 'fractional_count_patch_should_not_escape'), false);

const callCountSource = `module CallCount @id("mod_call_count") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index @id("repeat_call_count") times count() {
      set lastIndex @id("call_count_patch_should_not_escape") path /lastIndex value 0
    }
  }
}
}`;
assert.equal((parseFrontierSource(callCountSource).nodes.action_record_last_index.body ?? []).length, 0);
const callCount = inspectFrontierSourceSyntax(callCountSource);
assert.equal(callCount.summary.failClosed, true);
assert.equal(callCount.unknownChildren[0].reason, 'unsupported-action-repeat-count');
assert.equal(callCount.blocks[0].children.some((child) => child.id === 'call_count_patch_should_not_escape'), false);

const lateIdSource = `module LateId @id("mod_late_id") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index times input.count @id("repeat_late_id") {
      set lastIndex @id("late_id_patch_should_not_escape") path /lastIndex value 0
    }
  }
}
}`;
assert.equal((parseFrontierSource(lateIdSource).nodes.action_record_last_index.body ?? []).length, 0);
const lateId = inspectFrontierSourceSyntax(lateIdSource);
assert.equal(lateId.summary.failClosed, true);
assert.equal(lateId.unknownChildren[0].reason, 'malformed-action-repeat-header');
assert.equal(lateId.blocks[0].children.some((child) => child.id === 'late_id_patch_should_not_escape'), false);

const extraTokenSource = `module ExtraToken @id("mod_extra_token") {
action RecordLastIndex @id("action_record_last_index") {
  body {
    repeat index extra @id("repeat_extra_token") times input.count {
      set lastIndex @id("extra_token_patch_should_not_escape") path /lastIndex value 0
    }
  }
}
}`;
assert.equal((parseFrontierSource(extraTokenSource).nodes.action_record_last_index.body ?? []).length, 0);
const extraToken = inspectFrontierSourceSyntax(extraTokenSource);
assert.equal(extraToken.summary.failClosed, true);
assert.equal(extraToken.unknownChildren[0].reason, 'malformed-action-repeat-header');
assert.equal(extraToken.blocks[0].children.some((child) => child.id === 'extra_token_patch_should_not_escape'), false);
