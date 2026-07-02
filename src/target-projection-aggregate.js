export function mergeTargetProjectionTargets(targets = []) {
  const entries = targets.map(targetProjectionEntry).filter(Boolean);
  if (!entries.length) return undefined;
  const contracts = entries.flatMap((entry) => entry.projectionContracts ?? []);
  const layers = entries.flatMap((entry) => entry.projectionLayers ?? []);
  return {
    id: entries.length === 1 ? `targetProjections:${entries[0].id}` : 'targetProjections:source',
    targets: entries,
    targetIds: ids(entries),
    targetLanguages: uniqueStrings(entries.map((entry) => entry.target?.language)),
    emitPaths: uniqueStrings(entries.map((entry) => entry.target?.emitPath)),
    projectionContracts: contracts,
    projectionLayers: layers,
    projectionContractIds: ids(contracts),
    projectionLayerIds: ids(layers),
    representedLayerKinds: uniqueStrings(contracts.flatMap((entry) => entry.representedLayerKinds ?? [])),
    missingLayerKinds: uniqueStrings(contracts.flatMap((entry) => entry.missingLayerKinds ?? [])),
    evidenceIds: uniqueStrings(entries.flatMap((entry) => entry.evidenceIds ?? [])),
    proofEvidenceIds: uniqueStrings(entries.flatMap((entry) => entry.proofEvidenceIds ?? [])),
    lossIds: uniqueStrings(entries.flatMap((entry) => entry.lossIds ?? [])),
    missingEvidence: uniqueStrings(entries.flatMap((entry) => entry.missingEvidence ?? [])),
    summary: {
      targetCount: entries.length,
      projectionContractCount: contracts.length,
      projectionLayerCount: layers.length,
      missingEvidenceCount: uniqueStrings(entries.flatMap((entry) => entry.missingEvidence ?? [])).length,
      lossCount: uniqueStrings(entries.flatMap((entry) => entry.lossIds ?? [])).length
    },
    claims: { semanticEquivalenceClaim: false, autoMergeClaim: false },
    metadata: { authoredTargetProjectionTargetIds: ids(entries) }
  };
}

function targetProjectionEntry(node = {}) {
  const metadata = node.metadata;
  if (!metadata?.authoredTargetProjection) return undefined;
  const projectionContracts = enrichRows(metadata.projectionContracts, node);
  const projectionLayers = enrichRows(metadata.projectionLayers, node);
  return cleanObject({
    id: node.id,
    kind: 'frontier.lang.targetProjectionTarget',
    name: node.name,
    target: node.target,
    projectionContracts,
    projectionLayers,
    projectionContractIds: ids(projectionContracts),
    projectionLayerIds: ids(projectionLayers),
    representedLayerKinds: uniqueStrings(projectionContracts.flatMap((entry) => entry.representedLayerKinds ?? [])),
    missingLayerKinds: uniqueStrings(projectionContracts.flatMap((entry) => entry.missingLayerKinds ?? [])),
    evidenceIds: metadata.evidenceIds,
    proofEvidenceIds: metadata.proofEvidenceIds,
    lossIds: metadata.lossIds,
    missingEvidence: metadata.missingEvidence,
    claims: { semanticEquivalenceClaim: false, autoMergeClaim: false },
    metadata: { authoredTargetProjection: true, targetNodeId: node.id, targetLanguage: node.target?.language ?? node.name }
  });
}

function enrichRows(rows = [], node = {}) {
  return rows.map((row) => cleanObject({
    targetId: node.id,
    targetName: node.name,
    targetLanguage: node.target?.language ?? node.name,
    packageName: node.target?.packageName,
    emitPath: node.target?.emitPath,
    moduleFormat: node.target?.moduleFormat,
    ...row,
    semanticEquivalenceClaim: false,
    autoMergeClaim: false
  }));
}

function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function uniqueStrings(values = []) { return [...new Set(values.filter(Boolean))]; }
function cleanObject(object) { return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
