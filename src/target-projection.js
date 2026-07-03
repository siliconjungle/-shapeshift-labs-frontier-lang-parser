export function parseTargetProjectionMetadata(blockOrBody, targetName) {
  const projectionContracts = readTargetProjectionContracts(blockOrBody, targetName);
  const projectionLayers = readTargetProjectionLayers(blockOrBody, targetName);
  if (!projectionContracts.length && !projectionLayers.length) return undefined;
  return cleanObject({
    authoredTargetProjection: true,
    projectionContracts,
    projectionLayers,
    projectionContractIds: projectionContracts.map((entry) => entry.id),
    projectionLayerIds: projectionLayers.map((entry) => entry.id),
    evidenceIds: uniqueStrings([...projectionContracts.flatMap((entry) => entry.evidenceIds ?? []), ...projectionLayers.flatMap((entry) => entry.evidenceIds ?? [])]),
    proofEvidenceIds: uniqueStrings(projectionContracts.flatMap((entry) => entry.proofEvidenceIds ?? [])),
    lossIds: uniqueStrings(projectionContracts.flatMap((entry) => entry.lossIds ?? [])),
    missingEvidence: uniqueStrings([...projectionContracts.flatMap((entry) => entry.missingEvidence ?? []), ...projectionLayers.flatMap((entry) => entry.missingEvidence ?? [])]),
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
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function uniqueStrings(values) { return [...new Set(values.filter(Boolean))]; }
function cleanObject(object) { return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
