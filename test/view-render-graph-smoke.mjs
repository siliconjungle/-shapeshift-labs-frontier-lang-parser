import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const doc = parseFrontierSource(`module ViewGraph {
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
    render Input @id("render_filter_input") {
      identity filter-input
      prop type "search"
    }
    render SaveIcon kind component @id("render_save_icon") {
      component Icon
      key save-icon
      prop name "check"
    }
  }
}
}`);

const renders = doc.nodes.view_todo_list.renders;
const root = renders.find((render) => render.id === 'render_todo_root');
const button = renders.find((render) => render.id === 'render_save_button');
const input = renders.find((render) => render.id === 'render_filter_input');
const icon = renders.find((render) => render.id === 'render_save_icon');

assert.deepEqual(renders.map((render) => render.id), ['render_todo_root', 'render_save_button', 'render_filter_input', 'render_save_icon']);
assert.deepEqual(root.children, ['render_save_button', 'render_filter_input', 'render_save_icon']);
assert.equal(root.props, undefined);
assert.equal(root.events, undefined);
assert.equal(root.text, undefined);
assert.equal(button.tagName, 'Button');
assert.equal(button.identityKey, 'save');
assert.equal(button.props[0].expression, 'disabled');
assert.equal(button.events[0].action, 'save');
assert.equal(input.props[0].value, 'search');
assert.equal(icon.kind, 'component');
assert.equal(icon.component, 'Icon');
assert.equal(icon.tagName, undefined);
