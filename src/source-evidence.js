import { createSemanticMergeCandidateRecord, createSourceMapRecord, nativeSourceNode } from '@shapeshift-labs/frontier-lang-kernel';

export function parseNativeSourceBlock(block) {
  const name = nameFrom(block.header);
  const losses = parseLosses(name, block.body);
  const nativeSourceId = idFrom(block.header, `native_${name}`);
  const evidence = parseEvidenceRecords(block.body);
  const sourceMaps = parseSourceMaps(block.body, {
    nativeSourceId,
    sourcePath: readWord('sourcePath', block.body) ?? readWord('path', block.body),
    sourceHash: readWord('sourceHash', block.body),
    evidence
  });
  const mergeCandidates = parseMergeCandidates(block.body, {
    nativeSourceId,
    language: readWord('language', block.body) ?? name,
    sourcePath: readWord('sourcePath', block.body) ?? readWord('path', block.body),
    sourceMaps,
    evidence
  });
  const node = nativeSourceNode({
    id: nativeSourceId,
    name,
    language: readWord('language', block.body) ?? name,
    parser: readWord('parser', block.body),
    parserVersion: readWord('parserVersion', block.body),
    sourcePath: readWord('sourcePath', block.body) ?? readWord('path', block.body),
    sourceHash: readWord('sourceHash', block.body),
    symbol: readWord('symbol', block.body),
    frontierNodeIds: readList('frontierNodes', block.body),
    sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id),
    mergeCandidateIds: mergeCandidates.map((candidate) => candidate.id),
    evidenceIds: evidence.map((record) => record.id),
    losses: losses.length ? losses : undefined
  });
  return {
    node,
    sourceMaps,
    mergeCandidates,
    evidence,
    losses
  };
}

function parseLosses(name, body) {
  const losses = [];
  const lossRe = /^\s*loss\s+([A-Za-z][\w-]*)\s+["']([^"']+)["'](?:\s+severity\s+([A-Za-z][\w-]*))?/gm;
  let match;
  while ((match = lossRe.exec(body))) {
    losses.push({
      id: `loss_${name}_${losses.length}`,
      kind: match[1],
      message: match[2],
      severity: match[3] ?? 'warning'
    });
  }
  return losses;
}

function parseEvidenceRecords(body) {
  const records = [];
  for (const { name, rest } of matchingRows(body, /^(?:evidence|proofEvidence)\s+([A-Za-z_$][\w$-]*)(.*)$/)) {
    records.push(cleanRecord({
      id: idFrom(rest, `evidence_${name}`),
      kind: readInlineWord('kind', rest) ?? 'note',
      status: readInlineWord('status', rest) ?? 'unknown',
      path: readInlineWord('path', rest),
      summary: readInlineQuoted('summary', rest),
      metadata: { name }
    }));
  }
  return records;
}

function parseSourceMaps(body, context) {
  const rows = matchingRows(body, /^(?:sourceMap|sourcemap)\s+([A-Za-z_$][\w$-]*)(.*)$/);
  const evidenceById = new Map(context.evidence.map((record) => [record.id, record]));
  const mappingRows = matchingRows(body, /^(?:mapping|sourceMapMapping)\s+([A-Za-z_$][\w$-]*)(.*)$/);
  const defaultSourceMapId = rows.length === 1 ? idFrom(rows[0].rest, `sourcemap_${rows[0].name}`) : undefined;
  return rows.map(({ name, rest }) => {
    const id = idFrom(rest, `sourcemap_${name}`);
    const evidenceIds = readInlineList(rest, 'evidence', 'evidenceIds');
    const mappings = mappingRows
      .filter((row) => (readInlineWord('sourceMap', row.rest) ?? readInlineWord('sourceMapId', row.rest) ?? defaultSourceMapId) === id)
      .map((row) => parseSourceMapMapping(row.name, row.rest, {
        sourceMapId: id,
        nativeSourceId: context.nativeSourceId,
        sourcePath: readInlineWord('sourcePath', rest) ?? readInlineWord('path', rest) ?? context.sourcePath
      }));
    return createSourceMapRecord(cleanRecord({
      id,
      sourcePath: readInlineWord('sourcePath', rest) ?? readInlineWord('path', rest) ?? context.sourcePath,
      sourceHash: readInlineWord('sourceHash', rest) ?? context.sourceHash,
      target: readInlineWord('target', rest),
      targetPath: readInlineWord('targetPath', rest),
      targetHash: readInlineWord('targetHash', rest),
      semanticIndexId: readInlineWord('semanticIndex', rest) ?? readInlineWord('semanticIndexId', rest),
      universalAstId: readInlineWord('universalAst', rest) ?? readInlineWord('universalAstId', rest),
      nativeAstId: readInlineWord('nativeAst', rest) ?? readInlineWord('nativeAstId', rest),
      nativeSourceId: readInlineWord('nativeSource', rest) ?? readInlineWord('nativeSourceId', rest) ?? context.nativeSourceId,
      mappings,
      evidence: evidenceIds?.map((evidenceId) => evidenceById.get(evidenceId) ?? { id: evidenceId, kind: 'note', status: 'unknown' })
    }));
  });
}

function parseSourceMapMapping(name, text, context) {
  return cleanRecord({
    id: idFrom(text, `mapping_${name}`),
    semanticNodeId: readInlineWord('semanticNode', text) ?? readInlineWord('semanticNodeId', text),
    nativeSourceId: readInlineWord('nativeSource', text) ?? readInlineWord('nativeSourceId', text) ?? context.nativeSourceId,
    nativeAstNodeId: readInlineWord('nativeAstNode', text) ?? readInlineWord('nativeAstNodeId', text),
    semanticSymbolId: readInlineWord('semanticSymbol', text) ?? readInlineWord('symbol', text) ?? readInlineWord('semanticSymbolId', text),
    semanticOccurrenceId: readInlineWord('semanticOccurrence', text) ?? readInlineWord('semanticOccurrenceId', text),
    mergeCandidateId: readInlineWord('mergeCandidate', text) ?? readInlineWord('mergeCandidateId', text),
    sourceSpan: parseSpan(readInlineWord('sourceSpan', text), context.sourcePath),
    generatedSpan: parseSpan(readInlineWord('generatedSpan', text), readInlineWord('targetPath', text)),
    target: readInlineWord('target', text),
    generatedName: readInlineWord('generatedName', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    lossIds: readInlineList(text, 'loss', 'lossIds'),
    precision: readInlineWord('precision', text) ?? 'unknown',
    preservation: readInlineWord('preservation', text),
    metadata: cleanRecord({
      sourceMapId: context.sourceMapId,
      ownershipRegionId: readInlineWord('ownershipRegion', text) ?? readInlineWord('ownershipRegionId', text),
      ownershipRegionKey: readInlineWord('ownershipKey', text) ?? readInlineWord('ownershipRegionKey', text)
    })
  });
}

function parseMergeCandidates(body, context) {
  const sourceMapIds = context.sourceMaps.map((sourceMap) => sourceMap.id);
  return matchingRows(body, /^(?:mergeCandidate|candidate)\s+([A-Za-z_$][\w$-]*)(.*)$/).map(({ name, rest }) => {
    const conflictKeys = readInlineList(rest, 'conflictKey', 'conflictKeys', 'ownershipKey', 'ownershipKeys');
    const symbols = readInlineList(rest, 'semanticSymbol', 'semanticSymbols', 'symbol', 'symbols', 'semanticSymbolIds');
    const nodes = readInlineList(rest, 'semanticNode', 'semanticNodes', 'semanticNodeIds');
    const evidenceIds = readInlineList(rest, 'evidence', 'evidenceIds');
    const sourceMapMappingIds = readInlineList(rest, 'sourceMapMapping', 'sourceMapMappings', 'sourceMapMappingIds');
    return createSemanticMergeCandidateRecord(cleanRecord({
      id: idFrom(rest, `merge_candidate_${name}`),
      language: readInlineWord('language', rest) ?? context.language,
      sourcePath: readInlineWord('sourcePath', rest) ?? readInlineWord('path', rest) ?? context.sourcePath,
      baseHash: readInlineWord('baseHash', rest),
      targetHash: readInlineWord('targetHash', rest),
      touchedSymbols: symbols?.map((symbol) => ({ id: symbol, conflictKey: conflictKeys?.[0] ?? symbol })),
      touchedSemanticNodes: nodes?.map((node) => ({ id: node, conflictKey: conflictKeys?.[0] ?? node })),
      nativeSpans: parseCandidateNativeSpans(rest, context),
      conflictKeys,
      readiness: readInlineWord('readiness', rest),
      reasons: uniqueList([readInlineQuoted('reason', rest), ...(readInlineList(rest, 'reasonCode', 'reasonCodes', 'reasons') ?? [])]),
      evidence: evidenceIds?.map((evidenceId) => context.evidence.find((record) => record.id === evidenceId) ?? { id: evidenceId, kind: 'note', status: 'unknown' }),
      metadata: cleanRecord({
        name,
        nativeSourceId: readInlineWord('nativeSource', rest) ?? readInlineWord('nativeSourceId', rest) ?? context.nativeSourceId,
        sourceMapIds: readInlineList(rest, 'sourceMap', 'sourceMaps', 'sourceMapIds') ?? sourceMapIds,
        sourceMapMappingIds,
        ownershipKeys: readInlineList(rest, 'ownershipKey', 'ownershipKeys')
      })
    }));
  });
}

function parseCandidateNativeSpans(text, context) {
  const span = parseSpan(readInlineWord('sourceSpan', text), context.sourcePath);
  const nativeAstNodeId = readInlineWord('nativeAstNode', text) ?? readInlineWord('nativeAstNodeId', text);
  if (!span && !nativeAstNodeId) return undefined;
  const conflictKey = readInlineList(text, 'conflictKey', 'conflictKeys')?.[0]
    ?? readInlineWord('semanticSymbol', text)
    ?? readInlineWord('symbol', text)
    ?? nativeAstNodeId
    ?? 'native-span';
  return [cleanRecord({
    id: readInlineWord('nativeSpan', text) ?? `native_span_${hashableId(conflictKey)}`,
    path: span?.path ?? context.sourcePath,
    language: readInlineWord('language', text) ?? context.language,
    nativeAstNodeId,
    semanticNodeId: readInlineWord('semanticNode', text) ?? readInlineWord('semanticNodeId', text),
    symbolId: readInlineWord('semanticSymbol', text) ?? readInlineWord('symbol', text),
    span,
    conflictKey
  })];
}

function parseSpan(value, fallbackPath) {
  if (!value) return undefined;
  const match = /^(.+?):(\d+):(\d+)-(\d+):(\d+)$/.exec(value);
  if (!match) return { path: value };
  return {
    path: match[1] || fallbackPath,
    startLine: Number(match[2]),
    startColumn: Number(match[3]),
    endLine: Number(match[4]),
    endColumn: Number(match[5])
  };
}

function matchingRows(body, pattern) {
  const rows = [];
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = pattern.exec(line);
    if (match) rows.push({ name: match[1], rest: match[2] ?? '' });
  }
  return rows;
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Unnamed'; }
function readWord(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\s]+)', 'm').exec(body)?.[1]?.trim(); }
function readList(label, body) { const line = new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]; return line ? line.split(',').map((item) => item.trim()).filter(Boolean) : undefined; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0) && (!value || typeof value !== 'object' || Object.keys(value).length > 0)));
}
function uniqueList(values) {
  return [...new Set(values.filter(Boolean))];
}
function hashableId(value) {
  return String(value ?? 'unknown').replace(/[^A-Za-z0-9_$-]+/g, '_');
}
