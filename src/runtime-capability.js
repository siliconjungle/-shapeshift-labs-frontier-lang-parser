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
  readInlineQuoted,
  readInlineWord,
  runtimeEvidence,
  runtimeFalseClaims,
  runtimeProofGap,
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
      rowIdentity.push(matrix.proofGaps, runtimeProofGap(rowName, rest), { rowKind, normalizedRowKind: 'proofGap', name: rowName });
      continue;
    }
    if (rowKind === 'evidence' || rowKind === 'proofEvidence') {
      rowIdentity.push(matrix.evidence, runtimeEvidence(rowName, rest), { rowKind, normalizedRowKind: 'evidence', name: rowName });
      continue;
    }
    if (rowKind === 'requirement' || rowKind === 'runtimeRequirement' || rowKind === 'requiredRuntime') {
      rowIdentity.push(matrix.runtimeRequirements, runtimeRequirement(rowName, rest), { rowKind, normalizedRowKind: 'runtimeRequirement', name: rowName });
      continue;
    }
    if (rowKind === 'capability' || rowKind === 'hostCapability') {
      const capabilityRecord = runtimeHostCapability(rowName, rest);
      if (capabilityRecord && rowIdentity.accept(capabilityRecord, { rowKind, normalizedRowKind: 'hostCapability', name: rowName })) {
        attachCapability(hostMap, matrix, capabilityRecord, rest);
      }
      continue;
    }
    if (rowKind === 'hostBinding' || rowKind === 'binding') {
      rowIdentity.push(matrix.hostBindings, runtimeHostBinding(rowName, rest), { rowKind, normalizedRowKind: 'hostBinding', name: rowName });
      continue;
    }
    const profile = runtimeHostProfile(rowKind, rowName, rest);
    rowIdentity.preserve(profile, {
      rowKind,
      normalizedRowKind: 'hostProfile',
      name: rowName,
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

function runtimeHostProfile(rowKind, name, text) {
  const id = idFrom(text, name);
  const [languageFromId, runtimeFromId] = String(id).includes(':') ? String(id).split(':') : [];
  return cleanRecord({
    kind: 'frontier.lang.runtimeHostProfile',
    id,
    name: readInlineWord('name', text) ?? name,
    language: readInlineWord('language', text) ?? languageFromId,
    aliases: readInlineList(text, 'alias', 'aliases'),
    runtime: readInlineWord('runtime', text) ?? runtimeFromId,
    host: readInlineWord('host', text),
    target: readInlineWord('target', text),
    capabilities: {},
    notes: readInlineList(text, 'note', 'notes'),
    role: rowKind === 'sourceHost' ? 'source' : rowKind === 'targetHost' ? 'target' : readInlineWord('role', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    sourceHash: readInlineWord('sourceHash', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    claims: runtimeFalseClaims()
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
    sourceHash: capabilityRecord.sourceHash
  });
  profile.capabilities = { ...(profile.capabilities ?? {}), [capability]: normalized };
  hostMap.set(hostId, profile);
  matrix.hostCapabilities.push(capabilityRecord);
  if (readInlineFlag('source', text) || readInlineWord('role', text) === 'source') matrix.sourceHosts.push(hostId);
  if (readInlineFlag('target', text) || readInlineWord('role', text) === 'target') matrix.targetHosts.push(hostId);
}

function runtimeHostCapability(name, text) {
  const hostId = readInlineWord('host', text) ?? readInlineWord('hostId', text) ?? readInlineWord('sourceHost', text) ?? readInlineWord('targetHost', text);
  if (!hostId) return undefined;
  const capability = readInlineWord('capability', text) ?? readInlineWord('kind', text) ?? name;
  const bindingId = readInlineWord('bindingId', text) ?? readInlineWord('binding', text);
  return cleanRecord({
    kind: 'frontier.lang.runtimeCapability.hostCapability',
    id: idFrom(text, `runtime_capability_${safeId(hostId)}_${safeId(capability)}`),
    name,
    hostId,
    host: hostId,
    capability,
    support: readInlineWord('support', text) ?? 'native',
    permission: readInlineWord('permission', text),
    bindingId,
    binding: bindingId,
    requiredSignals: readInlineList(text, 'requiredSignal', 'requiredSignals', 'signal', 'signals'),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    missingEvidence: readInlineList(text, 'missingEvidence', 'missingEvidences'),
    proofGaps: readInlineList(text, 'proofGap', 'proofGaps'),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    sourceHash: readInlineWord('sourceHash', text),
    failClosed: true,
    claims: runtimeFalseClaims()
  });
}

function runtimeHostBinding(name, text) {
  return cleanRecord({
    kind: 'frontier.lang.runtimeCapability.hostBinding',
    id: idFrom(text, `runtime_binding_${safeId(name)}`),
    name,
    hostId: readInlineWord('host', text) ?? readInlineWord('hostId', text) ?? readInlineWord('sourceHost', text) ?? readInlineWord('targetHost', text),
    capability: readInlineWord('capability', text) ?? readInlineWord('kind', text),
    bindingKind: readInlineWord('bindingKind', text) ?? readInlineWord('kind', text),
    packageName: readInlineWord('package', text) ?? readInlineWord('packageName', text),
    importPath: readInlineWord('import', text) ?? readInlineWord('importPath', text),
    symbol: readInlineWord('symbol', text),
    apiName: readInlineWord('apiName', text),
    globalName: readInlineWord('globalName', text),
    command: readInlineQuoted('command', text) ?? readInlineWord('command', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'),
    missingEvidence: readInlineList(text, 'missingEvidence', 'missingEvidences'),
    proofGaps: readInlineList(text, 'proofGap', 'proofGaps'),
    failClosed: true,
    claims: runtimeFalseClaims()
  });
}

function runtimeRequirement(name, text) {
  return cleanRecord({
    id: idFrom(text, `runtime_requirement_${safeId(name)}`),
    name,
    capability: readInlineWord('capability', text) ?? readInlineWord('kind', text) ?? name,
    capabilities: readInlineList(text, 'capability', 'capabilities'),
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? readInlineWord('language', text),
    target: readInlineWord('target', text) ?? readInlineWord('targetLanguage', text),
    sourceRuntime: readInlineWord('sourceRuntime', text) ?? readInlineWord('runtime', text),
    targetRuntime: readInlineWord('targetRuntime', text),
    sourceHost: readInlineWord('sourceHost', text) ?? readInlineWord('sourceHostId', text),
    targetHost: readInlineWord('targetHost', text) ?? readInlineWord('targetHostId', text),
    reason: readInlineQuoted('reason', text) ?? readInlineWord('reason', text),
    requiredSignals: readInlineList(text, 'requiredSignal', 'requiredSignals', 'signal', 'signals', 'proofSignal', 'proofSignals'),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    hostCapabilityIds: readInlineList(text, 'hostCapability', 'hostCapabilityIds'),
    bindingIds: readInlineList(text, 'binding', 'bindingIds', 'hostBinding', 'hostBindingIds'),
    missingEvidence: readInlineList(text, 'missingEvidence', 'missingEvidences'),
    proofGaps: readInlineList(text, 'proofGap', 'proofGaps'),
    status: readInlineWord('status', text),
    readiness: readInlineWord('readiness', text),
    failClosed: true,
    claims: runtimeFalseClaims()
  });
}
