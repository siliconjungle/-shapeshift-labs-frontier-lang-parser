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
  ['layoutStyle', 'layoutStyleConstraints', 'sourceLayoutStyles', 'targetLayoutStyles', ['layoutStyleConstraint', 'layout-style', 'layout-style-constraint', 'layout', 'layoutConstraint', 'layout-constraint', 'style', 'styleConstraint', 'style-constraint', 'css-style', 'css-rule', 'style-layout', 'render-layout'], { extraSourceKeys: ['sourceLayoutStyleRecords'], extraTargetKeys: ['targetLayoutStyleRecords'] }],
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
  ['regionKind'], ['resourceId', 'resource', 'resourceId'],
  ['functionName'], ['methodName'], ['callableName'], ['callableKind'], ['callSignatureHash'], ['restParameter', 'restParameter', 'rest'],
  ['receiverKind', 'receiverKind', 'receiver'], ['thisBinding'], ['selfBinding'], ['returnKind', 'returnKind', 'returnType'],
  ['asyncKind', 'asyncKind', 'asyncMode'], ['generatorKind', 'generatorKind', 'yieldKind'], ['callbackKind'],
  ['closureCapture', 'closureCapture', 'captureKind'], ['overloadSet', 'overloadSet', 'overloads'],
  ['dispatchKind', 'dispatchKind', 'dispatchMode'], ['constructorKind'], ['abiKind'], ['ffiBoundary', 'ffiBoundary', 'foreignFunction'],
  ['exceptionModel'], ['adtKind'], ['patternKind', 'patternKind', 'matchKind', 'caseKind'], ['typeName'], ['enumName'], ['unionName'],
  ['symbolKind'], ['relationKind'], ['representationKind'], ['typeId', 'typeId', 'nodeId'], ['nodeId'], ['structId'], ['unionId'],
  ['enumId'], ['fieldId'], ['bitfieldId'], ['endianness', 'endianness', 'endian'], ['repr', 'repr', 'reprAttribute'],
  ['numericKind', 'numericKind', 'numberKind'], ['numberKind'], ['numericTypeName'], ['signedness'], ['overflowMode', 'overflowMode', 'overflowBehavior'],
  ['divisionMode', 'divisionMode', 'integerDivisionMode'], ['moduloMode', 'moduloMode', 'remainderMode'], ['floatFormat'], ['floatPrecision'], ['roundingMode'],
  ['separatorPolicy'], ['coercionKind', 'coercionKind', 'conversionKind'], ['conversionKind'], ['literalKind'],
  ['textKind', 'textKind', 'stringKind'], ['stringKind'], ['stringTypeName'], ['encoding', 'encoding', 'charset', 'codepage'],
  ['charset'], ['codepage'], ['codeUnit', 'codeUnit', 'codeUnitWidth'], ['indexingUnit', 'indexingUnit', 'indexUnit'],
  ['normalizationForm', 'normalizationForm', 'normalization'], ['locale', 'locale', 'localePolicy'], ['collation', 'collation', 'collationPolicy'],
  ['caseMapping', 'caseMapping', 'caseFolding'], ['regexEngine', 'regexEngine', 'regexFlavor'], ['escapeMode', 'escapeMode', 'escaping'],
  ['interpolationMode', 'interpolationMode', 'interpolation'], ['termination', 'termination', 'nullTermination'], ['boundaryKind', 'boundaryKind', 'byteBoundary'],
  ['collectionKind', 'collectionKind', 'containerKind'], ['containerKind'], ['collectionTypeName'], ['elementKind', 'elementKind', 'elementType'],
  ['keyKind', 'keyKind', 'keyType'], ['valueKind', 'valueKind', 'valueType'], ['orderKind'], ['iterationOrder', 'iterationOrder', 'traversalOrder'],
  ['duplicatePolicy', 'duplicatePolicy', 'duplicates'], ['equality', 'equality', 'equalitySemantics'], ['hash', 'hash', 'hashSemantics'],
  ['comparator', 'comparator', 'comparison'], ['boundsBehavior', 'boundsBehavior', 'bounds'], ['lengthSemantics', 'lengthSemantics', 'sizeSemantics'],
  ['sparseSemantics', 'sparseSemantics', 'holes'], ['mutability', 'mutability', 'collectionMutability', 'stringMutability'],
  ['persistence', 'persistence', 'persistent'], ['iteratorInvalidation', 'iteratorInvalidation', 'invalidation'],
  ['traversal', 'traversal', 'laziness'], ['capacityGrowth', 'capacityGrowth', 'growth'], ['concurrency', 'concurrency', 'threadSafety'],
  ['format', 'format', 'wireFormat', 'serializationFormat'], ['wireFormat'], ['serializationFormat'], ['codec', 'codec', 'runtimeCodec'],
  ['schemaName', 'schemaName', 'schemaId', 'schema'], ['schemaId'], ['fieldNaming', 'fieldNaming', 'naming'], ['fieldOrder', 'fieldOrder', 'order'],
  ['omissionPolicy'], ['defaultValueSemantics'], ['nullSemantics', 'nullSemantics', 'nullability'], ['unknownFieldPolicy'],
  ['enumEncoding', 'enumEncoding', 'tagEncoding'], ['varint', 'varint', 'varintEncoding'], ['schemaVersion', 'schemaVersion', 'version'],
  ['compatibility'], ['canonicalization'], ['precision', 'precision', 'precisionLoss'], ['roundtrip', 'roundtrip', 'roundtripStability'],
  ['validation'], ['securityEscaping'], ['packageManager', 'packageManager', 'manager'], ['manager'], ['manifestSchema', 'manifestSchema', 'manifestKind'],
  ['manifestKind'], ['versionRange', 'versionRange', 'range'], ['resolvedVersion', 'resolvedVersion', 'version'], ['lockfile', 'lockfile', 'lockfilePath'],
  ['integrity', 'integrity', 'lockfileIntegrity'], ['dependencyClass', 'dependencyClass', 'dependencyType'], ['dependencyType'],
  ['workspace', 'workspace', 'workspaceBoundary'], ['registry', 'registry', 'registrySource'], ['sourceUrl'], ['nativeAbi', 'nativeAbi', 'abi'],
  ['buildTool', 'buildTool', 'builder'], ['packageManagerVersion', 'packageManagerVersion', 'managerVersion'],
  ['offlineCache', 'offlineCache', 'cachePolicy'], ['dedupeHoist', 'dedupeHoist', 'hoistPolicy'], ['provenance', 'provenance', 'sourceProvenance'],
  ['trust', 'trust', 'supplyChainTrust'], ['concurrencyKind'], ['constructId', 'constructId', 'taskId', 'threadId', 'actorId', 'channelId'],
  ['taskId'], ['threadId'], ['scheduler'], ['executor', 'executor', 'queue', 'runtime'], ['executorId'], ['isolationKey'], ['cancellationKey', 'cancellationKey', 'signalId', 'contextId'],
  ['signalId'], ['contextId'], ['errorKind'], ['errorType', 'errorType', 'exceptionType', 'resultType'], ['exceptionType'], ['resultType'],
  ['boundaryId', 'boundaryId', 'catchId', 'handlerId'], ['catchId'], ['handlerId'], ['evaluationKind', 'evaluationKind', 'expressionKind'],
  ['expressionKind'], ['expressionId', 'expressionId', 'nodeId'], ['operator'], ['evaluationOrder', 'evaluationOrder', 'order'],
  ['expansionKind', 'expansionKind', 'macroKind', 'templateKind', 'decoratorKind', 'generatorKind'], ['macroKind'], ['templateKind'],
  ['decoratorKind'], ['expansionId'], ['generatorId'], ['generatedSourcePath'], ['expandedHash', 'expandedHash', 'generatedHash'],
  ['generatedHash'], ['classId'], ['classKind'], ['prototypeId'], ['mixinId'], ['methodId'], ['constructorId'], ['inheritanceKind'], ['referenceSemantics'],
  ['valueSemantics'], ['protocolKind'], ['protocolName'], ['traitName'], ['interfaceName'], ['subjectName', 'subjectName', 'receiverName', 'implementedFor'],
  ['implementedFor'], ['sourcePath', 'sourcePath', 'path'], ['sourceHash'], ['selector'], ['value'], ['styleProperty', 'styleProperty', 'property', 'cssProperty'],
  ['cssProperty', 'cssProperty', 'styleProperty', 'property'], ['computedValue'], ['cascadeLayer'], ['specificity'], ['mediaQuery'],
  ['containerQuery'], ['boxModel'], ['display'], ['position'], ['zIndex'], ['writingMode'], ['direction'], ['viewport'], ['renderTreeId'],
  ['styleRuleId'], ['computedStyleHash'], ['layoutSnapshotHash'], ['bitmapHash'], ['accessibilityTreeHash'], ['focusOrderHash'],
  ['target', 'effectTarget', 'targetResource']
];
const LIST_FIELDS = [
  ['factKinds', 'fact', 'facts', 'factKind', 'factKinds'], ['importAttributes', 'importAttribute', 'importAttributes', 'assertion', 'assertions'],
  ['reads', 'read', 'reads'], ['writes', 'write', 'writes'],
  ['requiredParameters'], ['optionalParameters'], ['parameterOrder', 'parameterOrder', 'orderedParameters'], ['defaultParameters', 'defaultParameters', 'defaults'],
  ['namedArguments', 'namedArguments', 'keywordArguments'], ['effects'], ['variantNames', 'variantNames', 'variants', 'caseNames', 'cases', 'members'],
  ['constructorNames', 'constructorNames', 'constructors', 'caseConstructors'], ['payloadFieldNames', 'payloadFieldNames', 'payloadFields', 'fields', 'tupleFields', 'recordFields'],
  ['tagFieldNames', 'tagFieldNames', 'tagFields', 'discriminatorFields', 'discriminants'], ['matchArmNames', 'matchArmNames', 'matchArms', 'arms', 'switchCases'],
  ['guardKinds', 'guardKinds', 'guards', 'whereClauses', 'conditions'], ['destructuringKinds', 'destructuringKinds', 'destructuring', 'bindingPatterns', 'deconstruction'],
  ['exhaustivenessKinds', 'exhaustivenessKinds', 'exhaustiveness', 'coverageKinds'], ['fallbackKinds', 'fallbackKinds', 'fallbacks', 'defaultCases', 'wildcards'],
  ['genericParameterNames', 'genericParameterNames', 'typeParameters', 'genericParameters'], ['specialValues', 'specialValues', 'floatSpecialValues'],
  ['coercionKinds', 'coercionKinds', 'coercions'], ['literalKinds'], ['boundaryKinds', 'boundaryKinds', 'boundaries'],
  ['omittedFields', 'omittedFields', 'unknownFields'], ['defaultValues'], ['peerDependencies', 'peerDependencies', 'peers'], ['optionalDependencies'],
  ['devDependencies'], ['features', 'features', 'extras', 'flags'], ['lifecycleScripts', 'lifecycleScripts', 'scripts'],
  ['requirementNames', 'requirementNames', 'requirements', 'methods', 'members'], ['associatedTypeNames', 'associatedTypeNames', 'associatedTypes'],
  ['boundNames', 'boundNames', 'bounds', 'traitBounds', 'protocolBounds', 'whereBounds'], ['implementationKinds', 'implementationKinds', 'implKinds', 'implementations'],
  ['dispatchKinds', 'dispatchKinds', 'dispatchModes'], ['coherenceKinds', 'coherenceKinds', 'coherenceRules'],
  ['sourceMapIds', 'sourceMap', 'sourceMaps', 'sourceMapId', 'sourceMapIds'],
  ['sourceMapMappingIds', 'sourceMapMapping', 'sourceMapMappings', 'sourceMapMappingId', 'sourceMapMappingIds'],
  ['proofObligationIds', 'proofObligation', 'proofObligations', 'proofObligationId', 'proofObligationIds', 'obligation', 'obligations'],
  ['proofEvidenceIds', 'proofEvidence', 'proofEvidenceId', 'proofEvidenceIds'],
  ['missingEvidence', 'missingEvidence', 'missingEvidenceIds'],
  ['evidenceIds', 'evidence', 'evidenceIds']
];
const NUMBER_FIELDS = [
  ['arity'], ['size'], ['alignment'], ['parameterCount'], ['requiredParameterCount'], ['optionalParameterCount'],
  ['sizeBytes'], ['alignmentBytes'], ['offsetBytes'], ['pointerWidth'], ['integerWidth'], ['bitWidth'], ['width'],
  ['codeUnitWidth'], ['indexBase']
];
const FLAG_FIELDS = ['nullable', 'optional', 'publicContract', 'closure', 'captured', 'writeExpr', 'mutable', 'shadowed', 'hoisted', 'typeOnly', 'isTypeReference', 'isValueReference', 'shared', 'volatile', 'atomic', 'adapterRequired', 'async', 'generator', 'exceptional', 'cancellable', 'variadic', 'signed', 'nan', 'infinity', 'deterministic', 'streaming', 'framing', 'copyOnWrite', 'multipleInheritance', 'reflection', 'staticDispatch', 'virtual', 'spawn', 'await', 'structured', 'reentrant', 'cancelable', 'failClosed'];

export const FAMILIES = Object.freeze(Object.fromEntries(FAMILY_ROWS.flatMap(([name, field, sourceKey, targetKey, aliases = [], extra = {}]) => {
  const config = { field, sourceKey, targetKey, ...extra };
  return [name, ...aliases].map((alias) => [alias, config]);
})));

export function parseConstraintRecord(name, text, role, context = {}) {
  const kind = wordAny(text, 'kind', 'constraintKind');
  return cleanRecord({
    id: wordAny(text, 'recordId') ?? idFrom(text, `constraint_record_${name}`),
    role,
    kind,
    name: wordAny(text, 'name') ?? name,
    sourceSpan: context.sourceSpan,
    authoredSourceSpan: context.authoredSourceSpan,
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
