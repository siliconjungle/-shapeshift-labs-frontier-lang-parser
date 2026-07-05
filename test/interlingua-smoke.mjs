import assert from 'node:assert/strict';
import { inspectFrontierSourceSyntax, parseFrontierSource } from '../dist/index.js';

const sourceSyntaxReport = inspectFrontierSourceSyntax(`module InterlinguaSourceSyntax @id("mod_interlingua_source_syntax") {
universalInterlingua JsToRust @id("interlingua_source_syntax") {
  route conversion_route_javascript_to_rust
  sourceLanguage javascript
  target rust
  mode target-adapter
  edge borrowAwait @id("edge_borrow_await") family borrow-scope layer semantic-ownership status needs-evidence
  constraintEdge dataLayout @id("edge_data_layout") family data-layout layer memory-model status represented
  proof borrowAwait @id("proof_borrow_await") edge edge_borrow_await family borrow-scope kind borrow-across-await status missing
  lower rustAdapter @id("lower_rust_adapter") disposition target-adapter adapter fixture-js-rust readiness needs-review
  sourceLift jsSource @id("lift_js_source") sourceImport native_import_js sourcePath src/public-api.js
  evidence translation @id("evidence_translation") kind conversion-replay-proof status passed
}
}`, { sourcePath: 'interlingua-source-syntax.frontier' });

const interlinguaCounts = sourceSyntaxReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.universalInterlingua;
assert.equal(sourceSyntaxReport.summary.failClosed, false);
assert.equal(interlinguaCounts.route, 1);
assert.equal(interlinguaCounts.sourceLanguage, 1);
assert.equal(interlinguaCounts.target, 1);
assert.equal(interlinguaCounts.mode, 1);
assert.equal(interlinguaCounts.constraint, 2);
assert.equal(interlinguaCounts.obligation, 1);
assert.equal(interlinguaCounts.lowering, 1);
assert.equal(interlinguaCounts.lift, 1);
assert.equal(interlinguaCounts.evidence, 1);

const sourceSyntaxBlock = sourceSyntaxReport.recognizedBlocks.find((block) => block.id === 'interlingua_source_syntax');
assert.equal(sourceSyntaxBlock.children.find((child) => child.rowKind === 'route').normalizedRowKind, 'route');
assert.equal(sourceSyntaxBlock.children.find((child) => child.rowKind === 'sourceLanguage').normalizedRowKind, 'sourceLanguage');
assert.equal(sourceSyntaxBlock.children.find((child) => child.rowKind === 'target').normalizedRowKind, 'target');
assert.equal(sourceSyntaxBlock.children.find((child) => child.rowKind === 'mode').normalizedRowKind, 'mode');
assert.equal(sourceSyntaxBlock.children.find((child) => child.rowKind === 'constraintEdge').normalizedRowKind, 'constraint');
assert.equal(sourceSyntaxBlock.children.find((child) => child.rowKind === 'proof').normalizedRowKind, 'obligation');
assert.equal(sourceSyntaxBlock.children.find((child) => child.rowKind === 'lower').normalizedRowKind, 'lowering');
assert.equal(sourceSyntaxBlock.children.find((child) => child.rowKind === 'sourceLift').normalizedRowKind, 'lift');
assert.equal(sourceSyntaxBlock.children[0].sourceSpan.path, 'interlingua-source-syntax.frontier');
assert.equal(sourceSyntaxBlock.children[0].sourceSpan.blockKind, 'universalInterlingua');

const sourceAliasReport = inspectFrontierSourceSyntax(`module InterlinguaSourceAlias @id("mod_interlingua_source_alias") {
interlingua JsToRust @id("interlingua_source_alias") {
  route conversion_route_javascript_to_rust
  source javascript
  target rust
  mode target-adapter
  sourceLift jsSource @id("lift_js_source") sourceImport native_import_js sourcePath src/public-api.js
}
}`, { sourcePath: 'interlingua-source-alias.frontier' });

const sourceAliasCounts = sourceAliasReport.summary.sourceSyntaxRowFamilyCountsByBlockFamily.interlingua;
const sourceAliasBlock = sourceAliasReport.recognizedBlocks.find((block) => block.id === 'interlingua_source_alias');
assert.equal(sourceAliasReport.summary.failClosed, false);
assert.equal(sourceAliasCounts.sourceLanguage, 1);
assert.equal(sourceAliasCounts.lift, 1);
assert.equal(sourceAliasBlock.children.find((child) => child.rowKind === 'source').normalizedRowKind, 'sourceLanguage');
assert.equal(sourceAliasBlock.children.find((child) => child.rowKind === 'sourceLift').normalizedRowKind, 'lift');

const unknownInterlingua = inspectFrontierSourceSyntax(`module UnknownInterlinguaRows @id("mod_unknown_interlingua_rows") {
interlingua BrokenBridge @id("interlingua_broken") {
  semanticPromise borrow @id("promise_borrow")
}
}`);

assert.equal(unknownInterlingua.summary.failClosed, true);
assert.equal(unknownInterlingua.summary.unknownChildCount, 1);
assert.equal(unknownInterlingua.summary.sourceSyntaxRowFamilyCounts.semanticPromise, 1);
assert.equal(unknownInterlingua.unknownChildren[0].reason, 'unsupported-interlingua-row');

const doc = parseFrontierSource(`module InterlinguaProbe @id("mod_interlingua_probe") {
interlingua JsToRust @id("interlingua_js_rust") {
  route conversion_route_javascript_to_rust
  sourceLanguage javascript
  target rust
  mode target-adapter
  lift source @id("lift_js") sourceImport native_import_js sourcePath src/public-api.js sourceHash sha256:source sourceMap source_map_js ownership symbol:displayName conflict symbol:displayName evidence evidence_translation proof proof_translation
  layer symbols @id("layer_symbols") kind semantic-symbol status represented evidence evidence_translation
  layer ownership @id("layer_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
  edge borrowAwait @id("constraint_borrow_await") family borrow-scope layer semantic-ownership status needs-evidence action collect-borrow-scope required shared-borrow-compatible|borrow-across-await represented shared-borrow-compatible missing borrow-across-await missingEvidence translation-borrow-scope:borrow-across-await evidence evidence_borrow_scope obligation obligation_borrow_await
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
