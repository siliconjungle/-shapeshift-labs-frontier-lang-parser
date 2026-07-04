import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax } from '../dist/index.js';

const source = `module ViewSyntax @id("mod_view_syntax") {
view TodoList @id("view_todo_list") {
  reads TodoDb.todos
  dispatches action_add
  prop disabled @id("view_prop_disabled"): Boolean
  event save @id("view_event_save") action action_add input TodoInput
  render Article @id("render_todo_root") {
    key todo-list-root
    render Button @id("render_save_button") {
      identity save
      text "Save"
      prop disabled disabled
      on press save
    }
  }
}
}`;

const report = inspectFrontierSourceSyntax(source, { sourcePath: 'view-syntax.frontier' });
const block = report.recognizedBlocks.find((candidate) => candidate.id === 'view_todo_list');
assert.ok(block);
assert.equal(report.summary.failClosed, false);
assert.equal(report.summary.unknownChildCount, 0);
assert.equal(report.summary.childCount, 11);
for (const kind of ['viewRead', 'viewDispatch', 'viewProp', 'viewEvent', 'viewRender', 'viewRenderIdentity', 'viewRenderText', 'viewRenderProp', 'viewRenderEvent']) {
  assert.equal(report.summary.recognizedChildKinds.includes(kind), true, kind);
}

function child(id) {
  const record = block.children.find((candidate) => candidate.id === id);
  assert.ok(record, id);
  assert.equal(record.sourceSpan.path, 'view-syntax.frontier');
  assert.equal(record.sourceSpan.sourceId, 'mod_view_syntax');
  assert.equal(record.sourceSpan.blockId, 'view_todo_list');
  return record;
}

assert.deepEqual(block.children.find((record) => record.kind === 'viewRead').values, ['TodoDb.todos']);
assert.deepEqual(block.children.find((record) => record.kind === 'viewDispatch').values, ['action_add']);
assert.equal(child('view_prop_disabled').typeSource, 'Boolean');
assert.equal(child('view_event_save').action, 'action_add');
assert.equal(child('view_event_save').typeSource, 'TodoInput');
assert.equal(child('render_todo_root').viewRenderKind, 'element');
assert.equal(child('render_todo_root_key').value, 'todo-list-root');
assert.equal(child('render_save_button').parentRenderId, 'render_todo_root');
assert.equal(child('render_save_button_identity').parentRenderId, 'render_save_button');
assert.equal(child('render_save_button_text').value, 'Save');
assert.equal(child('render_save_button_prop_disabled').expression, 'disabled');
assert.equal(child('render_save_button_on_press').action, 'save');
assert.equal(source.slice(child('render_save_button_on_press').startOffset, child('render_save_button_on_press').endOffset), 'on press save');

const unknown = inspectFrontierSourceSyntax(`module ViewUnknown @id("mod_view_unknown") {
view Broken @id("view_broken") {
  render Button @id("render_button") {
    weirdRow nope
  }
}
}`);
assert.equal(unknown.summary.failClosed, true);
assert.equal(unknown.summary.unknownChildCount, 1);
assert.equal(unknown.unknownChildren[0].kind, 'viewUnknownRow');
assert.equal(unknown.unknownChildren[0].parentRenderId, 'render_button');
assert.equal(unknown.unknownChildren[0].reason, 'unsupported-view-render-row');
