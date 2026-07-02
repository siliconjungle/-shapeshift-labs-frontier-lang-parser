export function parseTargetProjectionMetadata(body, targetName) {
  const projectionContracts = readTargetProjectionContracts(body, targetName);
  const projectionLayers = readTargetProjectionLayers(body, targetName);
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

function readTargetProjectionContracts(body, targetName) {
  const rows = [];
  const re = /^\s*(projection|lowering)\s+([A-Za-z_$][\w$-]*)([^\n]*)$/gm;
  let match;
  while ((match = re.exec(body))) {
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
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }));
  }
  return rows;
}

function readTargetProjectionLayers(body, targetName) {
  const rows = [];
  const re = /^\s*layer\s+([A-Za-z_$][\w$-]*)([^\n]*)$/gm;
  let match;
  while ((match = re.exec(body))) {
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
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }));
  }
  return rows;
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
