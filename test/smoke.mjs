import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';
const doc = parseFrontierSource(`module TodoApp @id("mod_todo") {
type TodoInput @id("type_todo_input") {
  title: Text
  tags: Set<Text>
}
lattice TagSet @id("lat_tag_set") {
  carrier Set<Text>
  laws semilattice, commutative, associative, idempotent
  frontierCrdt createCrdtOrSetLattice
  lawChecker checkCrdtJoinLaws
}
entity Todo @id("ent_todo") {
  title @id("field_title"): Text { merge conflict }
  tags @id("field_tags"): Set<Text> { merge union lattice lat_tag_set crdt or-set }
}
state TodoDb @id("state_todo") {
  todos @id("collection_todos"): Map<TodoId, Todo> { merge byKey law commutative }
}
extern persistTodo @id("extern_persist") {
  language typescript
  symbol persistTodo
  input TodoInput
  returns Patch
  effects storage
}
target typescript @id("target_ts") {
  language typescript
  package @example/todo
  emitPath src/generated/todo.ts
  moduleFormat esm
}
action addTodo @id("action_add") {
  input TodoInput
  returns Patch
  reads TodoDb.todos
  writes TodoDb.todos
  uses Clock
}
}`);
assert.equal(doc.id, 'mod_todo');
assert.equal(doc.nodes.ent_todo.kind, 'entity');
assert.equal(doc.nodes.ent_todo.fields.length, 2);
assert.equal(doc.nodes.type_todo_input.kind, 'type');
assert.equal(doc.nodes.type_todo_input.fields[1].type.kind, 'set');
assert.equal(doc.nodes.lat_tag_set.frontierCrdt.exportName, 'createCrdtOrSetLattice');
assert.equal(doc.nodes.ent_todo.fields[1].merge.latticeId, 'lat_tag_set');
assert.equal(doc.nodes.extern_persist.symbol, 'persistTodo');
assert.equal(doc.nodes.target_ts.target.emitPath, 'src/generated/todo.ts');
assert.equal(doc.nodes.state_todo.collections[0].merge.law, 'commutative');
assert.equal(doc.nodes.action_add.uses[0], 'Clock');
assert.equal(doc.nodes.action_add.input, 'TodoInput');
