import { strict as assert } from 'node:assert';
import { parseFrontierSource } from '../src/index.js';

const doc = parseFrontierSource(`
module RichConversion @id("mod_rich_conversion")

conversion JsToRust @id("conversion_js_rust") {
  sourceLanguage javascript
  target rust
  constraint type rustApi @id("type_constraint_rust_api") role target kind public-function symbol symbol:addTodoRust signatureHash sig_add_todo evidence evidence_type
  constraint module-constraint todoModule @id("module_constraint_todo") role source kind module-boundary sourcePath src/todo.ts specifier ./todo importedName addTodo exportedName addTodo packageName @app/todo packageSubpath ./todo packageCondition import resolutionKind node16 resolvedPath src/todo.ts packageExportKey ./todo importAttributes type-json publicContract evidence evidence_module
  constraint scope-binding todoLocal @id("scope_binding_todo") role source kind lexical-binding localName todo bindingId binding:todo referenceId ref:todo scopeId scope:handler resolvedBindingId binding:todo lookupKind lexical namespace value closure captured typeOnly evidence evidence_scope
  constraint memory-model todoMemory @id("memory_model_todo") role source kind stable-reference resource TodoDb.todos memoryKind shared-memory operationKind atomic-load memoryOrder acquire lockId lock:todo synchronizationKey todo-lock lifetimeKind lexical regionKind heap shared atomic evidence evidence_memory
  constraint effect-constraint todoWrite @id("effect_constraint_todo_write") role source kind storage-write effectKind storage-write capability storage.write resource TodoDb.todos reads TodoDb.todos writes TodoDb.todos effectTarget TodoDb.todos fact writes|deterministic adapterRequired evidence evidence_effect
  constraint host-environment browserFetch @id("host_environment_fetch") role source kind browser-api hostKind browser-api capability fetch apiName fetch globalName window permission network resource https://api.example.test adapterRequired evidence evidence_host
}
`);

const plan = doc.metadata.universalConversionPlan;
const targetType = plan.typeConstraints[0].targetTypes[0];
assert.equal(targetType.symbolId, 'symbol:addTodoRust');
assert.equal(targetType.target, undefined);

const moduleRecord = plan.moduleConstraints[0].sourceModules[0];
assert.equal(moduleRecord.specifier, './todo');
assert.equal(moduleRecord.importedName, 'addTodo');
assert.equal(moduleRecord.exportedName, 'addTodo');
assert.equal(moduleRecord.packageName, '@app/todo');
assert.equal(moduleRecord.packageCondition, 'import');
assert.equal(moduleRecord.resolutionKind, 'node16');
assert.deepEqual(moduleRecord.importAttributes, ['type-json']);
assert.equal(moduleRecord.publicContract, true);

const scopeRecord = plan.scopeBindingConstraints[0].sourceBindings[0];
assert.equal(plan.scopeBindingConstraints[0].sourceScopeBindingRecords[0], scopeRecord);
assert.equal(scopeRecord.bindingId, 'binding:todo');
assert.equal(scopeRecord.referenceId, 'ref:todo');
assert.equal(scopeRecord.scopeId, 'scope:handler');
assert.equal(scopeRecord.resolvedBindingId, 'binding:todo');
assert.equal(scopeRecord.lookupKind, 'lexical');
assert.equal(scopeRecord.closure, true);
assert.equal(scopeRecord.typeOnly, true);

const memoryRecord = plan.memoryModelConstraints[0].sourceMemoryModels[0];
assert.equal(plan.memoryModelConstraints[0].sourceMemoryModelRecords[0], memoryRecord);
assert.equal(memoryRecord.memoryKind, 'shared-memory');
assert.equal(memoryRecord.operationKind, 'atomic-load');
assert.equal(memoryRecord.memoryOrder, 'acquire');
assert.equal(memoryRecord.lockId, 'lock:todo');
assert.equal(memoryRecord.synchronizationKey, 'todo-lock');
assert.equal(memoryRecord.shared, true);
assert.equal(memoryRecord.atomic, true);

const effectRecord = plan.effectConstraints[0].sourceEffects[0];
assert.equal(effectRecord.effectKind, 'storage-write');
assert.equal(effectRecord.capability, 'storage.write');
assert.deepEqual(effectRecord.reads, ['TodoDb.todos']);
assert.deepEqual(effectRecord.writes, ['TodoDb.todos']);
assert.equal(effectRecord.target, 'TodoDb.todos');
assert.equal(effectRecord.adapterRequired, true);

const hostRecord = plan.hostEnvironmentConstraints[0].sourceHosts[0];
assert.equal(plan.hostEnvironmentConstraints[0].sourceHostEnvironmentRecords[0], hostRecord);
assert.equal(hostRecord.hostKind, 'browser-api');
assert.equal(hostRecord.capability, 'fetch');
assert.equal(hostRecord.apiName, 'fetch');
assert.equal(hostRecord.globalName, 'window');
assert.equal(hostRecord.permission, 'network');
assert.equal(hostRecord.resourceId, 'https://api.example.test');
assert.equal(hostRecord.adapterRequired, true);
