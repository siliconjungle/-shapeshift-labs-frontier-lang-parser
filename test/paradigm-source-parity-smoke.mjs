import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const source = `module ParadigmSourceParity @id("mod_paradigm_source_parity") {
paradigmSemantics UniversalRows @id("paradigm_universal_rows") {
  valueSemantics persistent @id("paradigm_value_persistent") model persistent-data status represented evidence evidence_value sourceMap map_value
  mutationModel affine @id("paradigm_mutation_affine") model affine required unique-owner missing copy-on-write missingEvidence ownership-proof
  effectModel io @id("paradigm_effect_io") model capability-gated proofEvidence proof_effects
  ownership borrow @id("paradigm_ownership_borrow") model affine sourceLanguage rust target typescript
  lifetime lexical @id("paradigm_lifetime_lexical") model lexical scope scope_root
  bindingScope module @id("scope_module") kind module statement "Module owns authored bindings."
  binding userName @id("binding_user_name") kind value bindingScope scope_module semanticSymbol symbol:userName evidence evidence_value
  pattern destructure @id("pattern_destructure") binding binding_user_name
  dispatch trait @id("paradigm_dispatch_trait") model static
  typeModel structural @id("paradigm_type_structural") model structural
  moduleModel esm @id("paradigm_module_esm") model esm
  concurrency async @id("paradigm_concurrency_async") model event-loop
  errorModel result @id("paradigm_error_result") model result
  memoryModel gc @id("paradigm_memory_gc") model garbage-collected
  evaluation lazy @id("paradigm_evaluation_lazy") model lazy
  evaluationModel eager @id("paradigm_evaluation_eager") model eager
  metaprogramming macro @id("paradigm_meta_macro") phase compile-time
  interop ffi @id("paradigm_interop_ffi") mode abi-boundary
  typeConstraint userNameText @id("type_constraint_user_name") binding binding_user_name
  memoryLocation cache @id("memory_cache") sourcePath src/cache.ts sourceHash sha256:cache
  effectRegion write @id("effect_region_write") effect effect_save
  controlRegion retry @id("control_region_retry") kind retry
  logicProgram validation @id("logic_validation") kind datalog
  actorSystem workers @id("actor_workers") kind actor
  stackEffect pushArg @id("stack_push_arg") kind push
  arrayShape list @id("array_shape_list") kind vector
  numericKernel score @id("numeric_kernel_score") kind fp64
  dataflowNetwork sync @id("dataflow_sync") kind incremental
  clockModel animation @id("clock_animation") kind frame
  objectModel prototype @id("object_model_proto") kind prototype
  macroExpansion derive @id("macro_derive") kind derive
  reflectionBoundary dynamicImport @id("reflection_dynamic_import") kind dynamic-import
  loweringRecord rustBinding @id("lowering_rust_binding") sourceRecord binding_user_name targetRecord type_constraint_user_name loss loss_ffi
}
}`;

const syntaxReport = inspectFrontierSourceSyntax(source, { sourcePath: 'paradigm-parity.frontier' });
assert.equal(syntaxReport.summary.failClosed, false);
assert.equal(syntaxReport.summary.unknownChildCount, 0);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.valueSemantics, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.ownershipModel, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.lifetimeModel, 1);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.bindingScope, 2);
assert.equal(syntaxReport.summary.sourceSyntaxRowFamilyCounts.lowering, 1);

const doc = parseFrontierSource(source, { sourcePath: 'paradigm-parity.frontier' });
const paradigm = doc.metadata.paradigmSemantics;

assert.equal(paradigm.id, 'paradigm_universal_rows');
assert.equal(paradigm.valueSemantics[0].id, 'paradigm_value_persistent');
assert.equal(paradigm.valueSemantics[0].model, 'persistent-data');
assert.equal(paradigm.valueSemantics[0].evidenceIds[0], 'evidence_value');
assert.equal(paradigm.valueSemantics[0].sourceMapId, 'map_value');
assert.equal(paradigm.mutationModels[0].missingEvidence[0], 'ownership-proof');
assert.equal(paradigm.effectModels[0].proofEvidenceIds[0], 'proof_effects');
assert.equal(paradigm.ownershipModels[0].sourceLanguage, 'rust');
assert.equal(paradigm.ownershipModels[0].targetLanguage, 'typescript');
assert.equal(paradigm.lifetimeModels[0].scopeId, 'scope_root');
assert.equal(paradigm.bindings[0].bindingScopeId, 'scope_module');
assert.equal(paradigm.dispatchModels[0].model, 'static');
assert.equal(paradigm.typeModels[0].model, 'structural');
assert.equal(paradigm.moduleModels[0].model, 'esm');
assert.equal(paradigm.concurrencyModels[0].model, 'event-loop');
assert.equal(paradigm.errorModels[0].model, 'result');
assert.equal(paradigm.memoryModels[0].model, 'garbage-collected');
assert.equal(paradigm.evaluationModels.map((record) => record.id).includes('paradigm_evaluation_lazy'), true);
assert.equal(paradigm.evaluationModels.map((record) => record.id).includes('paradigm_evaluation_eager'), true);
assert.equal(paradigm.metaprogrammingRecords[0].phase, 'compile-time');
assert.equal(paradigm.interopRecords[0].mode, 'abi-boundary');
assert.equal(paradigm.memoryLocations[0].sourcePath, 'src/cache.ts');
assert.equal(paradigm.loweringRecords[0].lossIds[0], 'loss_ffi');
assert.equal(paradigm.valueSemantics[0].sourceSpan.path, 'paradigm-parity.frontier');
assert.equal(paradigm.valueSemantics[0].sourceSpan.blockKind, 'paradigmSemantics');
assert.equal(paradigm.query.recordIds.includes('paradigm_value_persistent'), true);
assert.equal(paradigm.query.evidenceIds.includes('evidence_value'), true);
assert.equal(paradigm.query.proofEvidenceIds.includes('proof_effects'), true);
assert.equal(paradigm.query.lossIds.includes('loss_ffi'), true);
assert.equal(paradigm.query.missingEvidence.includes('ownership-proof'), true);
assert.equal(paradigm.query.sourcePaths.includes('paradigm-parity.frontier'), true);
assert.equal(paradigm.query.rowKinds.includes('valueSemantics'), true);
