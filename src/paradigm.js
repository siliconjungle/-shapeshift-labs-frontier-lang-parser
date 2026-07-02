const GROUPS = {
  bindingScope: 'bindingScopes',
  binding: 'bindings',
  pattern: 'patterns',
  typeConstraint: 'typeConstraints',
  evaluationModel: 'evaluationModels',
  memoryLocation: 'memoryLocations',
  effectRegion: 'effectRegions',
  controlRegion: 'controlRegions',
  logicProgram: 'logicPrograms',
  actorSystem: 'actorSystems',
  stackEffect: 'stackEffects',
  arrayShape: 'arrayShapes',
  numericKernel: 'numericKernels',
  dataflowNetwork: 'dataflowNetworks',
  clockModel: 'clockModels',
  objectModel: 'objectModels',
  macroExpansion: 'macroExpansions',
  reflectionBoundary: 'reflectionBoundaries',
  lowering: 'loweringRecords',
  loweringRecord: 'loweringRecords'
};

export function parseParadigmBlock(block) {
  const name = nameFrom(block.header);
  const layer = { id: idFrom(block.header, `paradigm_${name}`), metadata: { name } };
  for (const group of new Set(Object.values(GROUPS))) layer[group] = [];
  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, section, recordName, rest] = match;
    const group = GROUPS[section];
    if (group) layer[group].push(parseParadigmRecord(section, recordName, rest));
  }
  return omitEmptyArrays(layer);
}

function parseParadigmRecord(section, name, text) {
  return cleanRecord({
    id: idFrom(text, `paradigm_${section}_${name}`),
    kind: readInlineWord('kind', text) ?? section,
    subjectKind: readInlineWord('subjectKind', text),
    subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text),
    semanticNodeId: readInlineWord('semanticNode', text) ?? readInlineWord('semanticNodeId', text),
    semanticSymbolId: readInlineWord('semanticSymbol', text) ?? readInlineWord('semanticSymbolId', text),
    semanticOccurrenceId: readInlineWord('semanticOccurrence', text) ?? readInlineWord('semanticOccurrenceId', text),
    nativeSourceId: readInlineWord('nativeSource', text) ?? readInlineWord('nativeSourceId', text),
    nativeAstId: readInlineWord('nativeAst', text) ?? readInlineWord('nativeAstId', text),
    nativeAstNodeId: readInlineWord('nativeAstNode', text) ?? readInlineWord('nativeAstNodeId', text),
    sourceMapId: readInlineWord('sourceMap', text) ?? readInlineWord('sourceMapId', text),
    sourceMapMappingId: readInlineWord('sourceMapMapping', text) ?? readInlineWord('sourceMapMappingId', text),
    bindingScopeId: readInlineWord('bindingScope', text) ?? readInlineWord('bindingScopeId', text),
    parentScopeId: readInlineWord('parentScope', text) ?? readInlineWord('parentScopeId', text),
    bindingId: readInlineWord('binding', text) ?? readInlineWord('bindingId', text),
    patternId: readInlineWord('pattern', text) ?? readInlineWord('patternId', text),
    typeConstraintId: readInlineWord('typeConstraint', text) ?? readInlineWord('typeConstraintId', text),
    evaluationModelId: readInlineWord('evaluationModel', text) ?? readInlineWord('evaluationModelId', text),
    memoryLocationId: readInlineWord('memoryLocation', text) ?? readInlineWord('memoryLocationId', text),
    effectRegionId: readInlineWord('effectRegion', text) ?? readInlineWord('effectRegionId', text),
    controlRegionId: readInlineWord('controlRegion', text) ?? readInlineWord('controlRegionId', text),
    loweringRecordId: readInlineWord('lowering', text) ?? readInlineWord('loweringRecordId', text),
    sourceRecordId: readInlineWord('sourceRecord', text) ?? readInlineWord('sourceRecordId', text),
    targetRecordId: readInlineWord('targetRecord', text) ?? readInlineWord('targetRecordId', text),
    effectIds: readInlineList(text, 'effect', 'effects', 'effectIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    lossIds: readInlineList(text, 'loss', 'lossIds'),
    relatedRecordIds: readInlineList(text, 'related', 'relatedRecordIds'),
    statement: readInlineQuoted('statement', text),
    description: readInlineQuoted('description', text),
    language: readInlineWord('language', text),
    metadata: { name }
  });
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Paradigm'; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
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
function omitEmptyArrays(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => !Array.isArray(value) || value.length > 0));
}
