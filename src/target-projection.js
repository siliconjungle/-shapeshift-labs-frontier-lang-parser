export function parseTargetProjectionMetadata(blockOrBody, targetName) {
  const projectionContracts = readTargetProjectionContracts(blockOrBody, targetName);
  const projectionLayers = readTargetProjectionLayers(blockOrBody, targetName);
  const targetRows = readTargetRows(blockOrBody, targetName);
  if (
    !projectionContracts.length &&
    !projectionLayers.length &&
    !targetRows.targetEvidence.length &&
    !targetRows.targetSourceMaps.length &&
    !targetRows.targetLosses.length &&
    !targetRows.targetProofGaps.length &&
    !targetRows.missingEvidence.length
  ) return undefined;
  return cleanObject({
    authoredTargetProjection: true,
    projectionContracts,
    projectionLayers,
    targetEvidence: targetRows.targetEvidence,
    targetSourceMaps: targetRows.targetSourceMaps,
    targetLosses: targetRows.targetLosses,
    targetProofGaps: targetRows.targetProofGaps,
    projectionContractIds: projectionContracts.map((entry) => entry.id),
    projectionLayerIds: projectionLayers.map((entry) => entry.id),
    targetEvidenceIds: targetRows.targetEvidence.map((entry) => entry.id).filter(Boolean),
    targetSourceMapIds: targetRows.targetSourceMaps.map((entry) => entry.id).filter(Boolean),
    targetLossIds: targetRows.targetLosses.map((entry) => entry.id).filter(Boolean),
    targetProofGapIds: targetRows.targetProofGaps.map((entry) => entry.id).filter(Boolean),
    evidenceIds: uniqueStrings([
      ...projectionContracts.flatMap((entry) => entry.evidenceIds ?? []),
      ...projectionLayers.flatMap((entry) => entry.evidenceIds ?? []),
      ...targetRows.targetEvidence.map((entry) => entry.id),
      ...targetRows.targetSourceMaps.flatMap((entry) => entry.evidenceIds ?? []),
      ...targetRows.targetLosses.flatMap((entry) => entry.evidenceIds ?? []),
      ...targetRows.targetProofGaps.flatMap((entry) => entry.evidenceIds ?? [])
    ]),
    proofEvidenceIds: uniqueStrings([
      ...projectionContracts.flatMap((entry) => entry.proofEvidenceIds ?? []),
      ...targetRows.targetEvidence.filter((entry) => entry.rowKind === 'proof' || entry.rowKind === 'proofEvidence').map((entry) => entry.id),
      ...targetRows.targetEvidence.flatMap((entry) => entry.proofEvidenceIds ?? [])
    ]),
    lossIds: uniqueStrings([
      ...projectionContracts.flatMap((entry) => entry.lossIds ?? []),
      ...targetRows.targetLosses.map((entry) => entry.id),
      ...targetRows.targetSourceMaps.flatMap((entry) => entry.lossIds ?? []),
      ...targetRows.targetProofGaps.flatMap((entry) => entry.lossIds ?? [])
    ]),
    missingEvidence: uniqueStrings([
      ...projectionContracts.flatMap((entry) => entry.missingEvidence ?? []),
      ...projectionLayers.flatMap((entry) => entry.missingEvidence ?? []),
      ...targetRows.missingEvidence,
      ...targetRows.targetLosses.flatMap((entry) => entry.missingEvidence ?? []),
      ...targetRows.targetProofGaps.flatMap((entry) => entry.missingEvidence ?? [])
    ]),
    proofGapCodes: uniqueStrings(targetRows.targetProofGaps.map((entry) => entry.code)),
    semanticEquivalenceClaim: false,
    autoMergeClaim: false
  });
}

function readTargetProjectionContracts(blockOrBody, targetName) {
  const rows = [];
  for (const authoredLine of readAuthoredLines(blockOrBody)) {
    const match = /^(projection|lowering)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(authoredLine.text);
    if (!match) continue;
    const [, rowKind, name, text] = match;
    rows.push(cleanObject({
      id: idFrom(text, `target_projection_${targetName}_${name}`),
      kind: 'frontier.lang.targetProjectionContract',
      name,
      rowKind,
      disposition: readInlineWord('disposition', text) ?? readInlineWord('mode', text),
      readiness: readInlineWord('readiness', text),
      adapterId: readInlineWord('adapter', text) ?? readInlineWord('adapterId', text),
      sourceLanguage: readInlineWord('sourceLanguage', text) ?? readInlineWord('source', text),
      representedLayerKinds: readInlineList(text, 'represented', 'representedLayerKinds'),
      missingLayerKinds: readInlineList(text, 'missing', 'missingLayerKinds'),
      requiredLayerKinds: readInlineList(text, 'requires', 'required', 'requiredLayerKinds'),
      evidenceIds: readInlineList(text, 'evidence', 'evidenceId', 'evidenceIds'),
      proofEvidenceIds: readInlineList(text, 'proof', 'proofEvidence', 'proofEvidenceIds'),
      lossIds: readInlineList(text, 'loss', 'lossId', 'lossIds'),
      missingEvidence: readInlineList(text, 'missingEvidence'),
      review: readInlineList(text, 'review'),
      blockers: readInlineList(text, 'blocker', 'blockers'),
      sourceSpan: authoredLine.sourceSpan,
      authoredSourceSpan: authoredLine.sourceSpan,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }));
  }
  return rows;
}

function readTargetProjectionLayers(blockOrBody, targetName) {
  const rows = [];
  for (const authoredLine of readAuthoredLines(blockOrBody)) {
    const match = /^layer\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(authoredLine.text);
    if (!match) continue;
    const [, name, text] = match;
    rows.push(cleanObject({
      id: idFrom(text, `target_layer_${targetName}_${name}`),
      kind: 'frontier.lang.targetProjectionLayer',
      name,
      layerKind: readInlineWord('kind', text) ?? readInlineWord('layerKind', text) ?? name,
      status: readInlineWord('status', text) ?? 'represented',
      evidenceIds: readInlineList(text, 'evidence', 'evidenceId', 'evidenceIds'),
      missingEvidence: readInlineList(text, 'missingEvidence'),
      review: readInlineList(text, 'review'),
      blockers: readInlineList(text, 'blocker', 'blockers'),
      sourceSpan: authoredLine.sourceSpan,
      authoredSourceSpan: authoredLine.sourceSpan,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }));
  }
  return rows;
}

function readTargetRows(blockOrBody, targetName) {
  const targetEvidence = [];
  const targetSourceMaps = [];
  const targetLosses = [];
  const targetProofGaps = [];
  const missingEvidence = [];
  for (const authoredLine of readAuthoredLines(blockOrBody)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#')) continue;
    const row = /^(evidence|proofEvidence|proof|sourceMap|sourcemap|mapping|sourceMapMapping|loss|missingEvidence|gap|proofGap)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!row) continue;
    const [, rowKind, name, text] = row;
    if (rowKind === 'evidence' || rowKind === 'proofEvidence' || rowKind === 'proof') {
      targetEvidence.push(cleanObject({
        id: idFrom(text, `target_evidence_${targetName}_${name}`),
        kind: 'frontier.lang.targetProjectionEvidence',
        rowKind,
        name,
        evidenceKind: readInlineWord('kind', text) ?? (rowKind === 'proof' ? 'proof' : 'evidence'),
        status: readInlineWord('status', text) ?? 'unknown',
        path: readInlineWord('path', text),
        command: readInlineQuoted('command', text) ?? readInlineWord('command', text),
        probeId: readInlineWord('probeId', text) ?? readInlineWord('probe', text),
        sourceHash: readInlineWord('sourceHash', text),
        targetHash: readInlineWord('targetHash', text),
        telemetryHash: readInlineWord('telemetryHash', text),
        proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'),
        missingEvidence: readInlineList(text, 'missingEvidence'),
        sourceSpan: authoredLine.sourceSpan,
        authoredSourceSpan: authoredLine.sourceSpan,
        semanticEquivalenceClaim: false,
        autoMergeClaim: false
      }));
      continue;
    }
    if (rowKind === 'sourceMap' || rowKind === 'sourcemap' || rowKind === 'mapping' || rowKind === 'sourceMapMapping') {
      targetSourceMaps.push(cleanObject({
        id: idFrom(text, `target_source_map_${targetName}_${name}`),
        kind: 'frontier.lang.targetProjectionSourceMap',
        rowKind,
        normalizedRowKind: 'sourceMap',
        name,
        sourceMapKind: readInlineWord('kind', text) ?? (rowKind === 'mapping' || rowKind === 'sourceMapMapping' ? 'mapping' : 'source-map'),
        sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
        targetPath: readInlineWord('targetPath', text) ?? readInlineWord('generated', text),
        generatedPath: readInlineWord('generated', text) ?? readInlineWord('targetPath', text),
        sourceHash: readInlineWord('sourceHash', text),
        targetHash: readInlineWord('targetHash', text),
        precision: readInlineWord('precision', text),
        evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
        lossIds: readInlineList(text, 'loss', 'lossId', 'lossIds'),
        sourceSpan: authoredLine.sourceSpan,
        authoredSourceSpan: authoredLine.sourceSpan,
        semanticEquivalenceClaim: false,
        autoMergeClaim: false
      }));
      continue;
    }
    if (rowKind === 'loss') {
      targetLosses.push(cleanObject({
        id: idFrom(text, `target_loss_${targetName}_${name}`),
        kind: 'frontier.lang.targetProjectionLoss',
        rowKind,
        name,
        lossKind: readInlineWord('kind', text) ?? readInlineWord('lossKind', text) ?? name,
        severity: readInlineWord('severity', text) ?? 'warning',
        statement: readInlineQuoted('statement', text) ?? readInlineQuoted('summary', text),
        evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
        missingEvidence: readInlineList(text, 'missingEvidence'),
        sourceSpan: authoredLine.sourceSpan,
        authoredSourceSpan: authoredLine.sourceSpan,
        semanticEquivalenceClaim: false,
        autoMergeClaim: false
      }));
      continue;
    }
    if (rowKind === 'missingEvidence') {
      missingEvidence.push(name, ...(readInlineList(text, 'evidence', 'evidenceIds', 'missingEvidence') ?? []));
      continue;
    }
    targetProofGaps.push(cleanObject({
      id: idFrom(text, `target_proof_gap_${targetName}_${name}`),
      kind: 'frontier.lang.targetProjectionProofGap',
      rowKind,
      name,
      code: readInlineWord('code', text) ?? readInlineWord('reasonCode', text) ?? name,
      status: readInlineWord('status', text) ?? 'missing',
      summary: readInlineQuoted('summary', text) ?? readInlineQuoted('message', text),
      evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
      lossIds: readInlineList(text, 'loss', 'lossId', 'lossIds'),
      missingEvidence: readInlineList(text, 'missingEvidence'),
      failClosed: true,
      sourceSpan: authoredLine.sourceSpan,
      authoredSourceSpan: authoredLine.sourceSpan,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }));
  }
  return {
    targetEvidence,
    targetSourceMaps,
    targetLosses,
    targetProofGaps,
    missingEvidence: uniqueStrings(missingEvidence)
  };
}

function readAuthoredLines(blockOrBody) {
  const body = typeof blockOrBody === 'string' ? blockOrBody : blockOrBody?.body ?? '';
  const lines = body.split('\n');
  const records = [];
  let lineStart = typeof blockOrBody === 'string' ? 0 : blockOrBody?.syntax?.bodyStartOffset ?? 0;
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
      sourceSpan: typeof blockOrBody?.sourceSpan === 'function' ? blockOrBody.sourceSpan(startOffset, endOffset) : undefined
    });
    lineStart = rawEnd + 1;
  }
  return records;
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function uniqueStrings(values) { return [...new Set(values.filter(Boolean))]; }
function cleanObject(object) { return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
