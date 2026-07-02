import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

export function parseApplicationSurfaceBlock(block) {
  const name = nameFrom(block.header);
  const surfaceKind = surfaceKindFrom(block.kind);
  const role = readLine('role', block.body) ?? defaultRole(surfaceKind);
  const sourcePath = readLine('sourcePath', block.body) ?? readLine('path', block.body);
  const sourceHash = readLine('sourceHash', block.body);
  const evidence = parseEvidenceRows(block.body);
  const records = [];
  const proofGaps = [];
  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || isPropertyLine(line)) continue;
    const match = /^(mount|provide|provides|required|requires|require|route|event|asset|gate|gap|proofGap)\s+([A-Za-z_$@/.*][\w$./@:*+-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, rest] = match;
    if (rowKind === 'gap' || rowKind === 'proofGap') {
      proofGaps.push(applicationProofGap(rowName, rest));
      continue;
    }
    records.push(applicationRecord(normalizeRowKind(rowKind), rowName, rest, {
      surfaceId: idFrom(block.header, `application_surface_${safeId(name)}`),
      surfaceName: name,
      role,
      sourcePath,
      sourceHash
    }));
  }
  const allGaps = [...records.flatMap((record) => record.proofGaps ?? []), ...proofGaps];
  const tree = {
    kind: 'frontier.lang.applicationSurface',
    version: 1,
    id: idFrom(block.header, `application_surface_${safeId(name)}`),
    name,
    surfaceKind,
    role,
    hostId: readLine('host', block.body) ?? readLine('hostId', block.body),
    sourcePath,
    sourceHash,
    records,
    proofGaps: allGaps,
    evidence,
    parser: { status: 'authored', errors: [] },
    claims: applicationFalseClaims(),
    metadata: { authoredName: name, authoredBlockKind: block.kind }
  };
  tree.summary = summarizeApplicationSurface(tree);
  tree.treeHash = hashSemanticValue({
    kind: 'frontier.lang.applicationSurface.authoredTree.v1',
    role,
    records: records.map(hashableRecord),
    proofGaps: allGaps.map((gap) => gap.code)
  });
  return tree;
}

export function mergeApplicationSurfaceBlocks(blocks) {
  const records = blocks.flatMap((block) => block.records ?? []);
  return {
    id: blocks.length === 1 ? blocks[0].id : 'applicationSurfaces:source',
    surfaces: blocks,
    surfaceIds: ids(blocks),
    recordIds: ids(records),
    mountIds: idsByRecordKind(records, 'mount'),
    providedSurfaceIds: idsByRecordKind(records, 'provided-surface'),
    requiredCapabilityIds: idsByRecordKind(records, 'required-capability'),
    routeIds: idsByRecordKind(records, 'route'),
    eventIds: idsByRecordKind(records, 'event'),
    assetIds: idsByRecordKind(records, 'asset'),
    gateIds: idsByRecordKind(records, 'gate'),
    evidenceIds: blocks.flatMap((block) => ids(block.evidence)),
    proofGapCodes: [...new Set(blocks.flatMap((block) => (block.proofGaps ?? []).map((gap) => gap.code).filter(Boolean)))],
    summary: {
      surfaceCount: blocks.length,
      recordCount: records.length,
      mountCount: blocks.reduce((total, block) => total + (block.summary?.mountCount ?? 0), 0),
      providedSurfaceCount: blocks.reduce((total, block) => total + (block.summary?.providedSurfaceCount ?? 0), 0),
      requiredCapabilityCount: blocks.reduce((total, block) => total + (block.summary?.requiredCapabilityCount ?? 0), 0),
      routeCount: blocks.reduce((total, block) => total + (block.summary?.routeCount ?? 0), 0),
      eventCount: blocks.reduce((total, block) => total + (block.summary?.eventCount ?? 0), 0),
      assetCount: blocks.reduce((total, block) => total + (block.summary?.assetCount ?? 0), 0),
      gateCount: blocks.reduce((total, block) => total + (block.summary?.gateCount ?? 0), 0),
      proofGapCount: blocks.reduce((total, block) => total + (block.proofGaps?.length ?? 0), 0)
    },
    claims: applicationFalseClaims(),
    metadata: { authoredApplicationSurfaceIds: ids(blocks) }
  };
}

function applicationRecord(kind, name, text, context) {
  const recordName = readInlineWord('name', text) ?? name;
  const proofGaps = readInlineList(text, 'proofGap', 'proofGaps', 'gap', 'gaps')?.map((code) => applicationProofGap(code, '')) ?? [];
  const base = {
    kind: 'frontier.lang.applicationSurface.record',
    recordKind: kind,
    id: idFrom(text, `application_${kind.replace(/-/g, '_')}_${safeId(recordName)}`),
    name: recordName,
    surfaceId: context.surfaceId,
    surfaceName: context.surfaceName,
    role: context.role,
    identityKey: readInlineWord('identity', text) ?? readInlineWord('identityKey', text) ?? `${kind}:${context.role}:${recordName}`,
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text) ?? context.sourcePath,
    sourceHash: readInlineWord('sourceHash', text) ?? context.sourceHash,
    sourceSpan: parseSpan(readInlineWord('sourceSpan', text)),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'),
    missingEvidence: readInlineList(text, 'missingEvidence'),
    proofGaps,
    claims: applicationFalseClaims()
  };
  if (kind === 'mount') return cleanRecord({
    ...base,
    mountKind: readInlineWord('kind', text) ?? readInlineWord('mountKind', text) ?? 'region',
    path: readInlineQuoted('path', text) ?? readInlineWord('path', text),
    slot: readInlineWord('slot', text),
    parentId: readInlineWord('parent', text) ?? readInlineWord('parentId', text),
    viewId: readInlineWord('view', text) ?? readInlineWord('viewId', text),
    target: readInlineWord('target', text),
    renderer: readInlineWord('renderer', text)
  });
  if (kind === 'provided-surface') return cleanRecord({
    ...base,
    surfaceKind: readInlineWord('surface', text) ?? readInlineWord('surfaceKind', text) ?? readInlineWord('kind', text) ?? 'view',
    viewId: readInlineWord('view', text) ?? readInlineWord('viewId', text),
    actionId: readInlineWord('action', text) ?? readInlineWord('actionId', text),
    effectId: readInlineWord('effect', text) ?? readInlineWord('effectId', text),
    component: readInlineWord('component', text),
    mountId: readInlineWord('mount', text) ?? readInlineWord('mountId', text),
    routeId: readInlineWord('route', text) ?? readInlineWord('routeId', text),
    capabilityIds: readInlineList(text, 'capability', 'capabilities', 'capabilityIds'),
    target: readInlineWord('target', text),
    language: readInlineWord('language', text),
    contractId: readInlineWord('contract', text) ?? readInlineWord('contractId', text)
  });
  if (kind === 'required-capability') return cleanRecord({
    ...base,
    capability: readInlineWord('capability', text) ?? readInlineWord('capabilityId', text) ?? recordName,
    category: readInlineWord('category', text),
    permission: readInlineWord('permission', text),
    adapterId: readInlineWord('adapter', text) ?? readInlineWord('adapterId', text),
    hostId: readInlineWord('host', text) ?? readInlineWord('hostId', text),
    runtime: readInlineWord('runtime', text),
    target: readInlineWord('target', text)
  });
  if (kind === 'route') return cleanRecord({
    ...base,
    path: readInlineQuoted('path', text) ?? readInlineWord('path', text) ?? recordName,
    method: readInlineWord('method', text),
    viewId: readInlineWord('view', text) ?? readInlineWord('viewId', text),
    actionId: readInlineWord('action', text) ?? readInlineWord('actionId', text),
    mountId: readInlineWord('mount', text) ?? readInlineWord('mountId', text),
    paramIds: readInlineList(text, 'param', 'params', 'paramIds')
  });
  if (kind === 'event') return cleanRecord({
    ...base,
    eventKind: readInlineWord('kind', text) ?? readInlineWord('eventKind', text),
    eventName: readInlineWord('event', text) ?? readInlineWord('eventName', text) ?? recordName,
    actionId: readInlineWord('action', text) ?? readInlineWord('actionId', text),
    input: readInlineWord('input', text),
    sourceId: readInlineWord('source', text) ?? readInlineWord('sourceId', text),
    targetId: readInlineWord('target', text) ?? readInlineWord('targetId', text)
  });
  if (kind === 'asset') return cleanRecord({
    ...base,
    assetKind: readInlineWord('kind', text) ?? readInlineWord('assetKind', text),
    path: readInlineQuoted('path', text) ?? readInlineWord('path', text),
    assetHash: readInlineWord('hash', text) ?? readInlineWord('assetHash', text),
    integrity: readInlineWord('integrity', text),
    runtime: readInlineWord('runtime', text),
    mountId: readInlineWord('mount', text) ?? readInlineWord('mountId', text)
  });
  if (kind === 'gate') return cleanRecord({
    ...base,
    gateKind: readInlineWord('kind', text) ?? readInlineWord('gateKind', text) ?? 'test',
    command: readInlineQuoted('command', text) ?? readInlineWord('command', text),
    required: readInlineFlag('required', text) ?? undefined,
    status: readInlineWord('status', text),
    subjectIds: readInlineList(text, 'subject', 'subjects', 'subjectIds'),
    runtime: readInlineWord('runtime', text)
  });
  return cleanRecord(base);
}

function applicationProofGap(name, text) {
  const code = readInlineWord('code', text) ?? name;
  return cleanRecord({
    id: idFrom(text, `application_gap_${safeId(code)}`),
    code,
    status: readInlineWord('status', text) ?? 'not-claimed',
    summary: readInlineQuoted('summary', text) ?? readInlineQuoted('message', text),
    failClosed: true,
    ...applicationFalseClaims(),
    sourceSpan: parseSpan(readInlineWord('sourceSpan', text))
  });
}

function parseEvidenceRows(body) {
  const records = [];
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    const match = /^(?:evidence|proofEvidence)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    records.push(cleanRecord({
      id: idFrom(match[2], `evidence_${match[1]}`),
      kind: readInlineWord('kind', match[2]) ?? 'note',
      status: readInlineWord('status', match[2]) ?? 'unknown',
      path: readInlineWord('path', match[2]),
      summary: readInlineQuoted('summary', match[2]),
      metadata: { name: match[1] }
    }));
  }
  return records;
}

function summarizeApplicationSurface(tree) {
  return {
    recordCount: tree.records.length,
    mountCount: count(tree.records, 'mount'),
    providedSurfaceCount: count(tree.records, 'provided-surface'),
    requiredCapabilityCount: count(tree.records, 'required-capability'),
    routeCount: count(tree.records, 'route'),
    eventCount: count(tree.records, 'event'),
    assetCount: count(tree.records, 'asset'),
    gateCount: count(tree.records, 'gate'),
    evidenceCount: tree.evidence.length,
    proofGapCount: tree.proofGaps.length,
    parseErrors: tree.parser.errors.length
  };
}

function applicationFalseClaims() {
  return {
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    abiCompatibilityClaim: false,
    projectionEquivalenceClaim: false,
    pluginCompatibilityClaim: false,
    sandboxSafetyClaim: false
  };
}

function hashableRecord(record) {
  return {
    recordKind: record.recordKind,
    name: record.name,
    identityKey: record.identityKey,
    capability: record.capability,
    path: record.path,
    viewId: record.viewId,
    actionId: record.actionId,
    proofGaps: record.proofGaps?.map((gap) => gap.code)
  };
}

function normalizeRowKind(kind) {
  if (kind === 'provide' || kind === 'provides') return 'provided-surface';
  if (kind === 'require' || kind === 'requires' || kind === 'required') return 'required-capability';
  return kind;
}

function surfaceKindFrom(kind) {
  if (kind === 'appHost') return 'host';
  if (kind === 'plugin' || kind === 'pluginSurface' || kind === 'pluginContract') return 'plugin';
  return 'application';
}

function defaultRole(surfaceKind) {
  if (surfaceKind === 'host') return 'host';
  if (surfaceKind === 'plugin') return 'plugin';
  return 'application';
}

function count(records, kind) { return records.filter((record) => record.recordKind === kind).length; }
function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function idsByRecordKind(records = [], kind) { return ids(records.filter((record) => record?.recordKind === kind)); }
function isPropertyLine(line) { return /^(role|host|hostId|sourcePath|path|sourceHash|evidence|proofEvidence)\s+/.test(line); }
function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$-]*)/.exec(header)?.[1] ?? 'ApplicationSurface'; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineFlag(label, text) { return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(text) || undefined; }
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function parseSpan(value) {
  if (!value) return undefined;
  const match = /^(.+?):(\d+):(\d+)-(\d+):(\d+)$/.exec(value);
  if (!match) return { path: value };
  return { path: match[1], startLine: Number(match[2]), startColumn: Number(match[3]), endLine: Number(match[4]), endColumn: Number(match[5]) };
}
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0) && (!value || typeof value !== 'object' || Object.keys(value).length > 0)));
}
function safeId(value) {
  return String(value ?? 'unknown').replace(/[^A-Za-z0-9_$-]+/g, '_');
}
