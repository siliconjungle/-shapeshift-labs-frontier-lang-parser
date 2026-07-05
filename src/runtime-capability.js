import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { createRowIdentityTracker } from './row-identity.js';
import { pushSemanticUnknownRow, readSemanticAuthoredLines } from './semantic-unknown-row.js';
import {
  cleanRecord,
  hostIds,
  idFrom,
  ids,
  isPropertyLine,
  nameFrom,
  readInlineFlag,
  readInlineList,
  readInlineWord,
  runtimeEvidence,
  runtimeFalseClaims,
  runtimeHostBinding,
  runtimeHostCapability,
  runtimeHostProfile,
  runtimeProofGap,
  runtimeRequirement,
  safeId,
  summarizeRuntimeCapabilities,
  uniqueHostSelectors,
  uniqueRecords
} from './runtime-capability-records.js';

export function parseRuntimeCapabilityBlock(block) {
  const name = nameFrom(block.header);
  const rowIdentity = createRowIdentityTracker();
  const matrix = {
    kind: 'frontier.lang.authoredRuntimeCapabilityMatrixInput',
    version: 1,
    id: idFrom(block.header, `runtime_capabilities_${safeId(name)}`),
    name,
    hostProfiles: [],
    sourceHosts: [],
    targetHosts: [],
    hostCapabilities: [],
    hostBindings: [],
    runtimeRequirements: [],
    evidence: [],
    proofGaps: [],
    unknownRows: [],
    parser: { status: 'authored', errors: rowIdentity.errors },
    claims: runtimeFalseClaims(),
    metadata: { authoredName: name, authoredBlockKind: block.kind }
  };
  const hostMap = new Map();

  for (const authoredLine of readSemanticAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#') || isPropertyLine(line)) continue;
    const match = /^(host|runtimeHost|hostProfile|sourceHost|targetHost|capability|hostCapability|hostBinding|binding|requirement|runtimeRequirement|requiredRuntime|evidence|proofEvidence|gap|proofGap)\s+([A-Za-z_$@/.:*-][\w$./@:*+-]*)(.*)$/.exec(line);
    if (!match) {
      pushUnsupportedRuntimeRow(matrix, line, authoredLine);
      continue;
    }
    const [, rowKind, rowName, rest] = match;
    if (rowKind === 'gap' || rowKind === 'proofGap') {
      rowIdentity.push(matrix.proofGaps, runtimeProofGap(rowName, rest, authoredLine), { rowKind, normalizedRowKind: 'proofGap', name: rowName, sourceSpan: authoredLine.sourceSpan });
      continue;
    }
    if (rowKind === 'evidence' || rowKind === 'proofEvidence') {
      rowIdentity.push(matrix.evidence, runtimeEvidence(rowName, rest, authoredLine), { rowKind, normalizedRowKind: 'evidence', name: rowName, sourceSpan: authoredLine.sourceSpan });
      continue;
    }
    if (rowKind === 'requirement' || rowKind === 'runtimeRequirement' || rowKind === 'requiredRuntime') {
      rowIdentity.push(matrix.runtimeRequirements, runtimeRequirement(rowName, rest, authoredLine), { rowKind, normalizedRowKind: 'runtimeRequirement', name: rowName, sourceSpan: authoredLine.sourceSpan });
      continue;
    }
    if (rowKind === 'capability' || rowKind === 'hostCapability') {
      const capabilityRecord = runtimeHostCapability(rowName, rest, authoredLine);
      if (capabilityRecord && rowIdentity.accept(capabilityRecord, { rowKind, normalizedRowKind: 'hostCapability', name: rowName, sourceSpan: authoredLine.sourceSpan })) {
        attachCapability(hostMap, matrix, capabilityRecord, rest);
      }
      continue;
    }
    if (rowKind === 'hostBinding' || rowKind === 'binding') {
      rowIdentity.push(matrix.hostBindings, runtimeHostBinding(rowName, rest, authoredLine), { rowKind, normalizedRowKind: 'hostBinding', name: rowName, sourceSpan: authoredLine.sourceSpan });
      continue;
    }
    const profile = runtimeHostProfile(rowKind, rowName, rest, authoredLine);
    rowIdentity.preserve(profile, {
      rowKind,
      normalizedRowKind: 'hostProfile',
      name: rowName,
      sourceSpan: authoredLine.sourceSpan,
      disposition: 'preserved-runtime-host-profile-upsert'
    });
    upsertHost(hostMap, matrix, profile, rowKind);
  }

  matrix.hostProfiles = [...hostMap.values()];
  matrix.hostCapabilities = uniqueRecords(matrix.hostCapabilities);
  matrix.hostBindings = uniqueRecords(matrix.hostBindings);
  matrix.hostProfileIds = ids(matrix.hostProfiles);
  matrix.sourceHostIds = hostIds(matrix.sourceHosts);
  matrix.targetHostIds = hostIds(matrix.targetHosts);
  matrix.hostCapabilityIds = ids(matrix.hostCapabilities);
  matrix.hostBindingIds = ids(matrix.hostBindings);
  matrix.runtimeRequirementIds = ids(matrix.runtimeRequirements);
  matrix.evidenceIds = ids(matrix.evidence);
  matrix.proofGapCodes = [...new Set(matrix.proofGaps.map((gap) => gap.code).filter(Boolean))];
  matrix.unknownRowIds = ids(matrix.unknownRows);
  matrix.missingEvidence = [...new Set(matrix.proofGaps.map((gap) => gap.code).filter(Boolean))];
  matrix.summary = summarizeRuntimeCapabilities(matrix);
  matrix.inputHash = hashSemanticValue({
    kind: 'frontier.lang.runtimeCapabilities.authoredInput.v1',
    hostProfiles: matrix.hostProfiles.map((profile) => ({
      id: profile.id,
      language: profile.language,
      runtime: profile.runtime,
      target: profile.target,
      capabilities: Object.keys(profile.capabilities ?? {}).sort()
    })),
    hostCapabilities: matrix.hostCapabilityIds,
    hostBindings: matrix.hostBindingIds,
    sourceHosts: matrix.sourceHostIds,
    targetHosts: matrix.targetHostIds,
    runtimeRequirements: matrix.runtimeRequirements.map((requirement) => ({
      id: requirement.id,
      capability: requirement.capability,
      sourceHost: requirement.sourceHost,
      targetHost: requirement.targetHost,
      requiredSignals: requirement.requiredSignals
    })),
    proofGaps: matrix.proofGapCodes,
    unknownRows: matrix.unknownRowIds
  });
  return matrix;
}

export function mergeRuntimeCapabilityBlocks(blocks) {
  const hostProfiles = uniqueRecords(blocks.flatMap((block) => block.hostProfiles ?? []));
  const sourceHosts = uniqueHostSelectors(blocks.flatMap((block) => block.sourceHosts ?? []));
  const targetHosts = uniqueHostSelectors(blocks.flatMap((block) => block.targetHosts ?? []));
  const hostCapabilities = uniqueRecords(blocks.flatMap((block) => block.hostCapabilities ?? []));
  const hostBindings = uniqueRecords(blocks.flatMap((block) => block.hostBindings ?? []));
  const runtimeRequirements = uniqueRecords(blocks.flatMap((block) => block.runtimeRequirements ?? []));
  const evidence = uniqueRecords(blocks.flatMap((block) => block.evidence ?? []));
  const proofGaps = uniqueRecords(blocks.flatMap((block) => block.proofGaps ?? []));
  const unknownRows = uniqueRecords(blocks.flatMap((block) => block.unknownRows ?? []));
  const parser = { status: 'authored', errors: blocks.flatMap((block) => block.parser?.errors ?? []) };
  if (parser.errors.length) parser.status = 'needs-review';
  return {
    kind: 'frontier.lang.authoredRuntimeCapabilityMatrixInput',
    version: 1,
    id: blocks.length === 1 ? blocks[0].id : 'runtimeCapabilities:source',
    blocks,
    blockIds: ids(blocks),
    hostProfiles,
    sourceHosts,
    targetHosts,
    hostCapabilities,
    hostBindings,
    runtimeRequirements,
    evidence,
    proofGaps,
    unknownRows,
    parser,
    hostProfileIds: ids(hostProfiles),
    sourceHostIds: hostIds(sourceHosts),
    targetHostIds: hostIds(targetHosts),
    hostCapabilityIds: ids(hostCapabilities),
    hostBindingIds: ids(hostBindings),
    runtimeRequirementIds: ids(runtimeRequirements),
    evidenceIds: ids(evidence),
    proofGapCodes: [...new Set(proofGaps.map((gap) => gap.code).filter(Boolean))],
    unknownRowIds: ids(unknownRows),
    missingEvidence: [...new Set(proofGaps.map((gap) => gap.code).filter(Boolean))],
    summary: summarizeRuntimeCapabilities({ hostProfiles, sourceHosts, targetHosts, hostCapabilities, hostBindings, runtimeRequirements, evidence, proofGaps, unknownRows, parser }),
    claims: runtimeFalseClaims(),
    metadata: { authoredRuntimeCapabilityBlockIds: ids(blocks) }
  };
}

function pushUnsupportedRuntimeRow(matrix, line, authoredLine) {
  const match = /^([A-Za-z_$][\w$-]*)\s+([A-Za-z_$@/.:*-][\w$./@:*+-]*)(.*)$/.exec(line);
  if (!match) return;
  const [, rowKind, rowName, rest] = match;
  pushSemanticUnknownRow(matrix, {
    surfaceKind: 'frontier.lang.authoredRuntimeCapabilityMatrixInput',
    idPrefix: 'runtime_capability',
    reason: 'unsupported-runtime-capability-row',
    rowKind,
    normalizedRowKind: rowKind,
    rowName,
    text: rest,
    authoredLine,
    rowLabel: 'runtimeCapabilities'
  });
}

function upsertHost(hostMap, matrix, profile, rowKind) {
  const existing = hostMap.get(profile.id) ?? { capabilities: {} };
  const merged = cleanRecord({
    ...existing,
    ...profile,
    capabilities: { ...(existing.capabilities ?? {}), ...(profile.capabilities ?? {}) }
  });
  hostMap.set(merged.id, merged);
  if (rowKind === 'sourceHost' || merged.role === 'source') matrix.sourceHosts.push(merged.id);
  if (rowKind === 'targetHost' || merged.role === 'target') matrix.targetHosts.push(merged.id);
}

function attachCapability(hostMap, matrix, capabilityRecord, text) {
  const hostId = capabilityRecord.hostId;
  const profile = hostMap.get(hostId) ?? runtimeHostProfile('host', hostId, '');
  const capability = capabilityRecord.capability;
  const normalized = cleanRecord({
    kind: capability,
    support: capabilityRecord.support,
    binding: capabilityRecord.binding ?? `${hostId}.${capability}`,
    notes: readInlineList(text, 'note', 'notes'),
    evidenceIds: capabilityRecord.evidenceIds,
    sourcePath: capabilityRecord.sourcePath,
    sourceHash: capabilityRecord.sourceHash,
    sourceSpan: capabilityRecord.sourceSpan,
    authoredSourceSpan: capabilityRecord.authoredSourceSpan
  });
  profile.capabilities = { ...(profile.capabilities ?? {}), [capability]: normalized };
  hostMap.set(hostId, profile);
  matrix.hostCapabilities.push(capabilityRecord);
  if (readInlineFlag('source', text) || readInlineWord('role', text) === 'source') matrix.sourceHosts.push(hostId);
  if (readInlineFlag('target', text) || readInlineWord('role', text) === 'target') matrix.targetHosts.push(hostId);
}
