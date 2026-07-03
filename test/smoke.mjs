import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';
import './action-body-smoke.mjs';
import './application-surface-smoke.mjs';
import './runtime-capability-smoke.mjs';
import './source-syntax-report-smoke.mjs';

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
effect PersistTodo @id("effect_persist_todo") {
  capability storage.write
  input TodoInput
  returns Json
  resources TodoDb.todos
}
target typescript @id("target_ts") {
  language typescript
  package @example/todo
  emitPath src/generated/todo.ts
  moduleFormat esm
  projection typescriptProjection @id("target_projection_ts") disposition exact-source readiness ready represented semantic-symbol|source-map missing semantic-ownership evidence artifact_todo_title_probe proof artifact_todo_title_probe loss loss_borrow_scope missingEvidence translation-borrow-scope:borrow-across-await review projection-review
  layer ownership @id("target_layer_ts_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
}
nativeSource TodoTs @id("native_todo_ts") {
  language typescript
  parser typescript
  sourcePath src/todo.ts
  sourceHash sha256:example
  symbol Todo
  frontierNodes ent_todo, action_add
  evidence todoTitleProbe @id("artifact_todo_title_probe") kind test status passed path reports/todo-title.json summary "Todo title source map is exact."
  sourceMap todoProjection @id("sourcemap_todo_ts") target typescript targetPath src/generated/todo.ts evidence artifact_todo_title_probe
  mapping todoTitle @id("map_todo_title") sourceMap sourcemap_todo_ts semanticNode field_title nativeSource native_todo_ts semanticSymbol symbol:Todo.title sourceSpan src/todo.ts:1:1-1:12 generatedSpan src/generated/todo.ts:1:1-1:20 precision exact evidence artifact_todo_title_probe
  mergeCandidate todoTitle @id("candidate_todo_title") symbol symbol:Todo.title semanticNode field_title conflictKey symbol:Todo.title readiness ready evidence artifact_todo_title_probe sourceMap sourcemap_todo_ts sourceMapMapping map_todo_title reason "exact source map"
  loss unsupportedSyntax "decorator retained in native AST" severity warning
}
proof TodoProofs @id("proof_todo") {
  contract todoTitle @id("contract_todo_title") kind invariant subject ent_todo statement "Todo title remains renderable."
  obligation todoTitleRuntime @id("obligation_todo_title_runtime") kind runtime status open subject ent_todo contract contract_todo_title statement "A runtime probe covers title rendering."
  artifact todoTitleProbe @id("artifact_todo_title_probe") kind test status passed path reports/todo-title.json obligation obligation_todo_title_runtime command "npm test -- todo-title"
  assumption hostFetch @id("assumption_host_fetch") scope host subject cap_http_request description "The host fetch adapter preserves request semantics."
}
paradigm TodoSemantics @id("paradigm_todo") {
  bindingScope todoModule @id("scope_todo_module") kind module subject mod_todo statement "Todo module owns authored bindings."
  binding todoTitle @id("binding_todo_title") kind field subject field_title bindingScope scope_todo_module semanticNode ent_todo evidence contract_todo_title
  typeConstraint todoTitleText @id("type_constraint_todo_title") kind textField subject field_title binding binding_todo_title evidence contract_todo_title
  effectRegion persistWrite @id("effect_region_persist_write") kind storageWrite subject effect_persist_todo effect effect_persist_todo
  lowering todoTitleTypescript @id("lowering_todo_title_ts") kind projection subject field_title sourceRecord binding_todo_title targetRecord type_constraint_todo_title language typescript evidence artifact_todo_title_probe
}
operations TodoOperations @id("semantic_ops_todo") {
  operation addTodoWrite @id("op_add_todo_write") op effect language frontier semanticNode action_add semanticSymbol symbol:addTodo write TodoDb.todos effect effect_persist_todo ownerKey action:addTodo conflictKey state:TodoDb.todos readiness ready evidence artifact_todo_title_probe summary "Add todo writes the todos collection."
  operation titleProjection @id("op_title_projection") op projection language typescript semanticNode ent_todo semanticSymbol symbol:Todo nativeAstNode ts_node_title readiness needs-review evidence contract_todo_title
}
decisionGraph TodoAdmission @id("decision_graph_todo") {
  graphKind semantic-merge-admission
  scope mod_todo
  root merge_decision_title
  status open
  subject action_add,field_title
  node change @id("decision_node_change") kind semantic-change record semantic_change_title label "Title change" status passed
  node gate @id("decision_node_gate") kind gate record gate_typecheck label "Type gate" status passed
  edge changeToGate @id("decision_edge_change_gate") from semantic_change_title to gate_typecheck kind gates status passed
  change title @id("semantic_change_title") kind source-edit language typescript sourcePath src/todo.ts baseHash h_base targetHash h_worker semanticNode field_title semanticSymbol symbol:Todo.title region src/todo.ts#Todo.title evidence evidence_typecheck risk low summary "Worker changes Todo title projection."
  gate typecheck @id("gate_typecheck") kind typecheck status passed required command "npm run typecheck" subject field_title semanticChange semantic_change_title evidence evidence_typecheck
  evidence typecheck @id("evidence_typecheck") kind test status passed path reports/typecheck.json gate gate_typecheck semanticChange semantic_change_title summary "Type gate passed."
  patchEvent workerPatch @id("patch_event_worker") patch patch_worker status passed actor agent:worker baseHash h_base targetHash h_worker semanticChange semantic_change_title gate gate_typecheck evidence evidence_typecheck deterministic
  admission titleSafe @id("admission_title_safe") candidate candidate_todo_title semanticChange semantic_change_title classification safe decision merge autoMergeable conflictKey symbol:Todo.title gate gate_typecheck evidence evidence_typecheck patchEvent patch_event_worker reason independent-symbol
  merge titleMerge @id("merge_decision_title") candidate candidate_todo_title semanticChange semantic_change_title admissionDecision admission_title_safe decision merge autoMergeable baseHash h_base targetHash h_worker gate gate_typecheck evidence evidence_typecheck patchEvent patch_event_worker reason gates-passed
}
conversion TodoJavascriptToRust @id("conversion_todo_js_rust") {
  sourceLanguage javascript
  target rust
  sourceRuntime javascript node
  targetRuntime rust cli
  runtimeRequirement fetchRuntime @id("runtime_requirement_fetch") capability fetch sourceRuntime node targetRuntime cli requiredSignals source-hash|target-hash|runtime-command|probe-id|telemetry-hash|network-trace-hash evidence artifact_todo_title_probe proofEvidence artifact_todo_title_probe
  dialect nodeProcess @id("dialect_node_process") language javascript dialect node.runtime kind runtime target rust disposition unsupported readiness blocked loss loss_node_process_projection
  extern viteRoutes @id("extern_vite_routes") language javascript dialect vite.plugin.virtual-module externKind generatorArtifact target rust disposition runtime-required evidence evidence_vite_routes_manifest bindingSymbol virtual:routes
  constraint type publicApi @id("type_constraint_public_api") role source kind public-function symbol symbol:addTodo signatureHash sig_add_todo evidence artifact_todo_title_probe
  constraint type rustApi @id("type_constraint_rust_api") role target kind public-function symbol symbol:addTodoRust signatureHash sig_add_todo evidence artifact_todo_title_probe
  constraint controlFlow saveFlow @id("control_flow_save") role source kind async-flow from action_add to effect_persist_todo evidence artifact_todo_title_probe async
  constraint lifetime todoBorrow @id("lifetime_todo_borrow") role source kind borrowed-region resource TodoDb.todos evidence artifact_todo_title_probe
  constraint resourceTransfer todoResource @id("resource_transfer_todo") role source kind resource-identity resource TodoDb.todos owner symbol:todoStore constraint owner|shared-borrow|drop-order evidence artifact_todo_title_probe
  constraint borrowScope todoScope @id("borrow_scope_todo") role source kind shared-borrow-compatible resource TodoDb.todos flowKind async lifetimeKind lexical evidence artifact_todo_title_probe
  constraint borrowChecker todoChecker @id("borrow_checker_todo") role source kind borrow-checker-boundary resource TodoDb.todos constraint shared-borrow-compatible|drop-cleanup-order evidence artifact_todo_title_probe
  constraint module todoModule @id("module_constraint_todo") role source kind module-boundary sourcePath src/todo.ts symbol module:todo publicContract evidence artifact_todo_title_probe
  constraint scopeBinding todoLocal @id("scope_binding_todo") role source kind lexical-binding symbol symbol:todo localName todo from scope:handler to symbol:todo evidence artifact_todo_title_probe
  constraint memoryModel todoMemory @id("memory_model_todo") role source kind stable-reference resource TodoDb.todos lifetimeKind lexical regionKind heap evidence artifact_todo_title_probe
  constraint effect todoWrite @id("effect_constraint_todo_write") role source kind storage-write resource TodoDb.todos fact writes|deterministic evidence artifact_todo_title_probe
}
possibilitySpace TodoProjectionSpace @id("space_todo_projection") {
  subject action_add
  scope mod_todo
  target typescript
  target rust
  variable uiSurface @id("space_variable_ui_surface") kind projection domain react|swiftui|html-css-js default react subject view_todo_list preserve identity|event-flow evidence artifact_todo_title_probe
  hard identity @id("space_constraint_identity") kind semantic-identity family identity subject action_add variable space_variable_ui_surface requires action|state|effect evidence artifact_todo_title_probe conflictKey action:addTodo failClosed
  soft bundleSize @id("space_constraint_bundle_size") kind bundle-budget family runtime target typescript variable space_variable_ui_surface predicate "bundle < 50kb" evidence artifact_todo_title_probe
  preference nativeControls @id("space_preference_native_controls") kind platform-idiom target rust weight 0.8 variable space_variable_ui_surface prefer native-controls reason "native affordances when target supports them"
  collapse rustWorker @id("space_collapse_rust_worker") strategy evidence-first target rust variable space_variable_ui_surface requires identity|runtime-proof produces action_add_rust evidence artifact_todo_title_probe admission space_admission_merge_safe status open
  admission mergeSafe @id("space_admission_merge_safe") kind semantic-merge status open subject action_add target rust requires hardConstraints|runtimeProof evidence artifact_todo_title_probe decision review failClosed reason "runtime proof is required before auto admission"
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
assert.equal(doc.nodes.effect_persist_todo.kind, 'effect');
assert.equal(doc.nodes.effect_persist_todo.capability, 'storage.write');
assert.equal(doc.nodes.effect_persist_todo.input, 'TodoInput');
assert.equal(doc.nodes.effect_persist_todo.resources[0], 'TodoDb.todos');
assert.equal(doc.nodes.target_ts.target.emitPath, 'src/generated/todo.ts');
assert.equal(doc.nodes.target_ts.metadata.projectionContracts[0].id, 'target_projection_ts');
assert.equal(doc.nodes.target_ts.metadata.projectionContracts[0].semanticEquivalenceClaim, false);
assert.equal(doc.nodes.target_ts.metadata.projectionContracts[0].missingLayerKinds[0], 'semantic-ownership');
assert.equal(doc.nodes.target_ts.metadata.projectionLayers[0].layerKind, 'semantic-ownership');
assert.equal(doc.nodes.target_ts.metadata.missingEvidence[0], 'translation-borrow-scope:borrow-across-await');
assert.equal(doc.nodes.native_todo_ts.kind, 'nativeSource');
assert.equal(doc.nodes.native_todo_ts.frontierNodeIds[1], 'action_add');
assert.equal(doc.nodes.native_todo_ts.sourceMapIds[0], 'sourcemap_todo_ts');
assert.equal(doc.nodes.native_todo_ts.mergeCandidateIds[0], 'candidate_todo_title');
assert.equal(doc.nodes.native_todo_ts.evidenceIds[0], 'artifact_todo_title_probe');
assert.equal(doc.nodes.native_todo_ts.losses[0].kind, 'unsupportedSyntax');
assert.equal(doc.metadata.universalAst.sourceMaps[0].id, 'sourcemap_todo_ts');
assert.equal(doc.metadata.universalAst.sourceMaps[0].mappings[0].semanticNodeId, 'field_title');
assert.equal(doc.metadata.universalAst.sourceMaps[0].mappings[0].sourceSpan.startLine, 1);
assert.equal(doc.metadata.universalAst.mergeCandidates[0].readiness, 'ready');
assert.equal(doc.metadata.universalAst.mergeCandidates[0].conflictKeys[0], 'symbol:Todo.title');
assert.equal(doc.metadata.universalAst.evidence[0].status, 'passed');
assert.equal(doc.metadata.proof.id, 'proof_todo');
assert.equal(doc.metadata.proof.contracts[0].subjectId, 'ent_todo');
assert.equal(doc.metadata.proof.obligations[0].contractIds[0], 'contract_todo_title');
assert.equal(doc.metadata.proof.artifacts[0].command, 'npm test -- todo-title');
assert.equal(doc.metadata.proof.assumptions[0].scope, 'host');
assert.equal(doc.metadata.paradigmSemantics.id, 'paradigm_todo');
assert.equal(doc.metadata.paradigmSemantics.bindings[0].bindingScopeId, 'scope_todo_module');
assert.equal(doc.metadata.paradigmSemantics.typeConstraints[0].bindingId, 'binding_todo_title');
assert.equal(doc.metadata.paradigmSemantics.effectRegions[0].effectIds[0], 'effect_persist_todo');
assert.equal(doc.metadata.paradigmSemantics.loweringRecords[0].targetRecordId, 'type_constraint_todo_title');
assert.equal(doc.metadata.semanticOperations.id, 'semantic_ops_todo');
assert.equal(doc.metadata.semanticOperations.operations[0].operationKind, 'effect');
assert.equal(doc.metadata.semanticOperations.operations[0].writes[0], 'TodoDb.todos');
assert.equal(doc.metadata.semanticOperations.operations[1].nativeAstNodeIds[0], 'ts_node_title');
assert.equal(doc.metadata.decisionGraph.id, 'decision_graph_todo');
assert.equal(doc.metadata.decisionGraph.summary.graphCount, 1);
assert.equal(doc.metadata.decisionGraph.summary.semanticChangeCount, 1);
assert.equal(doc.metadata.decisionGraph.summary.gateCount, 1);
assert.equal(doc.metadata.decisionGraph.summary.admissionDecisionCount, 1);
assert.equal(doc.metadata.decisionGraph.summary.decisionCount, 1);
assert.equal(doc.metadata.decisionGraph.graphs[0].rootId, 'merge_decision_title');
assert.equal(doc.metadata.decisionGraph.graphs[0].gateIds[0], 'gate_typecheck');
assert.equal(doc.metadata.decisionGraph.graphs[0].nodes[0].recordId, 'semantic_change_title');
assert.equal(doc.metadata.decisionGraph.graphs[0].edges[0].toId, 'gate_typecheck');
assert.equal(doc.metadata.decisionGraph.semanticChangeIds[0], 'semantic_change_title');
assert.equal(doc.metadata.decisionGraph.gateIds[0], 'gate_typecheck');
assert.equal(doc.metadata.decisionGraph.evidenceIds[0], 'evidence_typecheck');
assert.equal(doc.metadata.decisionGraph.admissionDecisionIds[0], 'admission_title_safe');
assert.equal(doc.metadata.decisionGraph.decisionIds[0], 'merge_decision_title');
assert.equal(doc.metadata.decisionGraph.records.find((record) => record.id === 'gate_typecheck').command, 'npm run typecheck');
assert.equal(doc.metadata.decisionGraph.records.find((record) => record.id === 'admission_title_safe').autoMergeable, true);
assert.equal(doc.metadata.decisionGraph.records.find((record) => record.id === 'merge_decision_title').decision, 'merge');
assert.equal(doc.metadata.universalConversionPlan.id, 'conversion_todo_js_rust');
assert.equal(doc.metadata.universalConversionPlan.targets[0], 'rust');
assert.equal(doc.metadata.universalConversionPlan.sourceRuntimes.javascript, 'node');
assert.equal(doc.metadata.universalConversionPlan.targetRuntimes.rust, 'cli');
assert.equal(doc.metadata.universalConversionPlan.runtimeRequirements[0].capability, 'fetch');
assert.equal(doc.metadata.universalConversionPlan.runtimeRequirements[0].sourceRuntime, 'node');
assert.equal(doc.metadata.universalConversionPlan.runtimeRequirements[0].targetRuntime, 'cli');
assert.equal(doc.metadata.universalConversionPlan.runtimeRequirements[0].requiredSignals.includes('network-trace-hash'), true);
assert.equal(doc.metadata.universalConversionPlan.runtimeRequirements[0].proofEvidenceIds[0], 'artifact_todo_title_probe');
assert.equal(doc.metadata.universalConversionPlan.dialects[0].projection.disposition, 'unsupported');
assert.equal(doc.metadata.universalConversionPlan.dialects[0].projection.lossIds[0], 'loss_node_process_projection');
assert.equal(doc.metadata.universalConversionPlan.externs[0].externKind, 'generatorArtifact');
assert.equal(doc.metadata.universalConversionPlan.externs[0].binding.symbol, 'virtual:routes');
assert.equal(doc.metadata.universalConversionPlan.typeConstraints.length, 2);
assert.equal(doc.metadata.universalConversionPlan.typeConstraints[0].sourceLanguage, 'javascript');
assert.equal(doc.metadata.universalConversionPlan.typeConstraints[1].target, 'rust');
assert.equal(doc.metadata.universalConversionPlan.typeConstraints[0].sourceTypes[0].signatureHash, 'sig_add_todo');
assert.equal(doc.metadata.universalConversionPlan.typeConstraints[1].targetTypes[0].symbolId, 'symbol:addTodoRust');
assert.equal(doc.metadata.universalConversionPlan.controlFlowConstraints[0].sourceControlFlows[0].async, true);
assert.equal(doc.metadata.universalConversionPlan.lifetimeConstraints[0].sourceLifetimeConstraints[0].resourceId, 'TodoDb.todos');
assert.equal(doc.metadata.universalConversionPlan.resourceTransfers[0].sourceGraphs[0].resources[0].id, 'TodoDb.todos');
assert.equal(doc.metadata.universalConversionPlan.resourceTransfers[0].sourceGraphs[0].owners[0].ownerId, 'symbol:todoStore');
assert.equal(doc.metadata.universalConversionPlan.borrowScopeConstraints[0].sourceBorrowScopes[0].constraintKinds[0], 'shared-borrow-compatible');
assert.equal(doc.metadata.universalConversionPlan.borrowCheckerConstraints[0].sourceBorrowScopes[0].resourceId, 'TodoDb.todos');
assert.equal(doc.metadata.universalConversionPlan.moduleConstraints[0].sourceModules[0].publicContract, true);
assert.equal(doc.metadata.universalConversionPlan.scopeBindingConstraints[0].sourceBindings[0].localName, 'todo');
assert.equal(doc.metadata.universalConversionPlan.memoryModelConstraints[0].sourceMemoryModels[0].lifetimeKind, 'lexical');
assert.deepEqual(doc.metadata.universalConversionPlan.effectConstraints[0].sourceEffects[0].factKinds, ['writes', 'deterministic']);
assert.equal(doc.metadata.constraintSpaces.id, 'space_todo_projection');
assert.equal(doc.metadata.constraintSpaces.summary.spaceCount, 1);
assert.equal(doc.metadata.constraintSpaces.summary.variableCount, 1);
assert.equal(doc.metadata.constraintSpaces.summary.constraintCount, 2);
assert.equal(doc.metadata.constraintSpaces.summary.preferenceCount, 1);
assert.equal(doc.metadata.constraintSpaces.summary.collapseStrategyCount, 1);
assert.equal(doc.metadata.constraintSpaces.summary.admissionCount, 1);
assert.deepEqual(doc.metadata.constraintSpaces.targets, ['typescript', 'rust']);
assert.equal(doc.metadata.constraintSpaces.spaces[0].subjectId, 'action_add');
assert.deepEqual(doc.metadata.constraintSpaces.spaces[0].variables[0].domain, ['react', 'swiftui', 'html-css-js']);
assert.equal(doc.metadata.constraintSpaces.spaces[0].constraints[0].strength, 'hard');
assert.equal(doc.metadata.constraintSpaces.spaces[0].constraints[0].failClosed, true);
assert.equal(doc.metadata.constraintSpaces.spaces[0].preferences[0].weight, 0.8);
assert.equal(doc.metadata.constraintSpaces.spaces[0].collapseStrategies[0].strategy, 'evidence-first');
assert.equal(doc.metadata.constraintSpaces.spaces[0].admissions[0].decision, 'review');
assert.equal(doc.nodes.state_todo.collections[0].merge.law, 'commutative');
assert.equal(doc.nodes.view_todo_list.kind, 'view');
assert.equal(doc.nodes.view_todo_list.reads[0], 'TodoDb.todos');
assert.equal(doc.nodes.view_todo_list.dispatches[0], 'action_add');
assert.equal(doc.nodes.view_todo_list.props[0].type, 'Boolean');
assert.equal(doc.nodes.view_todo_list.events[0].input, 'TodoInput');
const saveRender = doc.nodes.view_todo_list.renders[0];
assert.equal(saveRender.tagName, 'Button');
assert.equal(saveRender.identityKey, 'save');
assert.equal(saveRender.props[0].expression, 'disabled');
assert.equal(saveRender.events[0].action, 'save');
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
