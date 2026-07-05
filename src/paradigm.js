const GROUPS = {
  valueSemantics: 'valueSemantics',
  mutationModel: 'mutationModels',
  effectModel: 'effectModels',
  ownership: 'ownershipModels',
  ownershipModel: 'ownershipModels',
  lifetime: 'lifetimeModels',
  lifetimeModel: 'lifetimeModels',
  bindingScope: 'bindingScopes',
  binding: 'bindings',
  pattern: 'patterns',
  dispatch: 'dispatchModels',
  typeModel: 'typeModels',
  moduleModel: 'moduleModels',
  concurrency: 'concurrencyModels',
  errorModel: 'errorModels',
  memoryModel: 'memoryModels',
  evaluation: 'evaluationModels',
  typeConstraint: 'typeConstraints',
  evaluationModel: 'evaluationModels',
  metaprogramming: 'metaprogrammingRecords',
  interop: 'interopRecords',
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
  for (const authoredLine of readAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#')) continue;
    const match = /^([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, section, recordName, rest] = match;
    const group = GROUPS[section];
    if (group) layer[group].push(parseParadigmRecord(section, recordName, rest, authoredLine));
  }
  layer.query = createParadigmQuery(layer);
  return omitEmptyArrays(layer);
}

function parseParadigmRecord(section, name, text, authoredLine = {}) {
  return cleanRecord({
    id: idFrom(text, `paradigm_${section}_${name}`),
    rowKind: section,
    recordKind: recordKind(section),
    kind: readInlineWord('kind', text) ?? section,
    name,
    model: readInlineWord('model', text),
    mode: readInlineWord('mode', text),
    phase: readInlineWord('phase', text),
    role: readInlineWord('role', text),
    status: readInlineWord('status', text),
    readiness: readInlineWord('readiness', text),
    subjectKind: readInlineWord('subjectKind', text),
    subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text),
    scopeId: readInlineWord('scope', text) ?? readInlineWord('scopeId', text),
    targetId: readInlineWord('target', text) ?? readInlineWord('targetId', text),
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? readInlineWord('source', text),
    targetLanguage: readInlineWord('targetLanguage', text) ?? readInlineWord('target', text),
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
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceId', 'proofEvidenceIds'),
    lossIds: readInlineList(text, 'loss', 'lossIds'),
    missingEvidence: readInlineList(text, 'missingEvidence'),
    requiredKinds: readInlineList(text, 'required', 'requiredKinds'),
    representedKinds: readInlineList(text, 'represented', 'representedKinds'),
    missingKinds: readInlineList(text, 'missing', 'missingKinds'),
    relatedRecordIds: readInlineList(text, 'related', 'relatedRecordIds'),
    statement: readInlineQuoted('statement', text),
    description: readInlineQuoted('description', text),
    summary: readInlineQuoted('summary', text),
    language: readInlineWord('language', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    sourceHash: readInlineWord('sourceHash', text),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: { authoredName: name }
  });
}

function createParadigmQuery(layer) {
  const records = Object.values(GROUPS).flatMap((group) => layer[group] ?? []);
  return cleanRecord({
    recordIds: ids(records),
    evidenceIds: unique(records.flatMap((record) => record.evidenceIds ?? [])),
    proofEvidenceIds: unique(records.flatMap((record) => record.proofEvidenceIds ?? [])),
    sourceMapIds: unique(records.map((record) => record.sourceMapId).concat(records.flatMap((record) => record.sourceMapIds ?? []))),
    sourceMapMappingIds: unique(records.map((record) => record.sourceMapMappingId).concat(records.flatMap((record) => record.sourceMapMappingIds ?? []))),
    lossIds: unique(records.flatMap((record) => record.lossIds ?? [])),
    missingEvidence: unique(records.flatMap((record) => record.missingEvidence ?? [])),
    sourcePaths: unique(records.map((record) => record.sourcePath).concat(records.map((record) => record.sourceSpan?.path))),
    rowKinds: unique(records.map((record) => record.rowKind)),
    recordKinds: unique(records.map((record) => record.recordKind))
  });
}

function recordKind(section) {
  return section.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
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
function readAuthoredLines(block) {
  const lines = block.body.split('\n');
  const records = [];
  let lineStart = block.syntax?.bodyStartOffset ?? 0;
  for (const rawLine of lines) {
    const rawEnd = lineStart + rawLine.length;
    const leading = /^\s*/.exec(rawLine)?.[0].length ?? 0;
    const trailing = /\s*$/.exec(rawLine)?.[0].length ?? 0;
    const startOffset = lineStart + leading;
    const endOffset = Math.max(startOffset, rawEnd - trailing);
    records.push({ text: rawLine.trim(), sourceSpan: typeof block.sourceSpan === 'function' ? block.sourceSpan(startOffset, endOffset) : undefined });
    lineStart = rawEnd + 1;
  }
  return records;
}
function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function unique(values = []) { return [...new Set(values.filter(Boolean))]; }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
function omitEmptyArrays(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => !Array.isArray(value) || value.length > 0));
}
