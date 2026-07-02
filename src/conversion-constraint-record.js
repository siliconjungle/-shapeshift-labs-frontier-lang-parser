const FAMILY_ROWS = [
  ['type', 'typeConstraints', 'sourceTypes', 'targetTypes', ['typeConstraint', 'type-constraint']],
  ['resourceTransfer', 'resourceTransfers', 'sourceGraphs', 'targetGraphs', ['resourceTransferConstraint', 'resource-transfer', 'resource-transfer-constraint', 'ownership'], { graph: true }],
  ['controlFlow', 'controlFlowConstraints', 'sourceControlFlows', 'targetControlFlows', ['controlFlowConstraint', 'control-flow', 'control-flow-constraint']],
  ['lifetime', 'lifetimeConstraints', 'sourceLifetimeConstraints', 'targetLifetimeConstraints', ['lifetimeConstraint', 'lifetime-constraint']],
  ['borrowScope', 'borrowScopeConstraints', 'sourceBorrowScopes', 'targetBorrowScopes', ['borrowScopeConstraint', 'borrow-scope', 'borrow-scope-constraint']],
  ['borrowChecker', 'borrowCheckerConstraints', 'sourceBorrowScopes', 'targetBorrowScopes', ['borrowCheckerConstraint', 'borrow-checker', 'borrow-checker-constraint']],
  ['callableBoundary', 'callableBoundaryConstraints', 'sourceCallables', 'targetCallables', ['callableBoundaryConstraint', 'callable-boundary', 'callable-boundary-constraint'], { extraSourceKeys: ['sourceCallableBoundaryRecords'], extraTargetKeys: ['targetCallableBoundaryRecords'] }],
  ['adtPattern', 'adtPatternConstraints', 'sourcePatterns', 'targetPatterns', ['adtPatternConstraint', 'adt-pattern', 'adt-pattern-constraint'], { extraSourceKeys: ['sourceAdtPatternRecords'], extraTargetKeys: ['targetAdtPatternRecords'] }],
  ['dataLayout', 'dataLayoutConstraints', 'sourceLayouts', 'targetLayouts', ['dataLayoutConstraint', 'data-layout', 'data-layout-constraint'], { extraSourceKeys: ['sourceDataLayoutRecords'], extraTargetKeys: ['targetDataLayoutRecords'] }],
  ['effect', 'effectConstraints', 'sourceEffects', 'targetEffects', ['effectConstraint', 'effect-constraint']],
  ['concurrencyModel', 'concurrencyModelConstraints', 'sourceConcurrencyModels', 'targetConcurrencyModels', ['concurrencyModelConstraint', 'concurrency-model', 'concurrency-model-constraint'], { extraSourceKeys: ['sourceConcurrencyModelRecords'], extraTargetKeys: ['targetConcurrencyModelRecords'] }],
  ['errorModel', 'errorModelConstraints', 'sourceErrors', 'targetErrors', ['errorModelConstraint', 'error-model', 'error-model-constraint'], { extraSourceKeys: ['sourceErrorModelRecords'], extraTargetKeys: ['targetErrorModelRecords'] }],
  ['evaluationModel', 'evaluationModelConstraints', 'sourceEvaluations', 'targetEvaluations', ['evaluationModelConstraint', 'evaluation-model', 'evaluation-model-constraint'], { extraSourceKeys: ['sourceEvaluationModelRecords'], extraTargetKeys: ['targetEvaluationModelRecords'] }],
  ['hostEnvironment', 'hostEnvironmentConstraints', 'sourceHosts', 'targetHosts', ['hostEnvironmentConstraint', 'host-environment', 'host-environment-constraint'], { extraSourceKeys: ['sourceHostEnvironmentRecords'], extraTargetKeys: ['targetHostEnvironmentRecords'] }],
  ['memoryModel', 'memoryModelConstraints', 'sourceMemoryModels', 'targetMemoryModels', ['memoryModelConstraint', 'memory-model', 'memory-model-constraint'], { extraSourceKeys: ['sourceMemoryModelRecords'], extraTargetKeys: ['targetMemoryModelRecords'] }],
  ['metaprogramming', 'metaprogrammingConstraints', 'sourceMetaprograms', 'targetMetaprograms', ['metaprogrammingConstraint', 'metaprogramming-constraint'], { extraSourceKeys: ['sourceMetaprogrammingRecords'], extraTargetKeys: ['targetMetaprogrammingRecords'] }],
  ['module', 'moduleConstraints', 'sourceModules', 'targetModules', ['moduleConstraint', 'module-constraint']],
  ['scopeBinding', 'scopeBindingConstraints', 'sourceBindings', 'targetBindings', ['scopeBindingConstraint', 'scope-binding', 'scope-binding-constraint'], { extraSourceKeys: ['sourceScopeBindingRecords'], extraTargetKeys: ['targetScopeBindingRecords'] }],
  ['numericSemantics', 'numericSemanticsConstraints', 'sourceNumerics', 'targetNumerics', ['numericSemanticsConstraint', 'numeric-semantics', 'numeric-semantics-constraint'], { extraSourceKeys: ['sourceNumericSemanticsRecords'], extraTargetKeys: ['targetNumericSemanticsRecords'] }],
  ['textSemantics', 'textSemanticsConstraints', 'sourceTexts', 'targetTexts', ['textSemanticsConstraint', 'text-semantics', 'text-semantics-constraint'], { extraSourceKeys: ['sourceTextSemanticsRecords'], extraTargetKeys: ['targetTextSemanticsRecords'] }],
  ['collectionSemantics', 'collectionSemanticsConstraints', 'sourceCollections', 'targetCollections', ['collectionSemanticsConstraint', 'collection-semantics', 'collection-semantics-constraint'], { extraSourceKeys: ['sourceCollectionSemanticsRecords'], extraTargetKeys: ['targetCollectionSemanticsRecords'] }],
  ['serializationSemantics', 'serializationSemanticsConstraints', 'sourceSerializations', 'targetSerializations', ['serializationSemanticsConstraint', 'serialization-semantics', 'serialization-semantics-constraint'], { extraSourceKeys: ['sourceSerializationSemanticsRecords'], extraTargetKeys: ['targetSerializationSemanticsRecords'] }],
  ['dependencySemantics', 'dependencySemanticsConstraints', 'sourceDependencies', 'targetDependencies', ['dependencySemanticsConstraint', 'dependency-semantics', 'dependency-semantics-constraint'], { extraSourceKeys: ['sourceDependencySemanticsRecords'], extraTargetKeys: ['targetDependencySemanticsRecords'] }],
  ['objectModel', 'objectModelConstraints', 'sourceObjects', 'targetObjects', ['objectModelConstraint', 'object-model', 'object-model-constraint'], { extraSourceKeys: ['sourceObjectModelRecords'], extraTargetKeys: ['targetObjectModelRecords'] }],
  ['protocol', 'protocolConstraints', 'sourceProtocols', 'targetProtocols', ['protocolConstraint', 'protocol-constraint']]
];

const WORD_FIELDS = [
  ['symbolId', 'symbol', 'symbolId'], ['symbolName'], ['localName'], ['ownerId', 'owner', 'ownerId'], ['ownerKind'],
  ['bindingKind'], ['referenceKind'], ['scopeId', 'scopeId', 'scope'], ['ownerScopeId'], ['bindingId', 'bindingId', 'binding'],
  ['externalBindingId', 'externalBindingId', 'externalBinding'], ['resolvedBindingId', 'resolvedBindingId', 'resolvedBinding'],
  ['declarationId', 'declarationId', 'declaration'], ['referenceId', 'referenceId', 'reference'], ['occurrenceId', 'occurrenceId', 'occurrence'],
  ['resolvedName'], ['namespace'], ['scopeType'], ['variableScopeType'], ['lookupKind'], ['resolutionKind', 'resolutionKind', 'moduleResolutionKind'],
  ['moduleKind'], ['edgeKind'], ['declarationKind'], ['specifier', 'specifier', 'moduleSpecifier'], ['moduleSpecifier', 'moduleSpecifier', 'specifier'],
  ['importedName', 'importedName', 'importName'], ['importName', 'importName', 'importedName'], ['exportedName', 'exportedName', 'exportName'],
  ['exportName', 'exportName', 'exportedName'], ['reExportedName', 'reExportedName', 'reexportedName'], ['packageName', 'packageName', 'package'],
  ['packageSubpath', 'packageSubpath', 'subpath'], ['packageCondition', 'packageCondition', 'condition'], ['packageExportKey'], ['packageImportKey'],
  ['resolvedPath', 'resolvedPath', 'targetPath'], ['targetPath', 'targetPath', 'resolvedPath'], ['capability'], ['hostKind'], ['runtimeKind'],
  ['apiName', 'apiName', 'callee'], ['globalName', 'globalName', 'global', 'objectName'], ['permission', 'permission', 'permissionKind'],
  ['permissionKind', 'permissionKind', 'permission'], ['effectKind'], ['memoryKind'],
  ['operationKind'], ['memoryOrder', 'memoryOrder', 'ordering'], ['ordering', 'ordering', 'memoryOrder'], ['lockId', 'lockId', 'lock'],
  ['channelId', 'channelId', 'channel'], ['actorId', 'actorId', 'actor'], ['synchronizationKey', 'synchronizationKey', 'syncKey'],
  ['callableId', 'callableId', 'callable'], ['functionId', 'functionId', 'function'], ['receiverId', 'receiverId', 'receiver'],
  ['abi'], ['callingConvention'], ['layoutKind'], ['endian'], ['objectKind'], ['memberKind'], ['protocolId', 'protocolId', 'protocol'],
  ['traitId', 'traitId', 'trait'], ['interfaceId', 'interfaceId', 'interface'], ['mode', 'mode', 'loanMode'], ['aliasKind'], ['moveKind'],
  ['dropKind'], ['resourceKind'], ['scopeKind'], ['typeKind'], ['signatureHash'], ['contractHash'], ['typeHash'], ['flowKind'],
  ['controlFlowKind'], ['sourceControlFlowId'], ['sourceId', 'from', 'sourceId'], ['targetId', 'to', 'targetId'], ['label'],
  ['conditionHash'], ['orderingKey', 'orderingKey', 'orderKey'], ['lifetimeKind'], ['lifetimeRegionId', 'lifetimeRegion', 'lifetimeRegionId'],
  ['regionKind'], ['resourceId', 'resource', 'resourceId'], ['sourcePath', 'sourcePath', 'path'], ['sourceHash'], ['target', 'effectTarget', 'targetResource']
];
const LIST_FIELDS = [
  ['factKinds', 'fact', 'facts', 'factKind', 'factKinds'], ['importAttributes', 'importAttribute', 'importAttributes', 'assertion', 'assertions'],
  ['reads', 'read', 'reads'], ['writes', 'write', 'writes'], ['evidenceIds', 'evidence', 'evidenceIds']
];
const NUMBER_FIELDS = [['arity'], ['size'], ['alignment']];
const FLAG_FIELDS = ['nullable', 'optional', 'publicContract', 'closure', 'captured', 'writeExpr', 'mutable', 'shadowed', 'hoisted', 'typeOnly', 'isTypeReference', 'isValueReference', 'shared', 'volatile', 'atomic', 'adapterRequired', 'async', 'generator', 'exceptional', 'cancellable'];

export const FAMILIES = Object.freeze(Object.fromEntries(FAMILY_ROWS.flatMap(([name, field, sourceKey, targetKey, aliases = [], extra = {}]) => {
  const config = { field, sourceKey, targetKey, ...extra };
  return [name, ...aliases].map((alias) => [alias, config]);
})));

export function parseConstraintRecord(name, text, role) {
  const kind = wordAny(text, 'kind', 'constraintKind');
  return cleanRecord({
    id: wordAny(text, 'recordId') ?? idFrom(text, `constraint_record_${name}`),
    role,
    kind,
    name: wordAny(text, 'name') ?? name,
    constraintKind: wordAny(text, 'constraintKind'),
    constraintKinds: listAny(text, 'constraint', 'constraints', 'constraintKind', 'constraintKinds') ?? (kind ? [kind] : undefined),
    ...readMapped(text, WORD_FIELDS, wordAny),
    ...readMapped(text, LIST_FIELDS, listAny),
    ...readMapped(text, NUMBER_FIELDS, numberAny),
    ...Object.fromEntries(FLAG_FIELDS.map((field) => [field, flag(field, text)])),
    predicate: quoted('predicate', text) ?? wordAny(text, 'predicate'),
    metadata: { name }
  });
}

function readMapped(text, specs, reader) {
  return Object.fromEntries(specs.map(([key, ...labels]) => [key, reader(text, ...(labels.length ? labels : [key]))]));
}
function wordAny(text, ...labels) {
  for (const label of labels) {
    const value = word(label, text);
    if (value !== undefined) return value;
  }
  return undefined;
}
function listAny(text, ...labels) {
  for (const label of labels) {
    const value = list(label, text);
    if (value) return value;
  }
  return undefined;
}
function numberAny(text, ...labels) {
  const value = wordAny(text, ...labels);
  return value === undefined ? undefined : Number(value);
}
function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function word(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function quoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function flag(label, text) { return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(text) || undefined; }
function list(label, text) {
  const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
  return value ? value.split(/[|,]/).map((item) => item.trim()).filter(Boolean) : undefined;
}
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
