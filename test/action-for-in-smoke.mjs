import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ActionForInProbe @id("mod_action_for_in_probe") {
action CopyNames @id("action_copy_names") {
  body {
    for item @id("for_items") in input.items {
      set lastName @id("patch_last_name") path /lastName value item.name
    }
  }
}
}`;

const action = parseFrontierSource(source).nodes.action_copy_names;
assert.equal(action.body.length, 1);
assert.deepEqual(action.body[0], {
  kind: 'forIn',
  id: 'for_items',
  name: 'item',
  itemName: 'item',
  collection: {
    expression: 'input.items',
    expressionAst: { kind: 'ref', name: 'input.items', scope: 'input', path: ['items'] }
  },
  body: [
    {
      kind: 'patch',
      op: 'set',
      id: 'patch_last_name',
      name: 'lastName',
      path: '/lastName',
      value: {
        expression: 'item.name',
        expressionAst: { kind: 'ref', name: 'item.name', scope: 'local', path: ['item', 'name'] }
      }
    }
  ]
});

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'action-for-in.frontier' });
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.unknownChildCount, 0);
const actionBlock = report.recognizedBlocks.find((block) => block.id === 'action_copy_names');
assert.equal(actionBlock.children.find((child) => child.id === 'for_items').rowKind, 'for');
assert.equal(actionBlock.children.find((child) => child.id === 'patch_last_name').parentActionBodyId, 'for_items');

const missingItemSource = `module MissingItem @id("mod_missing_item") {
action CopyNames @id("action_copy_names") {
  body {
    for @id("for_missing_item") in input.items {
      set lastName @id("missing_item_patch_should_not_escape") path /lastName value "unknown"
    }
  }
}
}`;
assert.equal((parseFrontierSource(missingItemSource).nodes.action_copy_names.body ?? []).length, 0);
const missingItem = inspectFrontierSourceSyntax(missingItemSource);
assert.equal(missingItem.summary.failClosed, true);
assert.equal(missingItem.unknownChildren[0].id, 'for_missing_item');
assert.equal(missingItem.unknownChildren[0].reason, 'missing-action-for-item');
assert.equal(missingItem.blocks[0].children.some((child) => child.id === 'missing_item_patch_should_not_escape'), false);

const missingIdSource = `module MissingId @id("mod_missing_id") {
action CopyNames @id("action_copy_names") {
  body {
    for item in input.items {
      set lastName @id("missing_id_patch_should_not_escape") path /lastName value "unknown"
    }
  }
}
}`;
assert.equal((parseFrontierSource(missingIdSource).nodes.action_copy_names.body ?? []).length, 0);
const missingId = inspectFrontierSourceSyntax(missingIdSource);
assert.equal(missingId.summary.failClosed, true);
assert.equal(missingId.unknownChildren[0].reason, 'missing-action-for-id');
assert.equal(missingId.blocks[0].children.some((child) => child.id === 'missing_id_patch_should_not_escape'), false);

const missingCollectionSource = `module MissingCollection @id("mod_missing_collection") {
action CopyNames @id("action_copy_names") {
  body {
    for item @id("for_missing_collection") {
      set lastName @id("missing_collection_patch_should_not_escape") path /lastName value "unknown"
    }
  }
}
}`;
assert.equal((parseFrontierSource(missingCollectionSource).nodes.action_copy_names.body ?? []).length, 0);
const missingCollection = inspectFrontierSourceSyntax(missingCollectionSource);
assert.equal(missingCollection.summary.failClosed, true);
assert.equal(missingCollection.unknownChildren[0].id, 'for_missing_collection');
assert.equal(missingCollection.unknownChildren[0].reason, 'missing-action-for-collection');
assert.equal(missingCollection.blocks[0].children.some((child) => child.id === 'missing_collection_patch_should_not_escape'), false);

const unsupportedCollectionSource = `module UnsupportedCollection @id("mod_unsupported_collection") {
action CopyNames @id("action_copy_names") {
  body {
    for item @id("for_literal_collection") in "items" {
      set lastName @id("literal_collection_patch_should_not_escape") path /lastName value "unknown"
    }
  }
}
}`;
assert.equal((parseFrontierSource(unsupportedCollectionSource).nodes.action_copy_names.body ?? []).length, 0);
const unsupportedCollection = inspectFrontierSourceSyntax(unsupportedCollectionSource);
assert.equal(unsupportedCollection.summary.failClosed, true);
assert.equal(unsupportedCollection.unknownChildren[0].id, 'for_literal_collection');
assert.equal(unsupportedCollection.unknownChildren[0].reason, 'unsupported-action-for-collection');
assert.equal(unsupportedCollection.blocks[0].children.some((child) => child.id === 'literal_collection_patch_should_not_escape'), false);

const patchesCollectionSource = `module PatchesCollection @id("mod_patches_collection") {
action CopyNames @id("action_copy_names") {
  body {
    for item @id("for_patches_collection") in patches {
      set lastName @id("patches_collection_patch_should_not_escape") path /lastName value "unknown"
    }
  }
}
}`;
assert.equal((parseFrontierSource(patchesCollectionSource).nodes.action_copy_names.body ?? []).length, 0);
const patchesCollection = inspectFrontierSourceSyntax(patchesCollectionSource);
assert.equal(patchesCollection.summary.failClosed, true);
assert.equal(patchesCollection.unknownChildren[0].reason, 'unsupported-action-for-collection');
assert.equal(patchesCollection.blocks[0].children.some((child) => child.id === 'patches_collection_patch_should_not_escape'), false);

const callCollectionSource = `module CallCollection @id("mod_call_collection") {
action CopyNames @id("action_copy_names") {
  body {
    for item @id("for_call_collection") in items() {
      set lastName @id("call_collection_patch_should_not_escape") path /lastName value "unknown"
    }
  }
}
}`;
assert.equal((parseFrontierSource(callCollectionSource).nodes.action_copy_names.body ?? []).length, 0);
const callCollection = inspectFrontierSourceSyntax(callCollectionSource);
assert.equal(callCollection.summary.failClosed, true);
assert.equal(callCollection.unknownChildren[0].reason, 'unsupported-action-for-collection');
assert.equal(callCollection.blocks[0].children.some((child) => child.id === 'call_collection_patch_should_not_escape'), false);

const extraTokenSource = `module ExtraToken @id("mod_extra_token") {
action CopyNames @id("action_copy_names") {
  body {
    for item extra @id("for_extra_token") in input.items {
      set lastName @id("extra_token_patch_should_not_escape") path /lastName value "unknown"
    }
  }
}
}`;
assert.equal((parseFrontierSource(extraTokenSource).nodes.action_copy_names.body ?? []).length, 0);
const extraToken = inspectFrontierSourceSyntax(extraTokenSource);
assert.equal(extraToken.summary.failClosed, true);
assert.equal(extraToken.unknownChildren[0].reason, 'malformed-action-for-header');
assert.equal(extraToken.blocks[0].children.some((child) => child.id === 'extra_token_patch_should_not_escape'), false);
