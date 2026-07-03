import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const doc = parseFrontierSource(`module ResourceProbe @id("mod_resource_probe") {
resourceGraph TodoResources @id("resource_graph_todo") {
  sourceLanguage javascript
  sourcePath src/todo.ts
  sourceHash sha256:example
  evidence artifact_todo_title_probe
  resource todos @id("resource_todos") kind collection owner owner_todo_store sourcePath src/todo.ts evidence artifact_todo_title_probe
  owner todoStore @id("owner_todo_store") kind store evidence artifact_todo_title_probe
  lifetime request @id("life_request") kind lexical startLine 1 endLine 80 evidence artifact_todo_title_probe
  loan readTodos @id("loan_read_todos") resource resource_todos owner owner_todo_store lifetime life_request mode shared access read evidence artifact_todo_title_probe
  alias todosAlias @id("alias_todos") resource resource_todos owner owner_todo_store alias alias:todos kind local evidence artifact_todo_title_probe
  move todoMove @id("move_todos") resource resource_todos fromOwner owner_todo_store toOwner owner_worker kind transfer evidence artifact_todo_title_probe
  drop todoDrop @id("drop_todos") resource resource_todos owner owner_worker lifetime life_request kind lexical-drop order 1 evidence artifact_todo_title_probe
  escape todoEscape @id("escape_todos") resource resource_todos loan loan_read_todos lifetime life_request kind returned-borrow status needs-proof evidence artifact_todo_title_probe
  outlives requestModule @id("life_request_outlives_module") from life_module to life_request kind contains evidence artifact_todo_title_probe
  borrow readScope @id("borrow_scope_todos") resource resource_todos lifetime life_request kind shared-borrow constraint shared|read-only evidence artifact_todo_title_probe
  unsafe ffiBoundary @id("unsafe_todos_ffi") resource resource_todos kind ffi proofStatus missing evidence artifact_todo_title_probe
  memory heap @id("memory_region_heap") resource resource_todos kind heap addressSpace process pointerWidth 64 endian little sizeBytes 4096 alignmentBytes 8 shared atomic evidence artifact_todo_title_probe
  layout todoPacket @id("layout_todo_packet") resource resource_todos type TodoPacket kind struct repr C sizeBytes 16 alignmentBytes 8 fieldOrder id|title offsetBytes 0 bitWidth 128 endian little evidence artifact_todo_title_probe
  pointer todosPtr @id("pointer_todos_ptr") resource resource_todos target resource_todos owner owner_todo_store lifetime life_request kind raw pointerWidth 64 addressSpace process nullable mutable evidence artifact_todo_title_probe
  access counterLoad @id("access_counter_load") resource resource_todos kind atomic-load operation load memoryOrder acquire atomic reads TodoCounter.value proofStatus missing evidence artifact_todo_title_probe
  abi ffiSave @id("abi_ffi_save") resource resource_todos callable saveTodo abi c callingConvention cdecl pointerWidth 64 endian little proofStatus missing evidence artifact_todo_title_probe
  conflict aliasConflict @id("conflict_todos_alias") resource resource_todos loan loan_read_todos alias alias_todos reasonCode exclusive-resource-alias-overlap-requires-proof status open severity error message "Alias proof is required."
  proof aliasProof @id("proof_obligation_alias") resource resource_todos conflict conflict_todos_alias kind alias-safety status open statement "Prove the alias cannot mutate during the shared loan."
}
}`);

const graphs = doc.metadata.semanticResourceGraphs;
assert.equal(graphs.id, 'resource_graph_todo');
assert.equal(graphs.summary.graphCount, 1);
assert.equal(graphs.summary.resourceCount, 1);
assert.equal(graphs.summary.loanCount, 1);
assert.equal(graphs.summary.aliasCount, 1);
assert.equal(graphs.summary.moveCount, 1);
assert.equal(graphs.summary.dropCount, 1);
assert.equal(graphs.summary.escapeCount, 1);
assert.equal(graphs.summary.lifetimeRegionCount, 1);
assert.equal(graphs.summary.lifetimeRelationCount, 1);
assert.equal(graphs.summary.borrowScopeCount, 1);
assert.equal(graphs.summary.unsafeBoundaryCount, 1);
assert.equal(graphs.summary.memoryRegionCount, 1);
assert.equal(graphs.summary.dataLayoutCount, 1);
assert.equal(graphs.summary.pointerEdgeCount, 1);
assert.equal(graphs.summary.memoryAccessCount, 1);
assert.equal(graphs.summary.abiBoundaryCount, 1);
assert.equal(graphs.summary.conflictCount, 1);
assert.equal(graphs.summary.proofObligationCount, 1);
assert.equal(graphs.graphIds[0], 'resource_graph_todo');
assert.equal(graphs.resourceIds[0], 'resource_todos');
assert.equal(graphs.loanIds[0], 'loan_read_todos');
assert.equal(graphs.unsafeBoundaryIds[0], 'unsafe_todos_ffi');
assert.equal(graphs.memoryRegionIds[0], 'memory_region_heap');
assert.equal(graphs.dataLayoutIds[0], 'layout_todo_packet');
assert.equal(graphs.pointerEdgeIds[0], 'pointer_todos_ptr');
assert.equal(graphs.memoryAccessIds[0], 'access_counter_load');
assert.equal(graphs.abiBoundaryIds[0], 'abi_ffi_save');
assert.equal(graphs.proofObligationIds[0], 'proof_obligation_alias');
assert.equal(graphs.graphs[0].kind, 'frontier.lang.semanticResourceGraph');
assert.equal(graphs.graphs[0].claims.borrowCheckerClaim, false);
assert.equal(graphs.graphs[0].query.resourceIds[0], 'resource_todos');
assert.equal(graphs.graphs[0].query.lowLevelPrimitiveIds.includes('layout_todo_packet'), true);
assert.equal(graphs.graphs[0].dataLayouts[0].repr, 'C');
assert.equal(graphs.graphs[0].memoryRegions[0].atomic, true);
assert.equal(graphs.graphs[0].memoryAccesses[0].memoryOrder, 'acquire');
assert.equal(graphs.graphs[0].abiBoundaries[0].semanticEquivalenceClaim, undefined);
assert.equal(graphs.graphs[0].query.blockerReasonCodes[0], 'exclusive-resource-alias-overlap-requires-proof');
