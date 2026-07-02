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
view TodoList @id("view_todo_list") {
  reads TodoDb.todos
  dispatches action_add
  prop disabled @id("view_prop_disabled"): Boolean
  event save @id("view_event_save") action action_add input TodoInput
  render Button @id("render_save_button") {
    identity save
    text "Save"
    prop disabled disabled
    on press save
  }
}
migration TodoV1ToV2 @id("migration_todo_v1_v2") {
  fromVersion 1
  toVersion 2
  change addField Todo.title
  invariants title_present
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
assert.equal(doc.nodes.view_todo_list.kind, 'view');
assert.equal(doc.nodes.view_todo_list.reads[0], 'TodoDb.todos');
assert.equal(doc.nodes.view_todo_list.dispatches[0], 'action_add');
assert.equal(doc.nodes.view_todo_list.props[0].type, 'Boolean');
assert.equal(doc.nodes.view_todo_list.events[0].input, 'TodoInput');
assert.equal(doc.nodes.view_todo_list.renders[0].tagName, 'Button');
assert.equal(doc.nodes.view_todo_list.renders[0].identityKey, 'save');
assert.equal(doc.nodes.view_todo_list.renders[0].props[0].expression, 'disabled');
assert.equal(doc.nodes.view_todo_list.renders[0].events[0].action, 'save');
assert.equal(doc.nodes.migration_todo_v1_v2.kind, 'migration');
assert.equal(doc.nodes.migration_todo_v1_v2.fromVersion, '1');
assert.equal(doc.nodes.migration_todo_v1_v2.toVersion, '2');
assert.equal(doc.nodes.migration_todo_v1_v2.changes[0].kind, 'addField');
assert.equal(doc.nodes.migration_todo_v1_v2.changes[0].target, 'Todo.title');
assert.equal(doc.nodes.migration_todo_v1_v2.changes[0].statement, 'Todo.title');
assert.equal(doc.nodes.migration_todo_v1_v2.invariants[0], 'title_present');
assert.equal(doc.nodes.action_add.uses[0], 'Clock');
assert.equal(doc.nodes.action_add.input, 'TodoInput');

const newlineRenderDoc = parseFrontierSource(`module ViewProbe {
view Detail @id("view_detail") {
  prop visible @id("view_prop_visible"): Boolean
  render Label @id("render_detail_label")
  {
    prop title @id("render_prop_title"): Text
    on press save
  }
}
}`);
assert.deepEqual(newlineRenderDoc.nodes.view_detail.props.map((prop) => prop.name), ['visible']);
assert.equal(newlineRenderDoc.nodes.view_detail.renders[0].tagName, 'Label');
assert.equal(newlineRenderDoc.nodes.view_detail.renders[0].props[0].name, 'title');
