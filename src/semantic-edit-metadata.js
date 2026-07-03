export function mergeSemanticEditBlocks(blocks) {
  const scripts = blocks.flatMap((block) => block.scripts ?? []);
  const projections = blocks.flatMap((block) => block.projections ?? []);
  const replays = blocks.flatMap((block) => block.replays ?? []);
  return {
    id: blocks.length === 1 ? blocks[0].id : 'semanticEditRecords:source',
    scripts,
    projections,
    replays,
    scriptIds: ids(scripts),
    projectionIds: ids(projections),
    replayIds: ids(replays),
    evidenceIds: uniqueStrings([
      ...scripts.flatMap((record) => record.evidenceIds ?? []),
      ...projections.flatMap((record) => record.evidenceIds ?? []),
      ...replays.flatMap((record) => record.evidenceIds ?? [])
    ]),
    operationIds: uniqueStrings([
      ...scripts.flatMap((record) => (record.operations ?? []).map((operation) => operation.id)),
      ...projections.flatMap((record) => (record.edits ?? []).map((edit) => edit.operationId)),
      ...replays.flatMap((record) => (record.edits ?? []).map((edit) => edit.operationId)),
      ...replays.flatMap((record) => record.appliedOperations ?? []),
      ...replays.flatMap((record) => record.skippedOperations ?? [])
    ]),
    sourceMapIds: uniqueStrings([
      ...scripts.flatMap((record) => record.sourceMapIds ?? []),
      ...projections.flatMap((record) => record.sourceMapIds ?? [])
    ]),
    sourceMapLinkIds: uniqueStrings([
      ...scripts.flatMap((record) => record.sourceMapLinkIds ?? []),
      ...projections.flatMap((record) => record.sourceMapLinkIds ?? [])
    ]),
    sourceMapMappingIds: uniqueStrings([
      ...scripts.flatMap((record) => record.sourceMapMappingIds ?? []),
      ...projections.flatMap((record) => record.sourceMapMappingIds ?? [])
    ]),
    summary: {
      scriptCount: scripts.length,
      projectionCount: projections.length,
      replayCount: replays.length,
      operationCount: scripts.reduce((sum, record) => sum + (record.operations?.length ?? 0), 0),
      projectionEditCount: projections.reduce((sum, record) => sum + (record.edits?.length ?? 0), 0),
      replayEditCount: replays.reduce((sum, record) => sum + (record.edits?.length ?? 0), 0)
    },
    claims: { autoMergeClaim: false, semanticEquivalenceClaim: false },
    metadata: { authoredSemanticEditBlockIds: blocks.map((block) => block.id) }
  };
}

function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function uniqueStrings(values = []) { return [...new Set(values.filter(Boolean).map(String))]; }
