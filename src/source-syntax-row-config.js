const appRows = words('role sourcePath path sourceHash host hostId mount provide provides required requires require route event asset gate gap proofGap evidence proofEvidence');
const canvasRows = words('sourcePath path sourceHash element command state stateWrite trace gap proofGap evidence proofEvidence');
const constraintRows = words('variable var constraint hard soft preference prefer collapse admission');
const dialectRows = words('language sourceLanguage sourcePath path sourceHash dialect record extern');
const interlinguaRows = words('layer constraint constraintEdge edge obligation proofObligation proof lowering lower source sourceLift lift evidence');
const machineRows = words('label directive register reg flag conditionFlag basicBlock block instruction inst instr op opcode operand arg memoryEffect memoryAccess load store atomic fence memory mem effect controlEdge edge branch call return ret interrupt irq exception proof proofObligation obligation gap proofGap evidence proofEvidence');
const migrationRows = words('from fromVersion to toVersion change invariant invariants');
const packageRows = words('sourcePath path sourceHash packageManager metadata dependency script export gap proofGap evidence proofEvidence');
const runtimeRows = words('host runtimeHost hostProfile sourceHost targetHost capability hostCapability hostBinding binding requirement runtimeRequirement requiredRuntime evidence proofEvidence gap proofGap');
const semanticEditRows = words('script semanticEditScript projection semanticEditProjection replay semanticEditReplay');
const gateAdmissionRows = words('gate evidence proofEvidence admission admissionDecision proofObligation obligation gap proofGap');
const resourceRows = words('sourceLanguage language sourcePath path sourceHash status evidence evidenceIds resource owner loan alias move drop escape lifetime lifetimeRegion life outlives lifetimeRelation lifeRelation borrow borrowScope borrowRegion unsafe unsafeBoundary memory memoryRegion region layout dataLayout pointer ptr address access memoryAccess atomic volatile abi abiBoundary callBoundary sync synchronization synchronisation synchronizationEdge synchronisationEdge happensBefore happens-before hb fence fenceEdge barrier barrierEdge trap traps undefined undefinedBehavior undefinedBehaviour ub conflict proof proofObligation obligation proofEvidence sourceMap sourcemap mapping sourceMapMapping missingEvidence');
const targetRows = words('language targetLanguage sourceLanguage package packageName emitPath targetPath sourcePath path sourceHash targetHash runtime runtimeHost moduleFormat projection lowering lower layer adapter adapterId readiness disposition status evidence proofEvidence proof loss missingEvidence gap proofGap sourceMap sourcemap mapping sourceMapMapping');
const nativeSourceRows = words('language sourceLanguage parser parserVersion sourcePath path sourceHash symbol frontierNodes frontierNode frontierNodeId frontierNodeIds loss evidence proofEvidence sourceMap sourcemap mapping sourceMapMapping mergeCandidate candidate');
const coreFailClosed = (reason) => ({ failClosedUnknownRows: true, unknownRowReason: reason });

export const ROW_SYNTAX_CONFIG = Object.freeze({
  interlingua: rowConfig('interlinguaRow', 'interlingua_row', interlinguaRows, normalizeInterlinguaRow, coreFailClosed('unsupported-interlingua-row')),
  universalInterlingua: rowConfig('interlinguaRow', 'interlingua_row', interlinguaRows, normalizeInterlinguaRow, coreFailClosed('unsupported-interlingua-row')),
  dialectRegistry: rowConfig('dialectRegistryRow', 'dialect_registry_row', dialectRows, normalizeDialectRegistryRow, coreFailClosed('unsupported-dialect-registry-row')),
  universalDialectRegistry: rowConfig('dialectRegistryRow', 'dialect_registry_row', dialectRows, normalizeDialectRegistryRow, coreFailClosed('unsupported-dialect-registry-row')),
  runtimeCapabilities: rowConfig('runtimeCapabilityRow', 'runtime_capability_row', runtimeRows, normalizeRuntimeCapabilityRow, coreFailClosed('unsupported-runtime-capability-row')),
  runtimeCapabilityMatrix: rowConfig('runtimeCapabilityRow', 'runtime_capability_row', runtimeRows, normalizeRuntimeCapabilityRow, coreFailClosed('unsupported-runtime-capability-row')),
  runtimeHosts: rowConfig('runtimeCapabilityRow', 'runtime_capability_row', runtimeRows, normalizeRuntimeCapabilityRow, coreFailClosed('unsupported-runtime-capability-row')),
  resourceGraph: rowConfig('resourceGraphRow', 'resource_graph_row', resourceRows, normalizeResourceGraphRow, coreFailClosed('unsupported-resource-graph-row')),
  semanticResourceGraph: rowConfig('resourceGraphRow', 'resource_graph_row', resourceRows, normalizeResourceGraphRow, coreFailClosed('unsupported-resource-graph-row')),
  machineGraph: rowConfig('machineGraphRow', 'machine_graph_row', machineRows, normalizeMachineGraphRow, coreFailClosed('unsupported-machine-graph-row')),
  executionGraph: rowConfig('machineGraphRow', 'machine_graph_row', machineRows, normalizeMachineGraphRow, coreFailClosed('unsupported-machine-graph-row')),
  lowLevelGraph: rowConfig('machineGraphRow', 'machine_graph_row', machineRows, normalizeMachineGraphRow, coreFailClosed('unsupported-machine-graph-row')),
  migration: rowConfig('migrationRow', 'migration_row', migrationRows, normalizeMigrationRow, coreFailClosed('unsupported-migration-row')),
  capability: rowConfig('capabilityRow', 'capability_row', words('capability category input returns effects resources adapter unsupported unsupportedTarget'), normalizeCapabilityRow, coreFailClosed('unsupported-capability-row')),
  effect: rowConfig('effectRow', 'effect_row', words('capability input returns resources'), undefined, coreFailClosed('unsupported-effect-row')),
  extern: rowConfig('externRow', 'extern_row', words('language target symbol input returns effects uses resources'), normalizeExternRow, coreFailClosed('unsupported-extern-row')),
  lattice: rowConfig('latticeRow', 'lattice_row', words('carrier law laws frontierCrdt frontier-crdt lawChecker'), normalizeLatticeRow, coreFailClosed('unsupported-lattice-row')),
  applicationSurface: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow, coreFailClosed('unsupported-application-surface-row')),
  appHost: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow, coreFailClosed('unsupported-application-surface-row')),
  plugin: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow, coreFailClosed('unsupported-application-surface-row')),
  pluginSurface: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow, coreFailClosed('unsupported-application-surface-row')),
  pluginContract: rowConfig('applicationSurfaceRow', 'application_surface_row', appRows, normalizeApplicationSurfaceRow, coreFailClosed('unsupported-application-surface-row')),
  target: rowConfig('targetProjectionRow', 'target_projection_row', targetRows, normalizeTargetProjectionRow, coreFailClosed('unsupported-target-projection-row')),
  packageManifest: rowConfig('packageManifestRow', 'package_manifest_row', packageRows, normalizePackageManifestRow, coreFailClosed('unsupported-package-manifest-row')),
  packageGraph: rowConfig('packageManifestRow', 'package_manifest_row', packageRows, normalizePackageManifestRow, coreFailClosed('unsupported-package-manifest-row')),
  packageSurface: rowConfig('packageManifestRow', 'package_manifest_row', packageRows, normalizePackageManifestRow, coreFailClosed('unsupported-package-manifest-row')),
  canvasSurface: rowConfig('canvasSurfaceRow', 'canvas_surface_row', canvasRows, normalizeCanvasSurfaceRow, coreFailClosed('unsupported-canvas-surface-row')),
  canvasGraph: rowConfig('canvasSurfaceRow', 'canvas_surface_row', canvasRows, normalizeCanvasSurfaceRow, coreFailClosed('unsupported-canvas-surface-row')),
  constraintSpace: rowConfig('constraintSpaceRow', 'constraint_space_row', constraintRows, normalizeConstraintSpaceRow, coreFailClosed('unsupported-constraint-space-row')),
  possibilitySpace: rowConfig('constraintSpaceRow', 'constraint_space_row', constraintRows, normalizeConstraintSpaceRow, coreFailClosed('unsupported-constraint-space-row')),
  decisionGraph: rowConfig('decisionGraphRow', 'decision_graph_row', words('node edge chunk gate evidence semanticChange change patchEvent patch admissionDecision admission candidateDecision candidate mergeDecision merge replay tournament tournamentCandidate panelProjection panel rsiLoop improvementFeedback feedback'), normalizeDecisionGraphRow, coreFailClosed('unsupported-decision-graph-row')),
  admissionGraph: rowConfig('decisionGraphRow', 'decision_graph_row', words('node edge chunk gate evidence semanticChange change patchEvent patch admissionDecision admission candidateDecision candidate mergeDecision merge replay tournament tournamentCandidate panelProjection panel rsiLoop improvementFeedback feedback'), normalizeDecisionGraphRow, coreFailClosed('unsupported-decision-graph-row')),
  gateEvidence: rowConfig('gateAdmissionEvidenceRow', 'gate_admission_evidence_row', gateAdmissionRows, normalizeGateAdmissionRow, coreFailClosed('unsupported-gate-admission-row')),
  admissionEvidence: rowConfig('gateAdmissionEvidenceRow', 'gate_admission_evidence_row', gateAdmissionRows, normalizeGateAdmissionRow, coreFailClosed('unsupported-gate-admission-row')),
  routeEvidence: rowConfig('gateAdmissionEvidenceRow', 'gate_admission_evidence_row', gateAdmissionRows, normalizeGateAdmissionRow, coreFailClosed('unsupported-gate-admission-row')),
  operations: rowConfig('semanticOperationRow', 'semantic_operation_row', words('operation op semanticOperation'), normalizeOperationRow, coreFailClosed('unsupported-semantic-operation-row')),
  semanticOperations: rowConfig('semanticOperationRow', 'semantic_operation_row', words('operation op semanticOperation'), normalizeOperationRow, coreFailClosed('unsupported-semantic-operation-row')),
  semanticEdits: rowConfig('semanticEditRecordRow', 'semantic_edit_record_row', semanticEditRows, normalizeSemanticEditRow, coreFailClosed('unsupported-semantic-edit-record-row')),
  semanticEditRecords: rowConfig('semanticEditRecordRow', 'semantic_edit_record_row', semanticEditRows, normalizeSemanticEditRow, coreFailClosed('unsupported-semantic-edit-record-row')),
  paradigm: rowConfig('paradigmRow', 'paradigm_row', words('valueSemantics mutationModel effectModel ownership ownershipModel lifetime lifetimeModel bindingScope binding dispatch typeModel moduleModel concurrency errorModel memoryModel evaluation metaprogramming interop lowering'), normalizeParadigmRow, coreFailClosed('unsupported-paradigm-row')),
  paradigmSemantics: rowConfig('paradigmRow', 'paradigm_row', words('valueSemantics mutationModel effectModel ownership ownershipModel lifetime lifetimeModel bindingScope binding dispatch typeModel moduleModel concurrency errorModel memoryModel evaluation metaprogramming interop lowering'), normalizeParadigmRow, coreFailClosed('unsupported-paradigm-row')),
  proof: rowConfig('proofRow', 'proof_row', words('contract refinement invariant termination temporal obligation artifact assumption'), undefined, coreFailClosed('unsupported-proof-row')),
  nativeSource: rowConfig('nativeSourceRow', 'native_source_row', nativeSourceRows, normalizeNativeSourceRow, coreFailClosed('unsupported-native-source-row'))
});

function rowConfig(childKind, idPrefix, rowKinds, normalize, options = {}) {
  return { childKind, idPrefix, rowKinds: new Set(rowKinds), normalize, ...options };
}

function words(source) { return source.split(/\s+/); }

function normalizeInterlinguaRow(rowKind) {
  if (rowKind === 'constraintEdge' || rowKind === 'edge') return 'constraint';
  if (rowKind === 'proof' || rowKind === 'proofObligation') return 'obligation';
  if (rowKind === 'lower' || rowKind === 'lowering') return 'lowering';
  if (rowKind === 'source' || rowKind === 'sourceLift') return 'lift';
  return rowKind;
}

function normalizeDialectRegistryRow(rowKind) {
  if (rowKind === 'sourceLanguage') return 'language';
  if (rowKind === 'path') return 'sourcePath';
  if (rowKind === 'record') return 'dialect';
  return rowKind;
}

function normalizeRuntimeCapabilityRow(rowKind) {
  if (rowKind === 'host' || rowKind === 'runtimeHost' || rowKind === 'sourceHost' || rowKind === 'targetHost') return 'hostProfile';
  if (rowKind === 'capability') return 'hostCapability';
  if (rowKind === 'binding') return 'hostBinding';
  if (rowKind === 'requirement' || rowKind === 'requiredRuntime') return 'runtimeRequirement';
  if (rowKind === 'proofEvidence') return 'evidence';
  if (rowKind === 'gap') return 'proofGap';
  return rowKind;
}

function normalizeTargetProjectionRow(rowKind) {
  if (rowKind === 'targetLanguage') return 'language';
  if (rowKind === 'package') return 'packageName';
  if (rowKind === 'path') return 'sourcePath';
  if (rowKind === 'targetPath') return 'emitPath';
  if (rowKind === 'lower') return 'lowering';
  if (rowKind === 'adapter') return 'adapterId';
  if (rowKind === 'proof' || rowKind === 'proofEvidence') return 'evidence';
  if (rowKind === 'gap') return 'proofGap';
  if (rowKind === 'sourcemap' || rowKind === 'mapping' || rowKind === 'sourceMapMapping') return 'sourceMap';
  return rowKind;
}

function normalizeResourceGraphRow(rowKind) {
  if (rowKind === 'language') return 'sourceLanguage';
  if (rowKind === 'path') return 'sourcePath';
  if (rowKind === 'lifetime' || rowKind === 'life') return 'lifetimeRegion';
  if (rowKind === 'outlives' || rowKind === 'lifeRelation') return 'lifetimeRelation';
  if (rowKind === 'borrow' || rowKind === 'borrowRegion') return 'borrowScope';
  if (rowKind === 'unsafe') return 'unsafeBoundary';
  if (rowKind === 'memory' || rowKind === 'region') return 'memoryRegion';
  if (rowKind === 'layout') return 'dataLayout';
  if (rowKind === 'pointer' || rowKind === 'ptr' || rowKind === 'address') return 'pointerEdge';
  if (rowKind === 'access' || rowKind === 'atomic' || rowKind === 'volatile') return 'memoryAccess';
  if (rowKind === 'abi' || rowKind === 'callBoundary') return 'abiBoundary';
  if (rowKind === 'sync' || rowKind === 'synchronization' || rowKind === 'synchronisation' || rowKind === 'synchronisationEdge' || rowKind === 'happensBefore' || rowKind === 'happens-before' || rowKind === 'hb' || rowKind === 'fence' || rowKind === 'fenceEdge' || rowKind === 'barrier' || rowKind === 'barrierEdge') return 'synchronizationEdge';
  if (rowKind === 'traps') return 'trap';
  if (rowKind === 'undefined' || rowKind === 'undefinedBehaviour' || rowKind === 'ub') return 'undefinedBehavior';
  if (rowKind === 'proof' || rowKind === 'obligation') return 'proofObligation';
  if (rowKind === 'evidenceIds' || rowKind === 'proofEvidence') return 'evidence';
  if (rowKind === 'sourcemap' || rowKind === 'mapping' || rowKind === 'sourceMapMapping') return 'sourceMap';
  return rowKind;
}

function normalizeMachineGraphRow(rowKind) {
  if (rowKind === 'reg') return 'register';
  if (rowKind === 'conditionFlag') return 'flag';
  if (rowKind === 'block') return 'basicBlock';
  if (rowKind === 'inst' || rowKind === 'instr' || rowKind === 'op' || rowKind === 'opcode') return 'instruction';
  if (rowKind === 'arg') return 'operand';
  if (rowKind === 'memory' || rowKind === 'mem' || rowKind === 'memoryAccess' || rowKind === 'effect' || rowKind === 'load' || rowKind === 'store' || rowKind === 'atomic' || rowKind === 'fence') return 'memoryEffect';
  if (rowKind === 'edge') return 'controlEdge';
  if (rowKind === 'ret') return 'return';
  if (rowKind === 'irq' || rowKind === 'exception') return 'interrupt';
  if (rowKind === 'proof' || rowKind === 'obligation') return 'proofObligation';
  if (rowKind === 'gap') return 'proofGap';
  if (rowKind === 'proofEvidence') return 'evidence';
  return rowKind;
}

function normalizeMigrationRow(rowKind) {
  if (rowKind === 'from') return 'fromVersion';
  if (rowKind === 'to') return 'toVersion';
  if (rowKind === 'invariant') return 'invariants';
  return rowKind;
}

function normalizeCapabilityRow(rowKind) {
  if (rowKind === 'unsupported') return 'unsupportedTarget';
  return rowKind;
}

function normalizeExternRow(rowKind) {
  if (rowKind === 'target') return 'language';
  if (rowKind === 'uses') return 'effects';
  return rowKind;
}

function normalizeLatticeRow(rowKind) {
  if (rowKind === 'law') return 'laws';
  if (rowKind === 'frontier-crdt') return 'frontierCrdt';
  return rowKind;
}

function normalizeApplicationSurfaceRow(rowKind) {
  if (rowKind === 'path') return 'sourcePath';
  if (rowKind === 'hostId') return 'host';
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

function normalizePackageManifestRow(rowKind) {
  if (rowKind === 'path') return 'sourcePath';
  return normalizeProofEvidenceRows(rowKind);
}

function normalizeCanvasSurfaceRow(rowKind) {
  if (rowKind === 'path') return 'sourcePath';
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
  if (rowKind === 'op' || rowKind === 'semanticOperation') return 'operation';
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
  if (rowKind === 'obligation') return 'proofObligation';
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
  if (rowKind === 'sourceLanguage') return 'language';
  if (rowKind === 'path') return 'sourcePath';
  if (rowKind === 'frontierNode' || rowKind === 'frontierNodeId' || rowKind === 'frontierNodeIds') return 'frontierNodes';
  if (rowKind === 'proofEvidence') return 'evidence';
  if (rowKind === 'sourcemap' || rowKind === 'mapping' || rowKind === 'sourceMapMapping') return 'sourceMap';
  if (rowKind === 'candidate') return 'mergeCandidate';
  return rowKind;
}
