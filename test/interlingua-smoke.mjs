import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const doc = parseFrontierSource(`module InterlinguaProbe @id("mod_interlingua_probe") {
interlingua JsToRust @id("interlingua_js_rust") {
  route conversion_route_javascript_to_rust
  sourceLanguage javascript
  target rust
  mode target-adapter
  lift source @id("lift_js") sourceImport native_import_js sourcePath src/public-api.js sourceHash sha256:source sourceMap source_map_js ownership symbol:displayName conflict symbol:displayName evidence evidence_translation proof proof_translation
  layer symbols @id("layer_symbols") kind semantic-symbol status represented evidence evidence_translation
  layer ownership @id("layer_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
  constraint borrowAwait @id("constraint_borrow_await") family borrow-scope layer semantic-ownership status needs-evidence action collect-borrow-scope required shared-borrow-compatible|borrow-across-await represented shared-borrow-compatible missing borrow-across-await missingEvidence translation-borrow-scope:borrow-across-await evidence evidence_borrow_scope obligation obligation_borrow_await
  obligation borrowAwait @id("obligation_borrow_await") edge constraint_borrow_await family borrow-scope kind borrow-across-await status missing missingEvidence translation-borrow-scope:borrow-across-await evidence evidence_borrow_scope severity warning
  lowering rustAdapter @id("lowering_rust_adapter") disposition target-adapter adapter fixture-js-rust adapterKind targetProjection readiness needs-review lossClass targetAdapterProjection proofEvidence proof_translation missingEvidence host-target-adapter-review review adapter-review
  evidence translation @id("evidence_translation") kind conversion-replay-proof status passed path reports/conversion.json
}
}`);

const interlingua = doc.metadata.universalInterlingua;
assert.equal(interlingua.id, 'interlingua_js_rust');
assert.equal(interlingua.summary.interlinguaCount, 1);
assert.equal(interlingua.summary.layerCount, 2);
assert.equal(interlingua.summary.constraintCount, 1);
assert.equal(interlingua.summary.obligationCount, 1);
assert.equal(interlingua.summary.loweringCount, 1);
assert.equal(interlingua.summary.liftCount, 1);
assert.equal(interlingua.summary.evidenceCount, 1);
assert.equal(interlingua.interlinguaRecordIds[0], 'interlingua_js_rust');
assert.equal(interlingua.routeIds[0], 'conversion_route_javascript_to_rust');
assert.equal(interlingua.constraintIds[0], 'constraint_borrow_await');
assert.equal(interlingua.obligationIds[0], 'obligation_borrow_await');
assert.equal(interlingua.interlinguaRecords[0].kind, 'frontier.lang.universalInterlinguaRecord');
assert.equal(interlingua.interlinguaRecords[0].claims.semanticEquivalenceClaim, false);
assert.equal(interlingua.interlinguaRecords[0].layers.representedKinds[0], 'semantic-symbol');
assert.equal(interlingua.interlinguaRecords[0].layers.missingKinds.includes('semantic-ownership'), true);
assert.equal(interlingua.interlinguaRecords[0].constraints.families[0], 'borrow-scope');
assert.equal(interlingua.interlinguaRecords[0].constraints.requiredKinds.includes('borrow-across-await'), true);
assert.equal(interlingua.interlinguaRecords[0].constraints.obligationKinds[0], 'borrow-across-await');
assert.equal(interlingua.interlinguaRecords[0].lowering.disposition, 'target-adapter');
assert.equal(interlingua.interlinguaRecords[0].query.interlinguaProofEvidenceId, undefined);
assert.equal(interlingua.interlinguaRecords[0].query.proofEvidenceIds[0], 'proof_translation');
assert.equal(interlingua.interlinguaRecords[0].query.constraintObligationMissingEvidence[0], 'translation-borrow-scope:borrow-across-await');
assert.equal(interlingua.interlinguaRecords[0].lift.sourceImportIds[0], 'native_import_js');
assert.equal(interlingua.interlinguaRecords[0].lift.proofIds[0], 'proof_translation');
assert.equal(interlingua.evidenceIds.includes('evidence_translation'), true);
