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
capability HttpRequest @id("cap_http_request") {
  capability http.request
  category network
  input Json
  returns Json
  adapter typescript symbol fetch platform node package undici kind library
  adapter rust symbol reqwest::Client::execute platform native package reqwest kind library
  unsupported c platform embedded reason "requires a host socket adapter"
}
target typescript @id("target_ts") {
  language typescript
  package @example/todo
  emitPath src/generated/todo.ts
  moduleFormat esm
}
nativeSource TodoTs @id("native_todo_ts") {
  language typescript
  parser typescript
  sourcePath src/todo.ts
  sourceHash sha256:example
  symbol Todo
  frontierNodes ent_todo, action_add
  loss unsupportedSyntax "decorator retained in native AST" severity warning
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
assert.equal(doc.nodes.cap_http_request.capability, 'http.request');
assert.equal(doc.nodes.cap_http_request.adapters[0].target.platform, 'node');
assert.equal(doc.nodes.cap_http_request.adapters[1].target.language, 'rust');
assert.match(doc.nodes.cap_http_request.unsupportedTargets[0].reason, /host socket/);
assert.equal(doc.nodes.target_ts.target.emitPath, 'src/generated/todo.ts');
assert.equal(doc.nodes.native_todo_ts.kind, 'nativeSource');
assert.equal(doc.nodes.native_todo_ts.frontierNodeIds[1], 'action_add');
assert.equal(doc.nodes.native_todo_ts.losses[0].kind, 'unsupportedSyntax');
assert.equal(doc.nodes.state_todo.collections[0].merge.law, 'commutative');
assert.equal(doc.nodes.action_add.uses[0], 'Clock');
assert.equal(doc.nodes.action_add.input, 'TodoInput');
