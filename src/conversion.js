const FAMILIES = {
  type: { field: 'typeConstraints', sourceKey: 'sourceTypes', targetKey: 'targetTypes' },
  typeConstraint: { field: 'typeConstraints', sourceKey: 'sourceTypes', targetKey: 'targetTypes' },
  controlFlow: { field: 'controlFlowConstraints', sourceKey: 'sourceControlFlows', targetKey: 'targetControlFlows' },
  controlFlowConstraint: { field: 'controlFlowConstraints', sourceKey: 'sourceControlFlows', targetKey: 'targetControlFlows' },
  lifetime: { field: 'lifetimeConstraints', sourceKey: 'sourceLifetimeConstraints', targetKey: 'targetLifetimeConstraints' },
  lifetimeConstraint: { field: 'lifetimeConstraints', sourceKey: 'sourceLifetimeConstraints', targetKey: 'targetLifetimeConstraints' },
  callableBoundary: { field: 'callableBoundaryConstraints', sourceKey: 'sourceCallables', targetKey: 'targetCallables' },
  adtPattern: { field: 'adtPatternConstraints', sourceKey: 'sourcePatterns', targetKey: 'targetPatterns' },
  dataLayout: { field: 'dataLayoutConstraints', sourceKey: 'sourceLayouts', targetKey: 'targetLayouts' },
  effect: { field: 'effectConstraints', sourceKey: 'sourceEffects', targetKey: 'targetEffects' },
  concurrencyModel: { field: 'concurrencyModelConstraints', sourceKey: 'sourceConcurrencyModels', targetKey: 'targetConcurrencyModels' },
  errorModel: { field: 'errorModelConstraints', sourceKey: 'sourceErrors', targetKey: 'targetErrors' },
  evaluationModel: { field: 'evaluationModelConstraints', sourceKey: 'sourceEvaluations', targetKey: 'targetEvaluations' },
  hostEnvironment: { field: 'hostEnvironmentConstraints', sourceKey: 'sourceHosts', targetKey: 'targetHosts' },
  memoryModel: { field: 'memoryModelConstraints', sourceKey: 'sourceMemoryModels', targetKey: 'targetMemoryModels' },
  metaprogramming: { field: 'metaprogrammingConstraints', sourceKey: 'sourceMetaprograms', targetKey: 'targetMetaprograms' },
  module: { field: 'moduleConstraints', sourceKey: 'sourceModules', targetKey: 'targetModules' },
  scopeBinding: { field: 'scopeBindingConstraints', sourceKey: 'sourceBindings', targetKey: 'targetBindings' },
  numericSemantics: { field: 'numericSemanticsConstraints', sourceKey: 'sourceNumerics', targetKey: 'targetNumerics' },
  textSemantics: { field: 'textSemanticsConstraints', sourceKey: 'sourceTexts', targetKey: 'targetTexts' },
  collectionSemantics: { field: 'collectionSemanticsConstraints', sourceKey: 'sourceCollections', targetKey: 'targetCollections' },
  serializationSemantics: { field: 'serializationSemanticsConstraints', sourceKey: 'sourceSerializations', targetKey: 'targetSerializations' },
  dependencySemantics: { field: 'dependencySemanticsConstraints', sourceKey: 'sourceDependencies', targetKey: 'targetDependencies' },
  objectModel: { field: 'objectModelConstraints', sourceKey: 'sourceObjects', targetKey: 'targetObjects' },
  protocol: { field: 'protocolConstraints', sourceKey: 'sourceProtocols', targetKey: 'targetProtocols' }
};

export function parseConversionBlock(block) {
  const name = nameFrom(block.header);
  const plan = { id: idFrom(block.header, `conversion_${name}`), targets: [], metadata: { name } };
  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const target = /^target\s+([^\s,]+)/.exec(line)?.[1];
    const sourceLanguage = /^sourceLanguage\s+([^\s,]+)/.exec(line)?.[1] ?? /^source\s+([^\s,]+)/.exec(line)?.[1];
    const constraint = /^constraint\s+([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (target) plan.targets.push(target);
    else if (sourceLanguage) plan.sourceLanguage = sourceLanguage;
    else if (constraint) addConstraint(plan, constraint[1], constraint[2], constraint[3]);
  }
  return cleanRecord({ ...plan, targets: unique(plan.targets) });
}

function addConstraint(plan, family, name, text) {
  const config = FAMILIES[family] ?? { field: family.endsWith('s') ? family : `${family}Constraints`, sourceKey: 'sourceRecords', targetKey: 'targetRecords' };
  const role = readInlineWord('role', text) ?? 'source';
  const record = parseConstraintRecord(name, text, role);
  const entry = cleanRecord({
    id: idFrom(text, `${config.field}_${name}`),
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? readInlineWord('source', text) ?? plan.sourceLanguage,
    target: readInlineWord('target', text) ?? plan.targets[0],
    mode: readInlineWord('mode', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    missingEvidence: readInlineList(text, 'missingEvidence'),
    blockers: readInlineList(text, 'blocker', 'blockers'),
    review: readInlineList(text, 'review'),
    metadata: { name, family, authoredConversionBlockId: plan.id }
  });
  const recordKey = role === 'target' ? config.targetKey : config.sourceKey;
  entry[recordKey] = [record];
  plan[config.field] = [...(plan[config.field] ?? []), entry];
}

function parseConstraintRecord(name, text, role) {
  const kind = readInlineWord('kind', text) ?? readInlineWord('constraintKind', text);
  return cleanRecord({
    id: readInlineWord('recordId', text) ?? idFrom(text, `constraint_record_${name}`),
    role,
    kind,
    name: readInlineWord('name', text) ?? name,
    constraintKind: readInlineWord('constraintKind', text),
    constraintKinds: readInlineList(text, 'constraint', 'constraints', 'constraintKind', 'constraintKinds') ?? (kind ? [kind] : undefined),
    factKinds: readInlineList(text, 'fact', 'facts', 'factKind', 'factKinds'),
    symbolId: readInlineWord('symbol', text) ?? readInlineWord('symbolId', text),
    symbolName: readInlineWord('symbolName', text),
    localName: readInlineWord('localName', text),
    typeKind: readInlineWord('typeKind', text),
    signatureHash: readInlineWord('signatureHash', text),
    contractHash: readInlineWord('contractHash', text),
    typeHash: readInlineWord('typeHash', text),
    flowKind: readInlineWord('flowKind', text),
    sourceId: readInlineWord('from', text) ?? readInlineWord('sourceId', text),
    targetId: readInlineWord('to', text) ?? readInlineWord('targetId', text),
    label: readInlineWord('label', text),
    conditionHash: readInlineWord('conditionHash', text),
    orderingKey: readInlineWord('orderingKey', text) ?? readInlineWord('orderKey', text),
    lifetimeKind: readInlineWord('lifetimeKind', text),
    regionKind: readInlineWord('regionKind', text),
    predicate: readInlineQuoted('predicate', text) ?? readInlineWord('predicate', text),
    resourceId: readInlineWord('resource', text) ?? readInlineWord('resourceId', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    sourceHash: readInlineWord('sourceHash', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    nullable: readInlineFlag('nullable', text),
    optional: readInlineFlag('optional', text),
    publicContract: readInlineFlag('publicContract', text),
    async: readInlineFlag('async', text),
    generator: readInlineFlag('generator', text),
    exceptional: readInlineFlag('exceptional', text),
    cancellable: readInlineFlag('cancellable', text),
    metadata: { name }
  });
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Conversion'; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineFlag(label, text) { return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(text) || undefined; }
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }
