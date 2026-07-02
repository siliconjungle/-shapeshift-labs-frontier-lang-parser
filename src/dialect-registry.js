export function parseDialectRegistryBlock(block) {
  const name = nameFrom(block.header);
  const registry = {
    kind: 'frontier.lang.universalDialectRegistry',
    version: 1,
    id: idFrom(block.header, `dialect_registry_${name}`),
    language: readWord('language', block.body),
    dialect: readWord('dialect', block.body),
    sourcePath: readWord('sourcePath', block.body) ?? readWord('path', block.body),
    dialects: [],
    externs: [],
    metadata: {
      authoredDialectRegistry: true,
      authoredDialectRegistryBlockName: name,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }
  };
  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const dialect = /^(?:dialect|record)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    const extern = /^extern\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (dialect) registry.dialects.push(dialectRecord(registry, dialect[1], dialect[2]));
    if (extern) registry.externs.push(externRecord(registry, extern[1], extern[2]));
  }
  return summarizeRegistry(registry);
}

export function mergeDialectRegistryBlocks(blocks = []) {
  if (!blocks.length) return undefined;
  return summarizeRegistry({
    kind: 'frontier.lang.universalDialectRegistry',
    version: 1,
    id: blocks.length === 1 ? blocks[0].id : 'dialect_registry:source',
    language: first(blocks.map((block) => block.language)),
    dialects: uniqueById(blocks.flatMap((block) => block.dialects ?? [])),
    externs: uniqueById(blocks.flatMap((block) => block.externs ?? [])),
    metadata: {
      authoredDialectRegistryBlockIds: blocks.map((block) => block.id),
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }
  });
}

function dialectRecord(registry, name, text) {
  return cleanRecord({
    kind: 'frontier.lang.universalDialectRecord',
    version: 1,
    id: idFrom(text, `dialect_${name}`),
    language: readInlineWord('language', text) ?? registry.language,
    dialect: readInlineWord('dialect', text) ?? registry.dialect ?? name,
    constructKind: readInlineWord('constructKind', text) ?? readInlineWord('kind', text) ?? 'runtime',
    name: readInlineWord('name', text) ?? name,
    nativeKind: readInlineWord('nativeKind', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text) ?? registry.sourcePath,
    nativeSourceId: readInlineWord('nativeSource', text) ?? readInlineWord('nativeSourceId', text),
    nativeAstId: readInlineWord('nativeAst', text) ?? readInlineWord('nativeAstId', text),
    nativeAstNodeId: readInlineWord('nativeAstNode', text) ?? readInlineWord('nativeAstNodeId', text),
    semanticNodeId: readInlineWord('semanticNode', text) ?? readInlineWord('semanticNodeId', text),
    semanticSymbolId: readInlineWord('symbol', text) ?? readInlineWord('semanticSymbol', text) ?? readInlineWord('semanticSymbolId', text),
    semanticOccurrenceId: readInlineWord('semanticOccurrence', text) ?? readInlineWord('semanticOccurrenceId', text),
    sourceMapId: readInlineWord('sourceMap', text) ?? readInlineWord('sourceMapId', text),
    sourceMapMappingId: readInlineWord('sourceMapMapping', text) ?? readInlineWord('sourceMapMappingId', text),
    externIds: readInlineList(text, 'extern', 'externId', 'externIds') ?? [],
    lossIds: readInlineList(text, 'loss', 'lossId', 'lossIds') ?? [],
    evidenceIds: readInlineList(text, 'evidence', 'evidenceId', 'evidenceIds') ?? [],
    projection: projectionRecord(text),
    metadata: { semanticEquivalenceClaim: false, autoMergeClaim: false }
  });
}

function externRecord(registry, name, text) {
  const binding = cleanRecord({
    module: readInlineWord('module', text),
    path: readInlineWord('bindingPath', text) ?? readInlineWord('path', text),
    symbol: readInlineWord('bindingSymbol', text) ?? readInlineWord('symbol', text),
    abi: readInlineWord('abi', text),
    version: readInlineWord('version', text)
  });
  return cleanRecord({
    kind: 'frontier.lang.universalExternRecord',
    version: 1,
    id: idFrom(text, `extern_${name}`),
    language: readInlineWord('language', text) ?? registry.language,
    dialect: readInlineWord('dialect', text) ?? registry.dialect ?? name,
    externKind: readInlineWord('externKind', text) ?? readInlineWord('kind', text) ?? 'foreignSymbol',
    name: readInlineWord('name', text) ?? name,
    ...(Object.keys(binding).length ? { binding } : {}),
    sourcePath: readInlineWord('sourcePath', text) ?? registry.sourcePath,
    nativeSourceId: readInlineWord('nativeSource', text) ?? readInlineWord('nativeSourceId', text),
    nativeAstId: readInlineWord('nativeAst', text) ?? readInlineWord('nativeAstId', text),
    nativeAstNodeId: readInlineWord('nativeAstNode', text) ?? readInlineWord('nativeAstNodeId', text),
    semanticNodeId: readInlineWord('semanticNode', text) ?? readInlineWord('semanticNodeId', text),
    semanticSymbolId: readInlineWord('semanticSymbol', text) ?? readInlineWord('semanticSymbolId', text),
    sourceMapId: readInlineWord('sourceMap', text) ?? readInlineWord('sourceMapId', text),
    sourceMapMappingId: readInlineWord('sourceMapMapping', text) ?? readInlineWord('sourceMapMappingId', text),
    lossIds: readInlineList(text, 'loss', 'lossId', 'lossIds') ?? [],
    evidenceIds: readInlineList(text, 'evidence', 'evidenceId', 'evidenceIds') ?? [],
    projection: projectionRecord(text),
    metadata: { semanticEquivalenceClaim: false, autoMergeClaim: false }
  });
}

function projectionRecord(text) {
  const lossIds = readInlineList(text, 'projectionLoss', 'projectionLossIds', 'loss', 'lossId', 'lossIds') ?? [];
  const disposition = readInlineWord('disposition', text) ?? (lossIds.length ? 'lossy' : 'review-required');
  return cleanRecord({
    disposition,
    readiness: readInlineWord('readiness', text) ?? readinessForDisposition(disposition),
    targets: readInlineList(text, 'target', 'targets', 'targetLanguage') ?? [],
    lossIds,
    evidenceIds: readInlineList(text, 'projectionEvidence', 'projectionEvidenceIds', 'evidence', 'evidenceId', 'evidenceIds') ?? [],
    sourceMapIds: readInlineList(text, 'sourceMap', 'sourceMapId', 'sourceMapIds'),
    sourceMapMappingIds: readInlineList(text, 'sourceMapMapping', 'sourceMapMappingId', 'sourceMapMappingIds'),
    notes: readInlineList(text, 'note', 'notes')
  });
}

function summarizeRegistry(registry) {
  const dialects = uniqueById(registry.dialects ?? []);
  const externs = uniqueById(registry.externs ?? []);
  const records = [...dialects, ...externs];
  return cleanRecord({
    ...registry,
    dialects,
    externs,
    summary: {
      dialects: dialects.length,
      externs: externs.length,
      records: records.length,
      languages: unique(records.map((record) => record.language)),
      dialectNames: unique(records.map((record) => record.dialect)),
      constructKinds: countBy(dialects.map((record) => record.constructKind)),
      externKinds: countBy(externs.map((record) => record.externKind)),
      lossIds: unique(records.flatMap((record) => record.lossIds ?? [])),
      evidenceIds: unique(records.flatMap((record) => record.evidenceIds ?? [])),
      sourceMapIds: unique(records.flatMap((record) => [record.sourceMapId, ...(record.projection?.sourceMapIds ?? [])])),
      projectionDispositions: countBy(records.map((record) => record.projection?.disposition)),
      projectionReadiness: records.reduce((readiness, record) => maxReadiness(readiness, record.projection?.readiness ?? 'ready'), 'ready'),
      recordsWithLosses: records.filter((record) => (record.lossIds ?? []).length).length,
      recordsWithProjectionEvidence: records.filter((record) => (record.projection?.evidenceIds ?? []).length).length
    }
  });
}

function readinessForDisposition(disposition) {
  if (disposition === 'preserved' || disposition === 'lossless') return 'ready';
  if (disposition === 'lossy' || disposition === 'declaration-only') return 'ready-with-losses';
  if (disposition === 'stub-only' || disposition === 'unsupported') return 'blocked';
  return 'needs-review';
}

function maxReadiness(left, right) {
  const order = ['ready', 'ready-with-losses', 'needs-review', 'blocked'];
  return order.indexOf(right) > order.indexOf(left) ? right : left;
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Unnamed'; }
function readWord(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\s,]+)', 'm').exec(body)?.[1]?.trim(); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = readInlineWord(label, text);
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function cleanRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function first(values) { return values.find(Boolean); }
function uniqueById(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record?.id || seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}
function countBy(values) {
  return values.filter(Boolean).reduce((counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }), {});
}
