export function mergeSemanticHistoryBlocks(blocks) {
  const histories = blocks.map((block) => block.history ?? block.record).filter(Boolean);
  const records = blocks.flatMap((block) => block.records ?? []);
  return {
    id: blocks.length === 1 ? blocks[0].id : 'semanticHistory:source',
    histories,
    historyRecords: histories,
    records,
    historyIds: ids(histories),
    recordIds: ids(records),
    sourceIds: histories.flatMap((history) => ids(history.sources)),
    sourcePaths: unique(histories.flatMap((history) => history.query?.sourcePaths ?? [])),
    ownershipKeys: unique(histories.flatMap((history) => history.query?.ownershipKeys ?? [])),
    semanticCandidateIds: histories.flatMap((history) => ids(history.semanticCandidates)),
    semanticClaimIds: histories.flatMap((history) => ids(history.semanticClaims)),
    acceptedFactIds: histories.flatMap((history) => ids(history.acceptedFacts)),
    rejectedTheoryIds: histories.flatMap((history) => ids(history.rejectedTheories)),
    importedParserEvidenceIds: histories.flatMap((history) => ids(history.importedParserEvidence)),
    proofAttemptIds: histories.flatMap((history) => ids(history.proofAttempts)),
    proofRefIds: histories.flatMap((history) => ids(history.proofRefs)),
    reviewerIds: unique(histories.flatMap((history) => history.query?.reviewerIds ?? [])),
    admissionIds: unique(histories.flatMap((history) => history.query?.admissionIds ?? [])),
    admissionStatuses: unique(histories.flatMap((history) => history.query?.admissionStatuses ?? [])),
    admissionReadinesses: unique(histories.flatMap((history) => history.query?.admissionReadinesses ?? [])),
    lineageEventIds: histories.flatMap((history) => ids(history.lineageEvents)),
    semanticAnchorKeys: unique(histories.flatMap((history) => history.query?.semanticAnchorKeys ?? [])),
    patchIds: unique(histories.flatMap((history) => history.query?.patchIds ?? [])),
    mergeDecisionIds: histories.flatMap((history) => ids(history.mergeDecisions)),
    replayIds: histories.flatMap((history) => ids(history.replayLinks)),
    evidenceIds: unique(histories.flatMap((history) => history.evidenceIds ?? [])),
    proofIds: unique(histories.flatMap((history) => history.proofIds ?? [])),
    proofGapCodes: unique(histories.flatMap((history) => history.query?.proofGapCodes ?? [])),
    missingEvidence: unique(histories.flatMap((history) => history.query?.missingEvidence ?? [])),
    unknownRowIds: histories.flatMap((history) => ids(history.unknownRows)),
    summary: semanticHistorySummary(blocks, histories.length, records.length),
    metadata: { authoredSemanticHistoryBlockIds: blocks.map((block) => block.id) }
  };
}

function semanticHistorySummary(blocks, historyCount, recordCount) {
  return {
    historyCount,
    recordCount,
    sourceCount: sum(blocks, 'sourceCount'),
    ownershipRegionCount: sum(blocks, 'ownershipRegionCount'),
    semanticCandidateCount: sum(blocks, 'semanticCandidateCount'),
    semanticClaimCount: sum(blocks, 'semanticClaimCount'),
    acceptedFactCount: sum(blocks, 'acceptedFactCount'),
    rejectedTheoryCount: sum(blocks, 'rejectedTheoryCount'),
    parserEvidenceCount: sum(blocks, 'parserEvidenceCount'),
    proofAttemptCount: sum(blocks, 'proofAttemptCount'),
    proofRefCount: sum(blocks, 'proofRefCount'),
    reviewerCount: sum(blocks, 'reviewerCount'),
    admissionCount: sum(blocks, 'admissionCount'),
    lineageEventCount: sum(blocks, 'lineageEventCount'),
    patchAncestryCount: sum(blocks, 'patchAncestryCount'),
    mergeDecisionCount: sum(blocks, 'mergeDecisionCount'),
    replayCount: sum(blocks, 'replayCount'),
    evidenceCount: sum(blocks, 'evidenceCount'),
    proofGapCount: sum(blocks, 'proofGapCount'),
    missingEvidenceCount: sum(blocks, 'missingEvidenceCount'),
    unknownRowCount: sum(blocks, 'unknownRowCount'),
    parseErrorCount: sum(blocks, 'parseErrorCount')
  };
}

function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function unique(values = []) { return [...new Set(values.filter(Boolean))]; }
function sum(blocks, key) { return blocks.reduce((total, block) => total + (block.summary?.[key] ?? 0), 0); }
