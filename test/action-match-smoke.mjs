import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ActionMatchProbe @id("mod_action_match_probe") {
action SetStatus @id("action_set_status") {
  body {
    match status @id("match_status") value input.status {
      case ready @id("case_ready") value "ready" {
        set status @id("patch_status_ready") path /status value "ready"
      }
      case blocked @id("case_blocked") value "blocked" {
        set status @id("patch_status_blocked") path /status value "blocked"
      }
      default fallback @id("default_status") {
        set status @id("patch_status_pending") path /status value "pending"
      }
    }
  }
}
}`;

const action = parseFrontierSource(source).nodes.action_set_status;
assert.equal(action.body.length, 1);
assert.deepEqual(action.body[0], {
  kind: 'match',
  id: 'match_status',
  name: 'status',
  value: {
    expression: 'input.status',
    expressionAst: { kind: 'ref', name: 'input.status', scope: 'input', path: ['status'] }
  },
  cases: [
    {
      id: 'case_ready',
      name: 'ready',
      value: { value: 'ready' },
      body: [{ kind: 'patch', op: 'set', id: 'patch_status_ready', name: 'status', path: '/status', value: { value: 'ready' } }]
    },
    {
      id: 'case_blocked',
      name: 'blocked',
      value: { value: 'blocked' },
      body: [{ kind: 'patch', op: 'set', id: 'patch_status_blocked', name: 'status', path: '/status', value: { value: 'blocked' } }]
    }
  ],
  defaultId: 'default_status',
  defaultName: 'fallback',
  defaultBody: [{ kind: 'patch', op: 'set', id: 'patch_status_pending', name: 'status', path: '/status', value: { value: 'pending' } }]
});

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'action-match.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.unknownChildCount, 0);
const actionBlock = report.recognizedBlocks.find((block) => block.id === 'action_set_status');
assert.equal(actionBlock.children.find((child) => child.id === 'match_status').rowKind, 'match');
assert.equal(actionBlock.children.find((child) => child.id === 'case_ready').rowKind, 'case');
assert.equal(actionBlock.children.find((child) => child.id === 'case_ready').parentActionBodyId, 'match_status');
assert.equal(actionBlock.children.find((child) => child.id === 'patch_status_ready').parentActionBodyId, 'case_ready');
assert.equal(actionBlock.children.find((child) => child.id === 'case_blocked').parentActionBodyId, 'match_status');
assert.equal(actionBlock.children.find((child) => child.id === 'patch_status_blocked').parentActionBodyId, 'case_blocked');
assert.equal(actionBlock.children.find((child) => child.id === 'default_status').rowKind, 'default');
assert.equal(actionBlock.children.find((child) => child.id === 'default_status').parentActionBodyId, 'match_status');
assert.equal(actionBlock.children.find((child) => child.id === 'patch_status_pending').parentActionBodyId, 'default_status');

const orphanCaseSource = `module OrphanCase @id("mod_orphan_case") {
action SetStatus @id("action_set_status") {
  body {
    case ready @id("orphan_case") value "ready" {
      set status @id("orphan_case_patch_should_not_escape") path /status value "ready"
    }
  }
}
}`;
assert.equal((parseFrontierSource(orphanCaseSource).nodes.action_set_status.body ?? []).length, 0);
const orphanCase = inspectFrontierSourceSyntax(orphanCaseSource);
assert.equal(orphanCase.summary.failClosed, true);
assert.equal(orphanCase.summary.unknownChildCount, 1);
assert.equal(orphanCase.unknownChildren[0].id, 'orphan_case');
assert.equal(orphanCase.unknownChildren[0].reason, 'unsupported-action-body-row');
assert.equal(orphanCase.blocks[0].children.some((child) => child.id === 'orphan_case_patch_should_not_escape'), false);

const unsupportedCaseSource = `module UnsupportedCase @id("mod_unsupported_case") {
action SetStatus @id("action_set_status") {
  body {
    match status @id("match_status") value input.status {
      case dynamic @id("case_dynamic") value input.status {
        set status @id("case_dynamic_patch_should_not_escape") path /status value "ready"
      }
    }
  }
}
}`;
assert.equal((parseFrontierSource(unsupportedCaseSource).nodes.action_set_status.body ?? []).length, 0);
const unsupportedCase = inspectFrontierSourceSyntax(unsupportedCaseSource);
assert.equal(unsupportedCase.summary.failClosed, true);
assert.equal(unsupportedCase.unknownChildren[0].id, 'case_dynamic');
assert.equal(unsupportedCase.unknownChildren[0].reason, 'unsupported-action-match-case-value');
assert.equal(unsupportedCase.blocks[0].children.some((child) => child.id === 'case_dynamic_patch_should_not_escape'), false);

const missingMatchValueSource = `module MissingMatchValue @id("mod_missing_match_value") {
action SetStatus @id("action_set_status") {
  body {
    match status @id("match_missing_value") {
      case ready @id("case_ready") value "ready" {
        set status @id("missing_match_patch_should_not_escape") path /status value "ready"
      }
    }
  }
}
}`;
assert.equal((parseFrontierSource(missingMatchValueSource).nodes.action_set_status.body ?? []).length, 0);
const missingMatchValue = inspectFrontierSourceSyntax(missingMatchValueSource);
assert.equal(missingMatchValue.summary.failClosed, true);
assert.equal(missingMatchValue.unknownChildren[0].id, 'match_missing_value');
assert.equal(missingMatchValue.unknownChildren[0].reason, 'missing-action-match-value');
