export function parseSemanticOperationsBlock(block) {
  const name = nameFrom(block.header);
  const operationSet = { id: idFrom(block.header, `semanticOperations_${name}`), operations: [], metadata: { name } };
  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(operation|op)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (match) operationSet.operations.push(parseSemanticOperationRecord(match[2], match[3]));
  }
  return operationSet;
}

function parseSemanticOperationRecord(name, text) {
  return cleanRecord({
    id: idFrom(text, `semanticOperation_${name}`),
    operationKind: readInlineWord('operationKind', text) ?? readInlineWord('op', text) ?? readInlineWord('kind', text),
    language: readInlineWord('language', text),
    name,
    target: readInlineWord('target', text),
    nativeSourceId: readInlineWord('nativeSource', text) ?? readInlineWord('nativeSourceId', text),
    nativeAstId: readInlineWord('nativeAst', text) ?? readInlineWord('nativeAstId', text),
    nativeAstNodeIds: readInlineList(text, 'nativeAstNode', 'nativeAstNodes', 'nativeAstNodeIds'),
    semanticNodeIds: readInlineList(text, 'semanticNode', 'semanticNodes', 'semanticNodeIds'),
    semanticSymbolIds: readInlineList(text, 'semanticSymbol', 'semanticSymbols', 'semanticSymbolIds'),
    semanticOccurrenceIds: readInlineList(text, 'semanticOccurrence', 'semanticOccurrences', 'semanticOccurrenceIds'),
    sourceMapIds: readInlineList(text, 'sourceMap', 'sourceMaps', 'sourceMapIds'),
    sourceMapMappingIds: readInlineList(text, 'sourceMapMapping', 'sourceMapMappings', 'sourceMapMappingIds'),
    proofObligationIds: readInlineList(text, 'proofObligation', 'proofObligations', 'proofObligationIds'),
    proofArtifactIds: readInlineList(text, 'proofArtifact', 'proofArtifacts', 'proofArtifactIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    lossIds: readInlineList(text, 'loss', 'lossIds'),
    reads: readInlineList(text, 'read', 'reads'),
    writes: readInlineList(text, 'write', 'writes'),
    effectIds: readInlineList(text, 'effect', 'effects', 'effectIds'),
    resources: readInlineList(text, 'resource', 'resources'),
    ownershipKeys: readInlineList(text, 'ownerKey', 'ownershipKey', 'ownershipKeys'),
    conflictKeys: readInlineList(text, 'conflictKey', 'conflictKeys'),
    readiness: readInlineWord('readiness', text),
    dynamic: readInlineFlag('dynamic', text),
    opaque: readInlineFlag('opaque', text),
    summary: readInlineQuoted('summary', text)
  });
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'SemanticOperations'; }
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
