export function parseSemanticEditRecordsBlock(block) {
  const name = nameFrom(block.header);
  const recordSet = {
    id: idFrom(block.header, `semanticEditRecords_${name}`),
    scripts: [],
    projections: [],
    replays: [],
    metadata: { name }
  };
  for (const authoredLine of readAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#')) continue;
    const match = /^(script|semanticEditScript|projection|semanticEditProjection|replay|semanticEditReplay)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, kind, rowName, text] = match;
    if (kind === 'script' || kind === 'semanticEditScript') {
      recordSet.scripts.push(parseSemanticEditScript(rowName, text, authoredLine));
    } else if (kind === 'projection' || kind === 'semanticEditProjection') {
      recordSet.projections.push(parseSemanticEditProjection(rowName, text, authoredLine));
    } else {
      recordSet.replays.push(parseSemanticEditReplay(rowName, text, authoredLine));
    }
  }
  return recordSet;
}

function parseSemanticEditScript(name, text, authoredLine) {
  const operation = semanticEditOperationRecord(text, authoredLine);
  const status = readInlineWord('status', text) ?? readInlineWord('admissionStatus', text) ?? 'evidence-only';
  const sourceBackprojectionMode = readInlineWord('sourceBackprojection', text) ?? readInlineWord('sourceBackprojectionMode', text);
  const evidenceIds = readInlineList(text, 'evidence', 'evidenceIds');
  return cleanRecord({
    kind: 'frontier.lang.semanticEditScript',
    version: 1,
    schema: 'frontier.lang.semanticEditScript.v1',
    id: idFrom(text, `semantic_edit_script_${name}`),
    stableId: readInlineWord('stableId', text),
    hash: readInlineWord('hash', text) ?? readInlineWord('editScriptHash', text) ?? readInlineWord('scriptHash', text),
    name,
    language: readInlineWord('language', text),
    target: readInlineWord('target', text),
    targetLanguage: readInlineWord('targetLanguage', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    targetPath: readInlineWord('targetPath', text),
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    routeIds: readInlineList(text, 'routeIds'),
    baseHash: readInlineWord('baseHash', text),
    workerHash: readInlineWord('workerHash', text),
    headHash: readInlineWord('headHash', text),
    workerChangeSetId: readInlineWord('workerChangeSet', text) ?? readInlineWord('workerChangeSetId', text),
    headChangeSetId: readInlineWord('headChangeSet', text) ?? readInlineWord('headChangeSetId', text),
    lineageInferenceId: readInlineWord('lineageInference', text) ?? readInlineWord('lineageInferenceId', text),
    operations: operation ? [operation] : [],
    summary: cleanRecord({ operations: operation ? 1 : 0, status }),
    admission: semanticEditAdmission(status, readInlineWord('action', text) ?? readInlineWord('admissionAction', text), text, evidenceIds),
    evidence: evidenceIds?.map((id) => ({ id })),
    evidenceIds,
    sourceMapIds: readInlineList(text, 'sourceMap', 'sourceMaps', 'sourceMapIds'),
    sourceMapLinkIds: readInlineList(text, 'sourceMapLink', 'sourceMapLinks', 'sourceMapLinkIds'),
    sourceMapMappingIds: readInlineList(text, 'sourceMapMapping', 'sourceMapMappings', 'sourceMapMappingIds'),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      sourceBackprojectionMode,
      sourceBackprojection: sourceBackprojectionMode ? { mode: sourceBackprojectionMode } : undefined,
      authoredSourceSpan: authoredLine.sourceSpan,
      summary: readInlineQuoted('summary', text)
    })
  });
}

function parseSemanticEditProjection(name, text, authoredLine) {
  const edit = semanticEditProjectionEditRecord(text, authoredLine);
  const status = readInlineWord('status', text) ?? 'blocked';
  const evidenceIds = readInlineList(text, 'evidence', 'evidenceIds');
  return cleanRecord({
    kind: 'frontier.lang.semanticEditProjection',
    version: 1,
    schema: 'frontier.lang.semanticEditProjection.v1',
    id: idFrom(text, `semantic_edit_projection_${name}`),
    hash: readInlineWord('hash', text) ?? readInlineWord('projectionHash', text),
    name,
    scriptId: readInlineWord('script', text) ?? readInlineWord('scriptId', text) ?? readInlineWord('semanticEditScript', text) ?? readInlineWord('semanticEditScriptId', text),
    language: readInlineWord('language', text),
    target: readInlineWord('target', text),
    targetLanguage: readInlineWord('targetLanguage', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    targetPath: readInlineWord('targetPath', text),
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    routeIds: readInlineList(text, 'routeIds'),
    status,
    baseHash: readInlineWord('baseHash', text),
    workerHash: readInlineWord('workerHash', text),
    headHash: readInlineWord('headHash', text),
    projectedHash: readInlineWord('projectedHash', text) ?? readInlineWord('targetHash', text),
    appliedOperations: edit?.operationId ? [edit.operationId] : [],
    skippedOperations: [],
    edits: edit ? [edit] : [],
    admission: {
      status: readInlineWord('admissionStatus', text) ?? (status === 'projected' ? 'auto-merge-candidate' : 'blocked'),
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: readInlineList(text, 'reasonCode', 'reasonCodes') ?? []
    },
    evidenceIds,
    sourceMapIds: readInlineList(text, 'sourceMap', 'sourceMaps', 'sourceMapIds'),
    sourceMapLinkIds: readInlineList(text, 'sourceMapLink', 'sourceMapLinks', 'sourceMapLinkIds'),
    sourceMapMappingIds: readInlineList(text, 'sourceMapMapping', 'sourceMapMappings', 'sourceMapMappingIds'),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      sourceBackprojectionMode: readInlineWord('sourceBackprojection', text) ?? readInlineWord('sourceBackprojectionMode', text),
      authoredSourceSpan: authoredLine.sourceSpan,
      summary: readInlineQuoted('summary', text)
    })
  });
}

function parseSemanticEditReplay(name, text, authoredLine) {
  const edit = semanticEditReplayEditRecord(text, authoredLine);
  const status = readInlineWord('status', text) ?? readInlineWord('replayStatus', text) ?? 'blocked';
  const action = readInlineWord('action', text) ?? readInlineWord('replayAction', text) ?? readInlineWord('admissionAction', text) ?? 'human-review';
  const reasonCodes = readInlineList(text, 'reasonCode', 'reasonCodes') ?? [];
  const evidenceIds = readInlineList(text, 'evidence', 'evidenceIds');
  const applied = edit && (status === 'accepted-clean' || status === 'already-applied' || action === 'apply') ? [edit.operationId].filter(Boolean) : [];
  const skipped = edit && !applied.length ? [edit.operationId].filter(Boolean) : [];
  return cleanRecord({
    kind: 'frontier.lang.semanticEditReplay',
    version: 1,
    schema: 'frontier.lang.semanticEditReplay.v1',
    id: idFrom(text, `semantic_edit_replay_${name}`),
    hash: readInlineWord('hash', text) ?? readInlineWord('replayHash', text),
    name,
    projectionId: readInlineWord('projection', text) ?? readInlineWord('projectionId', text) ?? readInlineWord('semanticEditProjection', text) ?? readInlineWord('semanticEditProjectionId', text),
    scriptId: readInlineWord('script', text) ?? readInlineWord('scriptId', text) ?? readInlineWord('semanticEditScript', text) ?? readInlineWord('semanticEditScriptId', text),
    language: readInlineWord('language', text),
    target: readInlineWord('target', text),
    targetLanguage: readInlineWord('targetLanguage', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    targetPath: readInlineWord('targetPath', text),
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    routeIds: readInlineList(text, 'routeIds'),
    currentHash: readInlineWord('currentHash', text) ?? readInlineWord('replayCurrentHash', text),
    projectedHash: readInlineWord('projectedHash', text) ?? readInlineWord('targetHash', text),
    outputHash: readInlineWord('outputHash', text) ?? readInlineWord('replayOutputHash', text),
    status,
    edits: edit ? [edit] : [],
    appliedOperations: applied,
    skippedOperations: skipped,
    admission: {
      status,
      action,
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    summary: replaySummary(edit, status, reasonCodes),
    evidenceIds,
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      sourceBackprojectionMode: readInlineWord('sourceBackprojection', text) ?? readInlineWord('sourceBackprojectionMode', text),
      authoredSourceSpan: authoredLine.sourceSpan,
      summary: readInlineQuoted('summary', text)
    })
  });
}

function semanticEditOperationRecord(text, authoredLine) {
  const operationId = readInlineWord('operation', text) ?? readInlineWord('operationId', text) ?? readInlineWord('op', text);
  if (!operationId) return undefined;
  const sourceBackprojectionMode = readInlineWord('sourceBackprojection', text) ?? readInlineWord('sourceBackprojectionMode', text);
  return cleanRecord({
    id: operationId,
    kind: readInlineWord('operationKind', text) ?? readInlineWord('kind', text),
    changeKind: readInlineWord('changeKind', text),
    semanticKey: readInlineWord('semanticKey', text),
    semanticIdentityHash: readInlineWord('semanticIdentityHash', text),
    sourceIdentityHash: readInlineWord('sourceIdentityHash', text),
    operationContentHash: readInlineWord('operationContentHash', text),
    editContentHash: readInlineWord('editContentHash', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    symbolId: readInlineWord('symbolId', text),
    symbolName: readInlineWord('symbolName', text),
    symbolKind: readInlineWord('symbolKind', text),
    anchor: cleanRecord({
      key: readInlineWord('anchorKey', text) ?? readInlineWord('ownerKey', text) ?? readInlineWord('ownershipKey', text) ?? readInlineWord('semanticKey', text),
      conflictKey: readInlineWord('conflictKey', text),
      regionId: readInlineWord('region', text) ?? readInlineWord('regionId', text),
      regionKind: readInlineWord('regionKind', text),
      sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
      symbolId: readInlineWord('symbolId', text),
      symbolName: readInlineWord('symbolName', text),
      symbolKind: readInlineWord('symbolKind', text)
    }),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    reasonCodes: readInlineList(text, 'reasonCode', 'reasonCodes'),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      sourceBackprojection: sourceBackprojectionMode ? { mode: sourceBackprojectionMode } : undefined
    })
  });
}

function semanticEditProjectionEditRecord(text, authoredLine) {
  const operationId = readInlineWord('edit', text) ?? readInlineWord('operation', text) ?? readInlineWord('operationId', text);
  if (!operationId) return undefined;
  return cleanRecord({
    operationId,
    status: readInlineWord('editStatus', text) ?? 'applied',
    kind: readInlineWord('kind', text),
    editKind: readInlineWord('editKind', text),
    changeKind: readInlineWord('changeKind', text),
    anchorKey: readInlineWord('anchorKey', text) ?? readInlineWord('ownerKey', text) ?? readInlineWord('semanticKey', text),
    conflictKey: readInlineWord('conflictKey', text),
    regionId: readInlineWord('region', text) ?? readInlineWord('regionId', text),
    regionKind: readInlineWord('regionKind', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    targetSourcePath: readInlineWord('targetPath', text),
    symbolId: readInlineWord('symbolId', text),
    symbolName: readInlineWord('symbolName', text),
    symbolKind: readInlineWord('symbolKind', text),
    semanticKey: readInlineWord('semanticKey', text),
    semanticIdentityHash: readInlineWord('semanticIdentityHash', text),
    sourceIdentityHash: readInlineWord('sourceIdentityHash', text),
    operationContentHash: readInlineWord('operationContentHash', text),
    editContentHash: readInlineWord('editContentHash', text),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    reasonCodes: readInlineList(text, 'reasonCode', 'reasonCodes')
  });
}

function semanticEditReplayEditRecord(text, authoredLine) {
  const operationId = readInlineWord('edit', text) ?? readInlineWord('operation', text) ?? readInlineWord('operationId', text);
  if (!operationId) return undefined;
  return cleanRecord({
    operationId,
    status: readInlineWord('editStatus', text) ?? readInlineWord('status', text) ?? 'blocked',
    semanticKey: readInlineWord('semanticKey', text),
    semanticIdentityHash: readInlineWord('semanticIdentityHash', text),
    sourceIdentityHash: readInlineWord('sourceIdentityHash', text),
    operationContentHash: readInlineWord('operationContentHash', text),
    editContentHash: readInlineWord('editContentHash', text),
    editKind: readInlineWord('editKind', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    symbolName: readInlineWord('symbolName', text),
    symbolKind: readInlineWord('symbolKind', text),
    reasonCodes: readInlineList(text, 'reasonCode', 'reasonCodes') ?? [],
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan
  });
}

function semanticEditAdmission(status, action, text, evidenceIds = []) {
  return {
    status,
    action: action ?? 'record-evidence',
    reviewRequired: true,
    autoApplyCandidate: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: readInlineList(text, 'reasonCode', 'reasonCodes') ?? [],
    conflictKeys: readInlineList(text, 'conflictKey', 'conflictKeys') ?? [],
    evidenceIds
  };
}

function replaySummary(edit, status, reasonCodes) {
  return { edits: edit ? 1 : 0, applied: status === 'accepted-clean' ? 1 : 0, alreadyApplied: status === 'already-applied' ? 1 : 0, conflicts: status === 'conflict' ? 1 : 0, stale: status === 'stale' ? 1 : 0, blocked: status === 'blocked' ? 1 : 0, reasonCodes };
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
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'SemanticEditRecords'; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(unquotedText(text))?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
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
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0) && !(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)));
}
