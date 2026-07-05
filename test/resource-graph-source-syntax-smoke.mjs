import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax } from '../dist/index.js';

const resourceGraphRowsReport = inspectFrontierSourceSyntax(`module ResourceGraphRows @id("mod_resource_graph_rows") {
resourceGraph LowLevelResources @id("resource_graph_low_level") {
  sourceLanguage rust
  path src/lib.rs
  sourceHash sha256:resource
  status partial
  evidence borrowProof
  resource store @id("resource_store") kind collection owner owner_store
  life request @id("life_request") kind lexical
  outlives moduleRequest @id("life_module_request") from life_module to life_request
  borrow storeBorrow @id("borrow_scope_store") resource resource_store lifetime life_request kind shared-borrow
  unsafe ffi @id("unsafe_ffi") resource resource_store proofStatus missing
  memory heap @id("memory_heap") resource resource_store kind heap pointerWidth 64
  layout packet @id("layout_packet") resource resource_store type Packet repr C sizeBytes 16
  ptr packetPtr @id("pointer_packet") resource resource_store target resource_store pointerWidth 64
  access load @id("access_load") resource resource_store operation load memoryOrder acquire proofStatus missing
  abi ffiSave @id("abi_ffi_save") resource resource_store callable save abi c callingConvention cdecl
  sync release @id("sync_release") fromAccess access_load toAccess access_store kind happens-before proofStatus missing
  fence seqCst @id("sync_seq_cst") fromAccess access_load toAccess access_store kind fence proofStatus passed
  trap bounds @id("trap_bounds") memoryAccess access_load kind bounds-check reasonCode bounds-check proofStatus missing failClosed
  ub overflow @id("ub_overflow") pointer pointer_packet kind signed-overflow language c proofStatus missing
  proof trapProof @id("proof_trap") subject trap_bounds status missing
  proofEvidence run @id("proof_evidence_run") kind test status passed
  sourceMap lowLevel @id("source_map_low_level") generated dist/lib.rs
  missingEvidence ubProof @id("missing_evidence_ub") reason undefined-behavior-proof
}
semanticResourceGraph ManagedResources @id("semantic_resource_graph_managed") {
  language csharp
  sourcePath src/User.cs
  sourceHash sha256:managed
  owner gc @id("owner_gc") kind managed-runtime
}
}`, { sourcePath: 'resource-rows.frontier' });

const resourceCounts = resourceGraphRowsReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.resourceGraph;
const semanticCounts = resourceGraphRowsReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.semanticResourceGraph;

assert.equal(resourceGraphRowsReport.summary.failClosed, false);
assert.equal(resourceCounts.sourceLanguage, 1);
assert.equal(resourceCounts.sourcePath, 1);
assert.equal(resourceCounts.sourceHash, 1);
assert.equal(resourceCounts.status, 1);
assert.equal(resourceCounts.evidence, 2);
assert.equal(resourceCounts.sourceMap, 1);
assert.equal(resourceCounts.missingEvidence, 1);
assert.equal(resourceCounts.resource, 1);
assert.equal(resourceCounts.lifetimeRegion, 1);
assert.equal(resourceCounts.lifetimeRelation, 1);
assert.equal(resourceCounts.borrowScope, 1);
assert.equal(resourceCounts.unsafeBoundary, 1);
assert.equal(resourceCounts.memoryRegion, 1);
assert.equal(resourceCounts.dataLayout, 1);
assert.equal(resourceCounts.pointerEdge, 1);
assert.equal(resourceCounts.memoryAccess, 1);
assert.equal(resourceCounts.abiBoundary, 1);
assert.equal(resourceCounts.synchronizationEdge, 2);
assert.equal(resourceCounts.trap, 1);
assert.equal(resourceCounts.undefinedBehavior, 1);
assert.equal(resourceCounts.proofObligation, 1);
assert.equal(semanticCounts.sourceLanguage, 1);
assert.equal(semanticCounts.sourcePath, 1);
assert.equal(resourceGraphRowsReport.summary.sourceSyntaxRowFamilyCounts.sourcePath, 2);

const resourceBlock = resourceGraphRowsReport.recognizedBlocks.find((block) => block.id === 'resource_graph_low_level');
const resourcePathRow = resourceBlock.children.find((child) => child.rowKind === 'path');
const pointerRow = resourceBlock.children.find((child) => child.rowKind === 'ptr');
const proofEvidenceRow = resourceBlock.children.find((child) => child.rowKind === 'proofEvidence');
const undefinedBehaviorRow = resourceBlock.children.find((child) => child.rowKind === 'ub');

assert.equal(resourcePathRow.normalizedRowKind, 'sourcePath');
assert.equal(resourcePathRow.sourceSpan.path, 'resource-rows.frontier');
assert.equal(pointerRow.normalizedRowKind, 'pointerEdge');
assert.equal(proofEvidenceRow.normalizedRowKind, 'evidence');
assert.equal(undefinedBehaviorRow.normalizedRowKind, 'undefinedBehavior');

const unknownResourceGraphRowsReport = inspectFrontierSourceSyntax(`module UnknownResourceGraphRows @id("mod_unknown_resource_graph_rows") {
resourceGraph Broken @id("resource_graph_broken") {
  coroutineScope asyncRuntime @id("resource_coroutine_scope")
}
semanticResourceGraph AlsoBroken @id("semantic_resource_graph_broken") {
  greenThread worker @id("resource_green_thread")
}
}`);

assert.equal(unknownResourceGraphRowsReport.summary.failClosed, true);
assert.equal(unknownResourceGraphRowsReport.summary.unknownChildCount, 2);
assert.equal(unknownResourceGraphRowsReport.summary.sourceSyntaxRowFamilyCounts.coroutineScope, 1);
assert.equal(unknownResourceGraphRowsReport.summary.sourceSyntaxRowFamilyCounts.greenThread, 1);
assert.equal(unknownResourceGraphRowsReport.unknownChildren.find((child) => child.rowKind === 'coroutineScope').reason, 'unsupported-resource-graph-row');
assert.equal(unknownResourceGraphRowsReport.unknownChildren.find((child) => child.rowKind === 'greenThread').reason, 'unsupported-resource-graph-row');
