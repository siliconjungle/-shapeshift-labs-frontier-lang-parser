import { FAMILIES, parseConstraintRecord } from './conversion-constraint-record.js';

export function parseConversionBlock(block) {
  const name = nameFrom(block.header);
  const plan = { id: idFrom(block.header, `conversion_${name}`), targets: [], metadata: { name } };
  for (const authoredLine of readAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#')) continue;
    const target = /^target\s+([^\s,]+)/.exec(line)?.[1];
    const sourceLanguage = /^sourceLanguage\s+([^\s,]+)/.exec(line)?.[1] ?? /^source\s+([^\s,]+)/.exec(line)?.[1];
    const sourceRuntime = /^sourceRuntime\s+([^\s,]+)\s+([^\s,]+)/.exec(line);
    const targetRuntime = /^targetRuntime\s+([^\s,]+)\s+([^\s,]+)/.exec(line);
    const runtimeRequirement = /^(?:runtimeRequirement|requiredRuntime|requiresRuntime)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    const dialect = /^dialect\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    const extern = /^extern\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    const evidence = /^(?:evidence|proofEvidence)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    const constraint = /^constraint\s+([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (target) plan.targets.push(target);
    else if (sourceLanguage) plan.sourceLanguage = sourceLanguage;
    else if (sourceRuntime) plan.sourceRuntimes = { ...(plan.sourceRuntimes ?? {}), [sourceRuntime[1]]: sourceRuntime[2] };
    else if (targetRuntime) plan.targetRuntimes = { ...(plan.targetRuntimes ?? {}), [targetRuntime[1]]: targetRuntime[2] };
    else if (runtimeRequirement) addRuntimeRequirement(plan, runtimeRequirement[1], runtimeRequirement[2]);
    else if (dialect) addDialectRecord(plan, dialect[1], dialect[2], false);
    else if (extern) addDialectRecord(plan, extern[1], extern[2], true);
    else if (evidence) addEvidenceRecord(plan, evidence[1], evidence[2], authoredLine);
    else if (constraint) addConstraint(plan, constraint[1], constraint[2], constraint[3], authoredLine);
  }
  return cleanRecord({ ...plan, targets: unique(plan.targets) });
}

function addEvidenceRecord(plan, name, text, authoredLine = {}) {
  plan.evidence = [...(plan.evidence ?? []), cleanRecord({
    id: idFrom(text, `conversion_evidence_${name}`),
    name,
    kind: readInlineWord('kind', text) ?? 'conversion-route-evidence',
    status: readInlineWord('status', text) ?? 'unknown',
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? readInlineWord('language', text) ?? plan.sourceLanguage,
    target: readInlineWord('target', text) ?? readInlineWord('targetLanguage', text) ?? plan.targets[0],
    routeId: readInlineWord('routeId', text) ?? readInlineWord('route', text),
    path: readInlineWord('path', text) ?? readInlineWord('report', text),
    command: readInlineQuoted('command', text) ?? readInlineWord('command', text),
    probeId: readInlineWord('probeId', text) ?? readInlineWord('probe', text),
    sourceHash: readInlineWord('sourceHash', text),
    targetHash: readInlineWord('targetHash', text),
    telemetryHash: readInlineWord('telemetryHash', text),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceId', 'proofEvidenceIds', 'proof'),
    summary: readInlineQuoted('summary', text),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: { authoredConversionBlockId: plan.id, autoMergeClaim: false, semanticEquivalenceClaim: false }
  })];
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

function addConstraint(plan, family, name, text, authoredLine = {}) {
  const config = FAMILIES[family] ?? { field: family.endsWith('s') ? family : `${family}Constraints`, sourceKey: 'sourceRecords', targetKey: 'targetRecords' };
  const role = readInlineWord('role', text) ?? 'source';
  const explicitSourceSpan = parseSpan(readInlineWord('sourceSpan', text), readInlineWord('sourcePath', text) ?? readInlineWord('path', text));
  const sourceSpan = explicitSourceSpan ?? authoredLine.sourceSpan;
  const record = parseConstraintRecord(name, text, role, { sourceSpan, authoredSourceSpan: authoredLine.sourceSpan });
  const entry = cleanRecord({
    id: idFrom(text, `${config.field}_${name}`),
    sourceLanguage: readInlineWord('sourceLanguage', text) ?? plan.sourceLanguage,
    target: readInlineWord('targetLanguage', text) ?? plan.targets[0],
    mode: readInlineWord('mode', text),
    sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    sourceMapIds: readInlineList(text, 'sourceMap', 'sourceMaps', 'sourceMapId', 'sourceMapIds'),
    sourceMapMappingIds: readInlineList(text, 'sourceMapMapping', 'sourceMapMappings', 'sourceMapMappingId', 'sourceMapMappingIds'),
    proofObligationIds: readInlineList(text, 'proofObligation', 'proofObligations', 'proofObligationId', 'proofObligationIds', 'obligation', 'obligations'),
    proofEvidenceIds: readInlineList(text, 'proofEvidence', 'proofEvidenceId', 'proofEvidenceIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    missingEvidence: readInlineList(text, 'missingEvidence'),
    blockers: readInlineList(text, 'blocker', 'blockers'),
    review: readInlineList(text, 'review'),
    failClosed: readInlineFlag('failClosed', text),
    metadata: cleanRecord({ name, family: config.family ?? family, authoredFamily: config.family && config.family !== family ? family : undefined, authoredConversionBlockId: plan.id })
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
  const sourceSpan = record.sourceSpan ?? entry.sourceSpan;
  const authoredSourceSpan = record.authoredSourceSpan ?? entry.authoredSourceSpan;
  return cleanRecord({
    id: `${record.id}_resource_graph`,
    sourceLanguage: entry.sourceLanguage,
    target: entry.target,
    sourcePath: record.sourcePath,
    sourceHash: record.sourceHash,
    sourceSpan,
    authoredSourceSpan,
    evidenceIds,
    sourceMapIds: record.sourceMapIds ?? entry.sourceMapIds,
    sourceMapMappingIds: record.sourceMapMappingIds ?? entry.sourceMapMappingIds,
    proofObligationIds: record.proofObligationIds ?? entry.proofObligationIds,
    proofEvidenceIds: record.proofEvidenceIds ?? entry.proofEvidenceIds,
    missingEvidence: record.missingEvidence ?? entry.missingEvidence,
    failClosed: record.failClosed ?? entry.failClosed,
    resources: [{
      id: resourceId,
      resourceKind: record.resourceKind ?? record.kind ?? record.constraintKind,
      sourcePath: record.sourcePath,
      sourceHash: record.sourceHash,
      sourceSpan,
      authoredSourceSpan,
      evidenceIds,
      metadata: { factKinds: record.factKinds, constraintKinds: record.constraintKinds }
    }],
    owners: needsOwner(tokens, record) ? [{
      id: `${record.id}_owner`,
      resourceId,
      ownerId: record.ownerId ?? record.symbolId ?? `${resourceId}:owner`,
      ownerKind: record.ownerKind ?? tokenKind(tokens, /owner|single-owner/) ?? 'owner',
      sourceSpan,
      authoredSourceSpan,
      evidenceIds
    }] : undefined,
    loans: needsLoan(tokens, record) ? [{
      id: `${record.id}_loan`,
      resourceId,
      mode: record.mode ?? loanMode(tokens),
      lifetimeRegionId: record.lifetimeRegionId,
      sourceSpan,
      authoredSourceSpan,
      evidenceIds
    }] : undefined,
    aliases: tokenMatches(tokens, /alias/) ? [{
      id: `${record.id}_alias`,
      resourceId,
      aliasKind: record.aliasKind ?? tokenKind(tokens, /alias/) ?? 'alias',
      sourceSpan,
      authoredSourceSpan,
      evidenceIds
    }] : undefined,
    moves: tokenMatches(tokens, /move|transfer/) ? [{
      id: `${record.id}_move`,
      resourceId,
      moveKind: record.moveKind ?? tokenKind(tokens, /move|transfer/) ?? 'move',
      sourceSpan,
      authoredSourceSpan,
      evidenceIds
    }] : undefined,
    drops: tokenMatches(tokens, /drop/) ? [{
      id: `${record.id}_drop`,
      resourceId,
      dropKind: record.dropKind ?? tokenKind(tokens, /drop/) ?? 'drop',
      sourceSpan,
      authoredSourceSpan,
      evidenceIds
    }] : undefined,
    lifetimeRegions: record.lifetimeKind || record.lifetimeRegionId || tokenMatches(tokens, /lifetime/) ? [{
      id: record.lifetimeRegionId ?? `${record.id}_lifetime`,
      resourceId,
      lifetimeKind: record.lifetimeKind ?? tokenKind(tokens, /lifetime/) ?? record.regionKind,
      sourceSpan,
      authoredSourceSpan,
      evidenceIds
    }] : undefined,
    borrowScopes: needsLoan(tokens, record) || record.scopeKind ? [{
      id: `${record.id}_borrow_scope`,
      resourceId,
      scopeKind: record.scopeKind ?? record.kind,
      lifetimeRegionId: record.lifetimeRegionId,
      constraintKinds: record.constraintKinds,
      sourceSpan,
      authoredSourceSpan,
      evidenceIds
    }] : undefined,
    unsafeBoundaries: tokenMatches(tokens, /unsafe|raw/) ? [{
      id: `${record.id}_unsafe`,
      resourceId,
      kind: tokenKind(tokens, /unsafe|raw/) ?? 'unsafe-boundary',
      sourceSpan,
      authoredSourceSpan,
      evidenceIds
    }] : undefined
  });
}

function readAuthoredLines(block) {
  const lines = block.body.split('\n');
  const records = [];
  let lineStart = block.syntax?.bodyStartOffset ?? 0;
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
      sourceSpan: typeof block.sourceSpan === 'function' ? block.sourceSpan(startOffset, endOffset) : undefined
    });
    lineStart = rawEnd + 1;
  }
  return records;
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
function parseSpan(value, fallbackPath) {
  if (!value) return undefined;
  const match = /^(.+):(\d+):(\d+)-(\d+):(\d+)$/.exec(value);
  if (!match) return undefined;
  return cleanRecord({
    path: match[1] || fallbackPath,
    startLine: Number(match[2]),
    startColumn: Number(match[3]),
    endLine: Number(match[4]),
    endColumn: Number(match[5])
  });
}
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }
