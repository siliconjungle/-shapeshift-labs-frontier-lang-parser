import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';
const doc = parseFrontierSource(`module TodoApp @id("mod_todo") {
entity Todo @id("ent_todo") {
  title @id("field_title"): Text { merge conflict }
  tags @id("field_tags"): Set<Text> { merge union law semilattice }
}
state TodoDb @id("state_todo") {
  todos @id("collection_todos"): Map<TodoId, Todo> { merge byKey law commutative }
}
action addTodo @id("action_add") {
  input: { title: Text }
  returns Patch
  reads TodoDb.todos
  writes TodoDb.todos
  uses Clock
}
}`);
assert.equal(doc.id, 'mod_todo');
assert.equal(doc.nodes.ent_todo.kind, 'entity');
assert.equal(doc.nodes.ent_todo.fields.length, 2);
assert.equal(doc.nodes.state_todo.collections[0].merge.law, 'commutative');
assert.equal(doc.nodes.action_add.uses[0], 'Clock');
