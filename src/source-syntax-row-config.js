const appRows = words('mount provide provides required requires require route event asset gate gap proofGap evidence proofEvidence');
const canvasRows = words('element command state stateWrite trace gap proofGap evidence proofEvidence');
const constraintRows = words('variable var constraint hard soft preference prefer collapse admission');
const dialectRows = words('dialect record extern');
const interlinguaRows = words('layer constraint edge obligation proofObligation proof lowering lower source sourceLift lift evidence');
const packageRows = words('metadata dependency script export gap proofGap evidence proofEvidence');
const runtimeRows = words('host runtimeHost hostProfile sourceHost targetHost capability hostCapability hostBinding binding requirement runtimeRequirement requiredRuntime evidence proofEvidence gap proofGap');
const semanticEditRows = words('script semanticEditScript projection semanticEditProjection replay semanticEditReplay');
const gateAdmissionRows = words('gate evidence proofEvidence admission admissionDecision gap proofGap');

export const ROW_SYNTAX_CONFIG = Object.freeze({
  interlingua: rowConfig('interlinguaRow', 'interlingua_row', interlinguaRows, normalizeInterlinguaRow),
  universalInterlingua: rowConfig('interlinguaRow', 'interlingua_row', interlinguaRows, normalizeInterlinguaRow),
  dialectRegistry: rowConfig('dialectRegistryRow', 'dialect_registry_row', dialectRows, normalizeDialectRegistryRow),
  universalDialectRegistry: rowConfig('dialectRegistryRow', 'dialect_registry_row', dialectRows, normalizeDialectRegistryRow),
  runtimeCapabilities: rowConfig('runtimeCapabilityRow', 'runtime_capability_row', runtimeRows, normalizeRuntimeCapabilityRow),
  runtimeCapabilityMatrix: rowConfig('runtimeCapabilityRow', 'runtime_capability_row', runtimeRows, normalizeRuntimeCapabilityRow),
  runtimeHosts: rowConfig('runtimeCapabilityRow', 'runtime_capability_row', runtimeRows, normalizeRuntimeCapabilityRow),
  resourceGraph: rowConfig('resourceGraphRow', 'resource_graph_row', words('resource owner loan alias move drop escape lifetime lifetimeRegion life outlives lifetimeRelation lifeRelation borrow borrowScope borrowRegion unsafe unsafeBoundary conflict proof proofObligation obligation'), normalizeResourceGraphRow),
  semanticResourceGraph: rowConfig('resourceGraphRow', 'resource_graph_row', words('resource owner loan alias move drop escape lifetime lifetimeRegion life outlives lifetimeRelation lifeRelation borrow borrowScope borrowRegion unsafe unsafeBoundary conflict proof proofObligation obligation'), normalizeResourceGraphRow),
  applicationSurface: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow),
  appHost: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow),
  plugin: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow),
  pluginSurface: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow),
  pluginContract: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow),
  target: rowConfig('targetProjectionRow', 'target_projection_row', words('projection lowering layer')),
  packageManifest: rowConfig('packageManifestRow', 'package_manifest_row', packageRows, normalizeProofEvidenceRows),
  packageGraph: rowConfig('packageManifestRow', 'package_manifest_row', packageRows, normalizeProofEvidenceRows),
  packageSurface: rowConfig('packageManifestRow', 'package_manifest_row', packageRows, normalizeProofEvidenceRows),
  canvasSurface: rowConfig('canvasSurfaceRow', 'canvas_surface_row', canvasRows, normalizeCanvasSurfaceRow),
  canvasGraph: rowConfig('canvasSurfaceRow', 'canvas_surface_row', canvasRows, normalizeCanvasSurfaceRow),
  constraintSpace: rowConfig('constraintSpaceRow', 'constraint_space_row', constraintRows, normalizeConstraintSpaceRow),
  possibilitySpace: rowConfig('constraintSpaceRow', 'constraint_space_row', constraintRows, normalizeConstraintSpaceRow),
  decisionGraph: rowConfig('decisionGraphRow', 'decision_graph_row', words('node edge chunk gate evidence semanticChange change patchEvent patch admissionDecision admission candidateDecision candidate mergeDecision merge replay tournament tournamentCandidate panelProjection panel rsiLoop improvementFeedback feedback'), normalizeDecisionGraphRow),
  admissionGraph: rowConfig('decisionGraphRow', 'decision_graph_row', words('node edge chunk gate evidence semanticChange change patchEvent patch admissionDecision admission candidateDecision candidate mergeDecision merge replay tournament tournamentCandidate panelProjection panel rsiLoop improvementFeedback feedback'), normalizeDecisionGraphRow),
  gateEvidence: rowConfig('gateAdmissionEvidenceRow', 'gate_admission_evidence_row', gateAdmissionRows, normalizeGateAdmissionRow),
  admissionEvidence: rowConfig('gateAdmissionEvidenceRow', 'gate_admission_evidence_row', gateAdmissionRows, normalizeGateAdmissionRow),
  routeEvidence: rowConfig('gateAdmissionEvidenceRow', 'gate_admission_evidence_row', gateAdmissionRows, normalizeGateAdmissionRow),
  operations: rowConfig('semanticOperationRow', 'semantic_operation_row', words('operation op'), normalizeOperationRow),
  semanticOperations: rowConfig('semanticOperationRow', 'semantic_operation_row', words('operation op'), normalizeOperationRow),
  semanticEdits: rowConfig('semanticEditRecordRow', 'semantic_edit_record_row', semanticEditRows, normalizeSemanticEditRow),
  semanticEditRecords: rowConfig('semanticEditRecordRow', 'semantic_edit_record_row', semanticEditRows, normalizeSemanticEditRow),
  paradigm: rowConfig('paradigmRow', 'paradigm_row', words('valueSemantics mutationModel effectModel ownership ownershipModel lifetime lifetimeModel bindingScope binding dispatch typeModel moduleModel concurrency errorModel memoryModel evaluation metaprogramming interop lowering'), normalizeParadigmRow),
  paradigmSemantics: rowConfig('paradigmRow', 'paradigm_row', words('valueSemantics mutationModel effectModel ownership ownershipModel lifetime lifetimeModel bindingScope binding dispatch typeModel moduleModel concurrency errorModel memoryModel evaluation metaprogramming interop lowering'), normalizeParadigmRow),
  proof: rowConfig('proofRow', 'proof_row', words('contract refinement invariant termination temporal obligation artifact assumption')),
  nativeSource: rowConfig('nativeSourceRow', 'native_source_row', words('loss evidence proofEvidence sourceMap sourcemap mapping sourceMapMapping mergeCandidate candidate'), normalizeNativeSourceRow)
});

function rowConfig(childKind, idPrefix, rowKinds, normalize) {
  return { childKind, idPrefix, rowKinds: new Set(rowKinds), normalize };
}

function words(source) { return source.split(/\s+/); }

function normalizeInterlinguaRow(rowKind) {
  if (rowKind === 'edge') return 'constraint';
  if (rowKind === 'proof' || rowKind === 'proofObligation') return 'obligation';
  if (rowKind === 'lower' || rowKind === 'lowering') return 'lowering';
  if (rowKind === 'source' || rowKind === 'sourceLift') return 'lift';
  return rowKind;
}

function normalizeDialectRegistryRow(rowKind) {
  if (rowKind === 'record') return 'dialect';
  return rowKind;
}

function normalizeRuntimeCapabilityRow(rowKind) {
  if (rowKind === 'capability') return 'hostCapability';
  if (rowKind === 'binding') return 'hostBinding';
  if (rowKind === 'requirement' || rowKind === 'requiredRuntime') return 'runtimeRequirement';
  if (rowKind === 'proofEvidence') return 'evidence';
  if (rowKind === 'gap') return 'proofGap';
  return rowKind;
}

function normalizeResourceGraphRow(rowKind) {
  if (rowKind === 'life' || rowKind === 'lifetimeRegion') return 'lifetime';
  if (rowKind === 'lifeRelation') return 'lifetimeRelation';
  if (rowKind === 'borrowRegion') return 'borrowScope';
  if (rowKind === 'unsafe') return 'unsafeBoundary';
  if (rowKind === 'proof' || rowKind === 'proofObligation') return 'obligation';
  return rowKind;
}

function normalizeApplicationSurfaceRow(rowKind) {
  if (rowKind === 'provide' || rowKind === 'provides') return 'provided-surface';
  if (rowKind === 'required' || rowKind === 'requires' || rowKind === 'require') return 'required-capability';
  if (rowKind === 'proofEvidence') return 'evidence';
  if (rowKind === 'gap') return 'proofGap';
  return rowKind;
}

function normalizeProofEvidenceRows(rowKind) {
  if (rowKind === 'proofEvidence') return 'evidence';
  if (rowKind === 'gap') return 'proofGap';
  return rowKind;
}

function normalizeCanvasSurfaceRow(rowKind) {
  if (rowKind === 'stateWrite') return 'state-write';
  return normalizeProofEvidenceRows(rowKind);
}

function normalizeConstraintSpaceRow(rowKind) {
  if (rowKind === 'var') return 'variable';
  if (rowKind === 'hard' || rowKind === 'soft') return 'constraint';
  if (rowKind === 'prefer') return 'preference';
  return rowKind;
}

function normalizeDecisionGraphRow(rowKind) {
  if (rowKind === 'change') return 'semanticChange';
  if (rowKind === 'patch') return 'patchEvent';
  if (rowKind === 'admission') return 'admissionDecision';
  if (rowKind === 'candidate') return 'candidateDecision';
  if (rowKind === 'merge') return 'mergeDecision';
  if (rowKind === 'panel') return 'panelProjection';
  if (rowKind === 'feedback') return 'improvementFeedback';
  return rowKind;
}

function normalizeOperationRow(rowKind) {
  if (rowKind === 'op') return 'operation';
  return rowKind;
}

function normalizeSemanticEditRow(rowKind) {
  if (rowKind === 'semanticEditScript') return 'script';
  if (rowKind === 'semanticEditProjection') return 'projection';
  if (rowKind === 'semanticEditReplay') return 'replay';
  return rowKind;
}

function normalizeGateAdmissionRow(rowKind) {
  if (rowKind === 'proofEvidence') return 'evidence';
  if (rowKind === 'admissionDecision') return 'admission';
  if (rowKind === 'gap') return 'proofGap';
  return rowKind;
}

function normalizeParadigmRow(rowKind) {
  if (rowKind === 'ownership') return 'ownershipModel';
  if (rowKind === 'lifetime') return 'lifetimeModel';
  if (rowKind === 'binding') return 'bindingScope';
  return rowKind;
}

function normalizeNativeSourceRow(rowKind) {
  if (rowKind === 'proofEvidence') return 'evidence';
  if (rowKind === 'sourcemap' || rowKind === 'mapping' || rowKind === 'sourceMapMapping') return 'sourceMap';
  if (rowKind === 'candidate') return 'mergeCandidate';
  return rowKind;
}
