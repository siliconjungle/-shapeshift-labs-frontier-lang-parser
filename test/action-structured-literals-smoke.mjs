import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ActionStructuredLiteralProbe @id("mod_action_structured_literal_probe") {
action BuildPayload @id("action_build_payload") {
  body {
    let payload @id("bind_payload") value { title: input.title, tags: [input.tag, "new"], meta: { ready: true, count: input.count } }
    set payload @id("patch_payload") path /payload value payload
    set inline @id("patch_inline") path /inline value { id: input.id, title: input.title }
  }
}
}`;

const action = parseFrontierSource(source).nodes.action_build_payload;
assert.equal(action.body.length, 3);
assert.deepEqual(action.body[0], {
  kind: 'let',
  id: 'bind_payload',
  name: 'payload',
  value: {
    expression: '{ title: input.title, tags: [input.tag, "new"], meta: { ready: true, count: input.count } }',
    expressionAst: {
      kind: 'object',
      entries: [
        { key: 'title', value: { kind: 'ref', name: 'input.title', scope: 'input', path: ['title'] } },
        { key: 'tags', value: { kind: 'array', elements: [
          { kind: 'ref', name: 'input.tag', scope: 'input', path: ['tag'] },
          { kind: 'literal', value: 'new' }
        ] } },
        { key: 'meta', value: { kind: 'object', entries: [
          { key: 'ready', value: { kind: 'literal', value: true } },
          { key: 'count', value: { kind: 'ref', name: 'input.count', scope: 'input', path: ['count'] } }
        ] } }
      ]
    }
  }
});
assert.equal(action.body[2].value.expressionAst.kind, 'object');
assert.equal(action.body[2].value.expressionAst.entries[0].key, 'id');

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'action-structured-literals.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.unknownChildCount, 0);

const trailingArrayCommaSource = `module TrailingArrayComma @id("mod_trailing_array_comma") {
action BuildPayload @id("action_build_payload") {
  body {
    let payload @id("trailing_array_comma") value [input.title,]
  }
}
}`;
assert.equal((parseFrontierSource(trailingArrayCommaSource).nodes.action_build_payload.body ?? []).length, 0);
const trailingArrayComma = inspectFrontierSourceSyntax(trailingArrayCommaSource);
assert.equal(trailingArrayComma.summary.failClosed, true);
assert.equal(trailingArrayComma.unknownChildren[0].id, 'trailing_array_comma');
assert.equal(trailingArrayComma.unknownChildren[0].reason, 'malformed-action-expression');

const trailingObjectCommaSource = `module TrailingObjectComma @id("mod_trailing_object_comma") {
action BuildPayload @id("action_build_payload") {
  body {
    let payload @id("trailing_object_comma") value { title: input.title, }
  }
}
}`;
assert.equal((parseFrontierSource(trailingObjectCommaSource).nodes.action_build_payload.body ?? []).length, 0);
const trailingObjectComma = inspectFrontierSourceSyntax(trailingObjectCommaSource);
assert.equal(trailingObjectComma.summary.failClosed, true);
assert.equal(trailingObjectComma.unknownChildren[0].reason, 'malformed-action-expression');

const missingColonSource = `module MissingColon @id("mod_missing_colon") {
action BuildPayload @id("action_build_payload") {
  body {
    let payload @id("missing_object_colon") value { title input.title }
  }
}
}`;
assert.equal((parseFrontierSource(missingColonSource).nodes.action_build_payload.body ?? []).length, 0);
const missingColon = inspectFrontierSourceSyntax(missingColonSource);
assert.equal(missingColon.summary.failClosed, true);
assert.equal(missingColon.unknownChildren[0].reason, 'malformed-action-expression');

const computedKeySource = `module ComputedKey @id("mod_computed_key") {
action BuildPayload @id("action_build_payload") {
  body {
    let payload @id("computed_object_key") value { [input.key]: input.value }
  }
}
}`;
assert.equal((parseFrontierSource(computedKeySource).nodes.action_build_payload.body ?? []).length, 0);
const computedKey = inspectFrontierSourceSyntax(computedKeySource);
assert.equal(computedKey.summary.failClosed, true);
assert.equal(computedKey.unknownChildren[0].reason, 'malformed-action-expression');

const spreadSource = `module SpreadObject @id("mod_spread_object") {
action BuildPayload @id("action_build_payload") {
  body {
    let payload @id("spread_object") value { ...input }
  }
}
}`;
assert.equal((parseFrontierSource(spreadSource).nodes.action_build_payload.body ?? []).length, 0);
const spread = inspectFrontierSourceSyntax(spreadSource);
assert.equal(spread.summary.failClosed, true);
assert.equal(spread.unknownChildren[0].reason, 'malformed-action-expression');
