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
  constraint callable-boundary saveUserCall @id("callable_boundary_save_user") role source kind method-call callableKind function functionName saveUser signatureHash sig_save_user parameterCount 2 requiredParameterCount 1 optionalParameterCount 1 parameterOrder user|options receiverKind module thisBinding this:return returnKind promise asyncKind async dispatchKind dynamic callingConvention js exceptionModel throws effectKind network variadic evidence evidence_callable
  constraint adt-pattern userResult @id("adt_pattern_user_result") role source kind tagged-union adtKind union typeName UserResult variantNames Ok|Err payloadFieldNames value|error tagFieldNames kind matchArmNames ok|err guardKinds predicate destructuringKinds object exhaustivenessKinds total fallbackKinds wildcard genericParameterNames T evidence evidence_adt
  constraint data-layout userStruct @id("data_layout_user_struct") role target kind repr-c layoutKind struct representationKind repr-c typeId type:User structId struct:User fieldId field:name sizeBytes 24 alignmentBytes 8 offsetBytes 16 endian little pointerWidth 64 integerWidth 32 floatFormat ieee754 repr c evidence evidence_layout
  constraint numeric-semantics userAge @id("numeric_semantics_user_age") role source kind integer numericKind int numericTypeName number width 53 signedness signed overflowMode safe-integer divisionMode trunc moduloMode remainder floatFormat ieee754 floatPrecision double roundingMode nearest specialValues nan|infinity coercionKinds string-to-number literalKinds decimal|separator signed nan infinity evidence evidence_numeric
  constraint text-semantics userName @id("text_semantics_user_name") role source kind string textKind string stringTypeName string encoding utf-16 codeUnit 16 indexingUnit code-unit normalizationForm nfc locale en-AU collation locale caseMapping unicode regexEngine ecmascript escapeMode js interpolationMode template termination none boundaryKinds grapheme|word mutability immutable evidence evidence_text
  constraint collection-semantics userList @id("collection_semantics_user_list") role source kind array collectionKind array collectionTypeName UserList elementKind User keyKind index valueKind User ordering insertion iterationOrder insertion duplicatePolicy allow equality same-value-zero hash identity comparator none indexBase 0 boundsBehavior checked lengthSemantics dynamic sparseSemantics holes mutability mutable persistence ephemeral copyOnWrite iteratorInvalidation mutation traversal eager capacityGrowth dynamic concurrency single-thread evidence evidence_collection
  constraint serialization-semantics userJson @id("serialization_semantics_user_json") role source kind json format json codec JSON.stringify schemaName UserSchema fieldNaming camel fieldOrder declaration omittedFields undefined unknownFields preserve defaultValues omit nullSemantics null enumEncoding string endianness little alignment 1 varint none schemaVersion v1 compatibility backward canonicalization stable deterministic precision double roundtrip stable validation schema escaping json streaming framing evidence evidence_serialization
  constraint dependency-semantics npmReact @id("dependency_semantics_npm_react") role source kind package packageManager npm manifestSchema package-json packageName react versionRange ^19.0.0 resolvedVersion 19.1.0 lockfile package-lock.json integrity sha512-demo dependencyClass peer peerDependencies react-dom optionalDependencies fsevents devDependencies vitest features exports|types workspace app registry npmjs sourceUrl https://registry.npmjs.org/react lifecycleScripts preinstall nativeAbi napi buildTool node-gyp packageManagerVersion 10 offlineCache npm-cache dedupeHoist hoisted provenance registry trust high evidence evidence_dependency
  constraint concurrency-model asyncTask @id("concurrency_model_async_task") role source kind async-task concurrencyKind async-task constructId task:save scheduler event-loop isolationKey request cancellationKey signal:abort async await structured cancelable evidence evidence_concurrency
  constraint error-model userError @id("error_model_user_error") role source kind exception errorKind exception errorType UserError boundaryId catch:user exceptional evidence evidence_error
  constraint evaluation-model optionalChain @id("evaluation_model_optional_chain") role source kind short-circuit evaluationKind short-circuit expressionId expr:user operator ?. valueKind nullable evaluationOrder left-to-right coercionKind none evidence evidence_evaluation
  constraint metaprogramming decorator @id("metaprogramming_decorator") role source kind decorator expansionKind decorator symbol symbol:User expansionId expansion:user generatorId gen:decorator generatedSourcePath dist/user.js expandedHash hash-expanded evidence evidence_meta
  constraint object-model userClass @id("object_model_user_class") role source kind class objectKind class classId class:User prototypeId proto:User methodId method:save fieldId field:name constructorId ctor:User dispatchKind virtual inheritanceKind single receiverKind this referenceSemantics reference virtual reflection evidence evidence_object
  constraint protocol serializable @id("protocol_serializable") role target kind trait-bound protocolKind trait traitName Serializable subjectName User requirementNames serialize|deserialize associatedTypeNames Error genericParameterNames T boundNames Display|Debug implementationKinds blanket dispatchKinds static coherenceKinds orphan-rule evidence evidence_protocol
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

const callableRecord = plan.callableBoundaryConstraints[0].sourceCallables[0];
assert.equal(plan.callableBoundaryConstraints[0].sourceCallableBoundaryRecords[0], callableRecord);
assert.equal(callableRecord.functionName, 'saveUser');
assert.equal(callableRecord.parameterCount, 2);
assert.deepEqual(callableRecord.parameterOrder, ['user', 'options']);
assert.equal(callableRecord.receiverKind, 'module');
assert.equal(callableRecord.asyncKind, 'async');
assert.equal(callableRecord.variadic, true);

const adtRecord = plan.adtPatternConstraints[0].sourcePatterns[0];
assert.equal(plan.adtPatternConstraints[0].sourceAdtPatternRecords[0], adtRecord);
assert.deepEqual(adtRecord.variantNames, ['Ok', 'Err']);
assert.deepEqual(adtRecord.payloadFieldNames, ['value', 'error']);
assert.deepEqual(adtRecord.exhaustivenessKinds, ['total']);

const layoutRecord = plan.dataLayoutConstraints[0].targetLayouts[0];
assert.equal(plan.dataLayoutConstraints[0].targetDataLayoutRecords[0], layoutRecord);
assert.equal(layoutRecord.layoutKind, 'struct');
assert.equal(layoutRecord.typeId, 'type:User');
assert.equal(layoutRecord.sizeBytes, 24);
assert.equal(layoutRecord.pointerWidth, 64);

const numericRecord = plan.numericSemanticsConstraints[0].sourceNumerics[0];
assert.equal(plan.numericSemanticsConstraints[0].sourceNumericSemanticsRecords[0], numericRecord);
assert.equal(numericRecord.numericKind, 'int');
assert.equal(numericRecord.width, 53);
assert.equal(numericRecord.floatPrecision, 'double');
assert.deepEqual(numericRecord.specialValues, ['nan', 'infinity']);

const textRecord = plan.textSemanticsConstraints[0].sourceTexts[0];
assert.equal(plan.textSemanticsConstraints[0].sourceTextSemanticsRecords[0], textRecord);
assert.equal(textRecord.encoding, 'utf-16');
assert.equal(textRecord.normalizationForm, 'nfc');
assert.deepEqual(textRecord.boundaryKinds, ['grapheme', 'word']);

const collectionRecord = plan.collectionSemanticsConstraints[0].sourceCollections[0];
assert.equal(plan.collectionSemanticsConstraints[0].sourceCollectionSemanticsRecords[0], collectionRecord);
assert.equal(collectionRecord.collectionKind, 'array');
assert.equal(collectionRecord.indexBase, 0);
assert.equal(collectionRecord.copyOnWrite, true);

const serializationRecord = plan.serializationSemanticsConstraints[0].sourceSerializations[0];
assert.equal(plan.serializationSemanticsConstraints[0].sourceSerializationSemanticsRecords[0], serializationRecord);
assert.equal(serializationRecord.format, 'json');
assert.equal(serializationRecord.schemaName, 'UserSchema');
assert.equal(serializationRecord.deterministic, true);

const dependencyRecord = plan.dependencySemanticsConstraints[0].sourceDependencies[0];
assert.equal(plan.dependencySemanticsConstraints[0].sourceDependencySemanticsRecords[0], dependencyRecord);
assert.equal(dependencyRecord.packageManager, 'npm');
assert.equal(dependencyRecord.versionRange, '^19.0.0');
assert.deepEqual(dependencyRecord.features, ['exports', 'types']);

const concurrencyRecord = plan.concurrencyModelConstraints[0].sourceConcurrencyModels[0];
assert.equal(plan.concurrencyModelConstraints[0].sourceConcurrencyModelRecords[0], concurrencyRecord);
assert.equal(concurrencyRecord.concurrencyKind, 'async-task');
assert.equal(concurrencyRecord.constructId, 'task:save');
assert.equal(concurrencyRecord.await, true);

const errorRecord = plan.errorModelConstraints[0].sourceErrors[0];
assert.equal(plan.errorModelConstraints[0].sourceErrorModelRecords[0], errorRecord);
assert.equal(errorRecord.errorKind, 'exception');
assert.equal(errorRecord.errorType, 'UserError');

const evaluationRecord = plan.evaluationModelConstraints[0].sourceEvaluations[0];
assert.equal(plan.evaluationModelConstraints[0].sourceEvaluationModelRecords[0], evaluationRecord);
assert.equal(evaluationRecord.evaluationKind, 'short-circuit');
assert.equal(evaluationRecord.operator, '?.');

const metaprogrammingRecord = plan.metaprogrammingConstraints[0].sourceMetaprograms[0];
assert.equal(plan.metaprogrammingConstraints[0].sourceMetaprogrammingRecords[0], metaprogrammingRecord);
assert.equal(metaprogrammingRecord.expansionKind, 'decorator');
assert.equal(metaprogrammingRecord.expandedHash, 'hash-expanded');

const objectRecord = plan.objectModelConstraints[0].sourceObjects[0];
assert.equal(plan.objectModelConstraints[0].sourceObjectModelRecords[0], objectRecord);
assert.equal(objectRecord.objectKind, 'class');
assert.equal(objectRecord.classId, 'class:User');
assert.equal(objectRecord.virtual, true);

const protocolRecord = plan.protocolConstraints[0].targetProtocols[0];
assert.equal(protocolRecord.protocolKind, 'trait');
assert.equal(protocolRecord.traitName, 'Serializable');
assert.deepEqual(protocolRecord.requirementNames, ['serialize', 'deserialize']);
