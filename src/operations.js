export function parseSemanticOperationsBlock(block) {
  const name = nameFrom(block.header);
  const operationSet = { id: idFrom(block.header, `semanticOperations_${name}`), operations: [], metadata: { name } };
  for (const authoredLine of readAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#')) continue;
    const match = /^(operation|op)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (match) operationSet.operations.push(parseSemanticOperationRecord(match[2], match[3], authoredLine));
  }
  return operationSet;
}

function parseSemanticOperationRecord(name, text, authoredLine = {}) {
  const sourceBackprojectionMode = readInlineWord('sourceBackprojection', text) ?? readInlineWord('sourceBackprojectionMode', text);
  return cleanRecord({
    id: idFrom(text, `semanticOperation_${name}`),
    operationKind: readInlineWord('operationKind', text) ?? readInlineWord('op', text) ?? readInlineWord('kind', text),
    language: readInlineWord('language', text),
    name,
    target: readInlineWord('target', text),
    targetLanguage: readInlineWord('targetLanguage', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    targetPath: readInlineWord('targetPath', text),
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    routeIds: readInlineList(text, 'routeIds'),
    nativeSourceId: readInlineWord('nativeSource', text) ?? readInlineWord('nativeSourceId', text),
    nativeAstId: readInlineWord('nativeAst', text) ?? readInlineWord('nativeAstId', text),
    nativeAstNodeIds: readInlineList(text, 'nativeAstNode', 'nativeAstNodes', 'nativeAstNodeIds'),
    semanticNodeIds: readInlineList(text, 'semanticNode', 'semanticNodes', 'semanticNodeIds'),
    semanticSymbolIds: readInlineList(text, 'semanticSymbol', 'semanticSymbols', 'semanticSymbolIds'),
    semanticOccurrenceIds: readInlineList(text, 'semanticOccurrence', 'semanticOccurrences', 'semanticOccurrenceIds'),
    sourceMapIds: readInlineList(text, 'sourceMap', 'sourceMaps', 'sourceMapIds'),
    sourceMapLinkIds: readInlineList(text, 'sourceMapLink', 'sourceMapLinks', 'sourceMapLinkIds'),
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
    status: readInlineWord('status', text),
    action: readInlineWord('action', text),
    changeKind: readInlineWord('changeKind', text),
    regionKind: readInlineWord('regionKind', text),
    regionId: readInlineWord('region', text) ?? readInlineWord('regionId', text),
    symbolName: readInlineWord('symbolName', text),
    symbolKind: readInlineWord('symbolKind', text),
    symbolId: readInlineWord('symbolId', text),
    semanticKey: readInlineWord('semanticKey', text),
    semanticIdentityHash: readInlineWord('semanticIdentityHash', text),
    sourceIdentityHash: readInlineWord('sourceIdentityHash', text),
    operationContentHash: readInlineWord('operationContentHash', text),
    editContentHash: readInlineWord('editContentHash', text),
    editScriptIds: readInlineList(text, 'editScript', 'editScriptId', 'editScriptIds'),
    patchIds: readInlineList(text, 'patch', 'patchId', 'patchIds'),
    patchHash: readInlineWord('patchHash', text),
    editScriptHash: readInlineWord('editScriptHash', text),
    baseHash: readInlineWord('baseHash', text),
    targetHash: readInlineWord('targetHash', text),
    baseTextHash: readInlineWord('baseTextHash', text),
    workerTextHash: readInlineWord('workerTextHash', text),
    headTextHash: readInlineWord('headTextHash', text),
    projectionContractIds: readInlineList(text, 'projectionContract', 'projectionContractId', 'projectionContractIds'),
    projectionLayerIds: readInlineList(text, 'projectionLayer', 'projectionLayerId', 'projectionLayerIds'),
    targetProjectionIds: readInlineList(text, 'targetProjection', 'targetProjectionId', 'targetProjectionIds'),
    projectionHash: readInlineWord('projectionHash', text),
    semanticEditScriptId: readInlineWord('semanticEditScript', text) ?? readInlineWord('semanticEditScriptId', text) ?? readInlineWord('script', text) ?? readInlineWord('scriptId', text),
    semanticEditProjectionId: readInlineWord('semanticEditProjection', text) ?? readInlineWord('semanticEditProjectionId', text) ?? readInlineWord('projection', text) ?? readInlineWord('projectionId', text),
    semanticEditReplayId: readInlineWord('semanticEditReplay', text) ?? readInlineWord('semanticEditReplayId', text) ?? readInlineWord('replay', text) ?? readInlineWord('replayId', text),
    replayRecordIds: readInlineList(text, 'replayRecord', 'replayRecordId', 'replayRecordIds'),
    replayEventIds: readInlineList(text, 'replayEvent', 'replayEventId', 'replayEventIds'),
    replayStatus: readInlineWord('replayStatus', text),
    replayAction: readInlineWord('replayAction', text),
    replayCurrentHash: readInlineWord('replayCurrentHash', text) ?? readInlineWord('currentHash', text),
    replayOutputHash: readInlineWord('replayOutputHash', text) ?? readInlineWord('outputHash', text),
    replayReasonCodes: readInlineList(text, 'replayReasonCode', 'replayReasonCodes'),
    finalHash: readInlineWord('finalHash', text),
    replayHash: readInlineWord('replayHash', text),
    deterministic: readInlineFlag('deterministic', text),
    replayComplete: readInlineFlag('replayComplete', text),
    admissionDecisionIds: readInlineList(text, 'admissionDecision', 'admissionDecisionId', 'admissionDecisionIds'),
    semanticMergeCandidateIds: readInlineList(text, 'semanticMergeCandidate', 'semanticMergeCandidateId', 'semanticMergeCandidateIds'),
    classification: readInlineWord('classification', text),
    decision: readInlineWord('decision', text),
    autoMergeable: readInlineFlag('autoMergeable', text),
    conflictKeyKinds: readInlineList(text, 'conflictKeyKind', 'conflictKeyKinds'),
    admissionStatus: readInlineWord('admissionStatus', text),
    admissionAction: readInlineWord('admissionAction', text),
    admissionReadiness: readInlineWord('admissionReadiness', text),
    semanticTransformId: readInlineWord('semanticTransform', text) ?? readInlineWord('semanticTransformId', text) ?? readInlineWord('transform', text) ?? readInlineWord('transformId', text),
    transformId: readInlineWord('transformId', text) ?? readInlineWord('transform', text),
    transformKey: readInlineWord('transformKey', text),
    transformHash: readInlineWord('transformHash', text),
    identityHash: readInlineWord('identityHash', text),
    transformIdentityHash: readInlineWord('transformIdentityHash', text),
    transformContentHash: readInlineWord('transformContentHash', text),
    projectionIdentityHash: readInlineWord('projectionIdentityHash', text),
    sourceBackprojectionMode,
    sourceBackprojection: sourceBackprojectionMode ? { mode: sourceBackprojectionMode } : undefined,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    dynamic: readInlineFlag('dynamic', text),
    opaque: readInlineFlag('opaque', text),
    summary: readInlineQuoted('summary', text)
  });
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
    records.push({
      text: rawLine.trim(),
      startOffset,
      endOffset,
      sourceSpan: typeof block.sourceSpan === 'function' ? block.sourceSpan(startOffset, endOffset) : undefined
    });
    lineStart = rawEnd + 1;
  }
  return records;
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'SemanticOperations'; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(unquotedText(text))?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineFlag(label, text) { return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(unquotedText(text)) || undefined; }
function readInlineList(text, ...labels) {
  const source = unquotedText(text);
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(source)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function unquotedText(text) { return text.replace(/"[^"]*"|'[^']*'/g, (match) => ' '.repeat(match.length)); }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
