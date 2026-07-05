export function semanticHistoryQuery(history) {
  return {
    sourceIds: ids(history.sources),
    importIds: unique(history.sources.map((record) => record.importId)),
    sourcePaths: unique([history.sourcePath, ...history.sources.map((record) => record.sourcePath), ...history.ownershipRegions.map((record) => record.sourcePath)]),
    sourceHashes: unique([history.sourceHash, ...history.sources.map((record) => record.sourceHash)]),
    actorIds: ids(history.actors),
    recordSourceIds: unique(history.recordSources.flatMap((record) => [record.id, record.sourceId])),
    ownershipKeys: unique(history.ownershipRegions.map((record) => record.key).concat(history.semanticCandidates.flatMap((record) => record.ownershipKeys ?? []))),
    semanticCandidateIds: ids(history.semanticCandidates),
    semanticClaimIds: ids(history.semanticClaims),
    proofRefIds: ids(history.proofRefs),
    reviewerIds: unique(ids(history.reviewers).concat(history.reviewers.map((record) => record.reviewerId))),
    admissionIds: unique(ids(history.admissions).concat(history.admissions.map((record) => record.admissionId))),
    admissionStatuses: unique(history.admissions.map((record) => record.status)),
    admissionReadinesses: unique(history.admissions.map((record) => record.readiness)),
    lineageEventIds: ids(history.lineageEvents),
    semanticAnchorKeys: unique(history.lineageEvents.flatMap((record) => [record.from?.key, ...(record.to ?? []).map((anchor) => anchor.key)])),
    patchIds: unique(history.patchAncestry.flatMap((record) => [record.patchId, ...(record.parentPatchIds ?? []), ...(record.ancestorPatchIds ?? [])])),
    mergeDecisionIds: ids(history.mergeDecisions),
    replayIds: ids(history.replayLinks),
    evidenceIds: history.evidenceIds,
    proofIds: history.proofIds,
    proofGapCodes: unique(history.proofGaps.map((record) => record.code)),
    missingEvidence: unique(history.missingEvidence.map((record) => record.reasonCode).concat(history.proofGaps.map((record) => record.code))),
    unknownRowIds: ids(history.unknownRows)
  };
}

export function summarizeSemanticHistory(history) {
  return {
    sourceCount: history.sources.length,
    ownershipRegionCount: history.ownershipRegions.length,
    semanticCandidateCount: history.semanticCandidates.length,
    semanticClaimCount: history.semanticClaims.length,
    acceptedFactCount: history.acceptedFacts.length,
    rejectedTheoryCount: history.rejectedTheories.length,
    parserEvidenceCount: history.importedParserEvidence.length,
    proofAttemptCount: history.proofAttempts.length,
    proofRefCount: history.proofRefs.length,
    reviewerCount: history.reviewers.length,
    admissionCount: history.admissions.length,
    lineageEventCount: history.lineageEvents.length,
    patchAncestryCount: history.patchAncestry.length,
    mergeDecisionCount: history.mergeDecisions.length,
    replayCount: history.replayLinks.length,
    evidenceCount: history.evidence.length,
    proofGapCount: history.proofGaps.length,
    missingEvidenceCount: history.missingEvidence.length,
    unknownRowCount: history.unknownRows.length,
    parseErrorCount: history.parser.errors.length
  };
}

export function allSemanticHistoryRecords(history) {
  return [
    ...history.actors,
    ...history.recordSources,
    ...history.sources,
    ...history.ownershipRegions,
    ...history.semanticCandidates,
    ...history.semanticClaims,
    ...history.importedParserEvidence,
    ...history.proofAttempts,
    ...history.proofRefs,
    ...history.reviewers,
    ...history.admissions,
    ...history.lineageEvents,
    ...history.patchAncestry,
    ...history.mergeDecisions,
    ...history.replayLinks,
    ...history.evidence,
    ...history.missingEvidence,
    ...history.proofGaps,
    ...history.unknownRows
  ];
}

function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function unique(values = []) { return [...new Set(values.filter(Boolean))]; }
