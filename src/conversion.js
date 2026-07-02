import { FAMILIES, parseConstraintRecord } from './conversion-constraint-record.js';

export function parseConversionBlock(block) {
  const name = nameFrom(block.header);
  const plan = { id: idFrom(block.header, `conversion_${name}`), targets: [], metadata: { name } };
  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const target = /^target\s+([^\s,]+)/.exec(line)?.[1];
    const sourceLanguage = /^sourceLanguage\s+([^\s,]+)/.exec(line)?.[1] ?? /^source\s+([^\s,]+)/.exec(line)?.[1];
    const sourceRuntime = /^sourceRuntime\s+([^\s,]+)\s+([^\s,]+)/.exec(line);
    const targetRuntime = /^targetRuntime\s+([^\s,]+)\s+([^\s,]+)/.exec(line);
    const runtimeRequirement = /^(?:runtimeRequirement|requiredRuntime|requiresRuntime)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    const dialect = /^dialect\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    const extern = /^extern\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    const constraint = /^constraint\s+([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (target) plan.targets.push(target);
    else if (sourceLanguage) plan.sourceLanguage = sourceLanguage;
    else if (sourceRuntime) plan.sourceRuntimes = { ...(plan.sourceRuntimes ?? {}), [sourceRuntime[1]]: sourceRuntime[2] };
    else if (targetRuntime) plan.targetRuntimes = { ...(plan.targetRuntimes ?? {}), [targetRuntime[1]]: targetRuntime[2] };
    else if (runtimeRequirement) addRuntimeRequirement(plan, runtimeRequirement[1], runtimeRequirement[2]);
    else if (dialect) addDialectRecord(plan, dialect[1], dialect[2], false);
    else if (extern) addDialectRecord(plan, extern[1], extern[2], true);
    else if (constraint) addConstraint(plan, constraint[1], constraint[2], constraint[3]);
  }
  return cleanRecord({ ...plan, targets: unique(plan.targets) });
}

function addRuntimeRequirement(plan, name, text) {
  plan.runtimeRequirements = [...(plan.runtimeRequirements ?? []), cleanRecord({
    id: idFrom(text, `runtime_requirement_${name}`),
    name,
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? plan.sourceLanguage,
    target: readInlineWord('target', text) ?? readInlineWord('targetLanguage', text) ?? plan.targets[0],
    capability: readInlineWord('capability', text) ?? readInlineWord('kind', text) ?? name,
    kind: readInlineWord('kind', text),
    sourceRuntime: readInlineWord('sourceRuntime', text) ?? readInlineWord('runtime', text),
    targetRuntime: readInlineWord('targetRuntime', text),
    sourceHost: readInlineWord('sourceHost', text),
    targetHost: readInlineWord('targetHost', text),
    reason: readInlineQuoted('reason', text) ?? readInlineWord('reason', text),
    requiredSignals: readInlineList(text, 'requiredSignal', 'requiredSignals', 'signal', 'signals'),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds')
  })];
}

function addDialectRecord(plan, name, text, isExtern) {
  const projection = cleanRecord({
    disposition: readInlineWord('disposition', text),
    readiness: readInlineWord('readiness', text),
    targets: readInlineList(text, 'target', 'targets', 'targetLanguage') ?? plan.targets,
    evidenceIds: readInlineList(text, 'projectionEvidence', 'projectionEvidenceIds', 'evidence', 'evidenceIds'),
    lossIds: readInlineList(text, 'projectionLoss', 'projectionLossIds', 'loss', 'lossId', 'lossIds')
  });
  const record = cleanRecord({
    id: idFrom(text, `${isExtern ? 'extern' : 'dialect'}_${name}`),
    language: readInlineWord('language', text) ?? plan.sourceLanguage,
    dialect: readInlineWord('dialect', text) ?? name,
    name: readInlineWord('name', text) ?? name,
    nativeKind: readInlineWord('nativeKind', text),
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text),
    nativeSourceId: readInlineWord('nativeSource', text) ?? readInlineWord('nativeSourceId', text),
    nativeAstId: readInlineWord('nativeAst', text) ?? readInlineWord('nativeAstId', text),
    nativeAstNodeId: readInlineWord('nativeAstNode', text) ?? readInlineWord('nativeAstNodeId', text),
    semanticNodeId: readInlineWord('semanticNode', text) ?? readInlineWord('semanticNodeId', text),
    semanticSymbolId: readInlineWord('symbol', text) ?? readInlineWord('semanticSymbolId', text),
    sourceMapId: readInlineWord('sourceMap', text) ?? readInlineWord('sourceMapId', text),
    sourceMapMappingId: readInlineWord('sourceMapMapping', text) ?? readInlineWord('sourceMapMappingId', text),
    lossIds: readInlineList(text, 'loss', 'lossId', 'lossIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    projection
  });
  if (isExtern) {
    const binding = cleanRecord({ module: readInlineWord('module', text), path: readInlineWord('bindingPath', text), symbol: readInlineWord('bindingSymbol', text) ?? readInlineWord('symbol', text), abi: readInlineWord('abi', text), version: readInlineWord('version', text) });
    plan.externs = [...(plan.externs ?? []), cleanRecord({ ...record, externKind: readInlineWord('externKind', text) ?? readInlineWord('kind', text) ?? 'extern', ...(Object.keys(binding).length ? { binding } : {}) })];
  } else {
    plan.dialects = [...(plan.dialects ?? []), cleanRecord({ ...record, constructKind: readInlineWord('constructKind', text) ?? readInlineWord('kind', text) ?? 'runtime', externIds: readInlineList(text, 'extern', 'externIds') })];
  }
}

function addConstraint(plan, family, name, text) {
  const config = FAMILIES[family] ?? { field: family.endsWith('s') ? family : `${family}Constraints`, sourceKey: 'sourceRecords', targetKey: 'targetRecords' };
  const role = readInlineWord('role', text) ?? 'source';
  const record = parseConstraintRecord(name, text, role);
  const entry = cleanRecord({
    id: idFrom(text, `${config.field}_${name}`),
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? plan.sourceLanguage,
    target: readInlineWord('targetLanguage', text) ?? plan.targets[0],
    mode: readInlineWord('mode', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    missingEvidence: readInlineList(text, 'missingEvidence'),
    blockers: readInlineList(text, 'blocker', 'blockers'),
    review: readInlineList(text, 'review'),
    metadata: { name, family, authoredConversionBlockId: plan.id }
  });
  const recordKey = role === 'target' ? config.targetKey : config.sourceKey;
  const recordValue = config.graph ? resourceGraphFromRecord(record, entry) : record;
  for (const key of unique([recordKey, ...(role === 'target' ? config.extraTargetKeys ?? [] : config.extraSourceKeys ?? [])])) {
    entry[key] = [recordValue];
  }
  plan[config.field] = [...(plan[config.field] ?? []), entry];
}

function resourceGraphFromRecord(record, entry) {
  const tokens = lowerTokens(record);
  const resourceId = record.resourceId ?? record.symbolId ?? `${record.id}_resource`;
  const evidenceIds = record.evidenceIds ?? entry.evidenceIds;
  return cleanRecord({
    id: `${record.id}_resource_graph`,
    sourceLanguage: entry.sourceLanguage,
    target: entry.target,
    sourcePath: record.sourcePath,
    sourceHash: record.sourceHash,
    evidenceIds,
    resources: [{
      id: resourceId,
      resourceKind: record.resourceKind ?? record.kind ?? record.constraintKind,
      sourcePath: record.sourcePath,
      sourceHash: record.sourceHash,
      evidenceIds,
      metadata: { factKinds: record.factKinds, constraintKinds: record.constraintKinds }
    }],
    owners: needsOwner(tokens, record) ? [{
      id: `${record.id}_owner`,
      resourceId,
      ownerId: record.ownerId ?? record.symbolId ?? `${resourceId}:owner`,
      ownerKind: record.ownerKind ?? tokenKind(tokens, /owner|single-owner/) ?? 'owner',
      evidenceIds
    }] : undefined,
    loans: needsLoan(tokens, record) ? [{
      id: `${record.id}_loan`,
      resourceId,
      mode: record.mode ?? loanMode(tokens),
      lifetimeRegionId: record.lifetimeRegionId,
      evidenceIds
    }] : undefined,
    aliases: tokenMatches(tokens, /alias/) ? [{
      id: `${record.id}_alias`,
      resourceId,
      aliasKind: record.aliasKind ?? tokenKind(tokens, /alias/) ?? 'alias',
      evidenceIds
    }] : undefined,
    moves: tokenMatches(tokens, /move|transfer/) ? [{
      id: `${record.id}_move`,
      resourceId,
      moveKind: record.moveKind ?? tokenKind(tokens, /move|transfer/) ?? 'move',
      evidenceIds
    }] : undefined,
    drops: tokenMatches(tokens, /drop/) ? [{
      id: `${record.id}_drop`,
      resourceId,
      dropKind: record.dropKind ?? tokenKind(tokens, /drop/) ?? 'drop',
      evidenceIds
    }] : undefined,
    lifetimeRegions: record.lifetimeKind || record.lifetimeRegionId || tokenMatches(tokens, /lifetime/) ? [{
      id: record.lifetimeRegionId ?? `${record.id}_lifetime`,
      resourceId,
      lifetimeKind: record.lifetimeKind ?? tokenKind(tokens, /lifetime/) ?? record.regionKind,
      evidenceIds
    }] : undefined,
    borrowScopes: needsLoan(tokens, record) || record.scopeKind ? [{
      id: `${record.id}_borrow_scope`,
      resourceId,
      scopeKind: record.scopeKind ?? record.kind,
      lifetimeRegionId: record.lifetimeRegionId,
      constraintKinds: record.constraintKinds,
      evidenceIds
    }] : undefined,
    unsafeBoundaries: tokenMatches(tokens, /unsafe|raw/) ? [{
      id: `${record.id}_unsafe`,
      resourceId,
      kind: tokenKind(tokens, /unsafe|raw/) ?? 'unsafe-boundary',
      evidenceIds
    }] : undefined
  });
}

function lowerTokens(record) {
  return unique([record.kind, record.constraintKind, record.scopeKind, record.resourceKind, record.ownerKind, record.mode, record.aliasKind, record.moveKind, record.dropKind, record.lifetimeKind, record.regionKind, record.flowKind, record.controlFlowKind, ...(record.constraintKinds ?? []), ...(record.factKinds ?? [])].filter(Boolean).map((value) => String(value).toLowerCase()));
}
function needsOwner(tokens, record) { return record.ownerId || record.ownerKind || tokenMatches(tokens, /owner|single-owner/); }
function needsLoan(tokens, record) { return record.mode || tokenMatches(tokens, /borrow|loan|raw/); }
function loanMode(tokens) {
  if (tokens.includes('shared-borrow') || tokens.includes('shared')) return 'shared';
  if (tokens.includes('exclusive-borrow') || tokens.includes('mutable') || tokens.includes('exclusive')) return 'exclusive';
  if (tokens.includes('raw-access-boundary') || tokens.includes('raw')) return 'raw';
  if (tokens.includes('move')) return 'move';
  return 'unknown';
}
function tokenMatches(tokens, pattern) { return tokens.some((token) => pattern.test(token)); }
function tokenKind(tokens, pattern) { return tokens.find((token) => pattern.test(token)); }
function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Conversion'; }
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
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }
