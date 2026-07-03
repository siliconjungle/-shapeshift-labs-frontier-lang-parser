import { ROW_SYNTAX_CONFIG } from './source-syntax-row-config.js';

const ROW_NAME_PATTERN = '([A-Za-z_$@./:*+-][\\w$./@:*+-]*)';

export function readSourceSyntaxChildren(source, block, options = {}) {
  if (block.malformed) return [];
  if (block.kind === 'conversion' || block.kind === 'universalConversionPlan') {
    return readConversionSyntaxChildren(source, block, options);
  }
  const rowConfig = ROW_SYNTAX_CONFIG[block.kind];
  if (rowConfig) return readGenericRowSyntaxChildren(source, block, options, rowConfig);
  return [];
}

function readConversionSyntaxChildren(source, block, options) {
  const children = [];
  for (const line of readBodyLines(source, block)) {
    if (!line.text || line.text.startsWith('#')) continue;
    const planField = /^(?:sourceLanguage|source|target|sourceRuntime|targetRuntime)\s+/.exec(line.text);
    if (planField) continue;
    const runtimeRequirement = /^(runtimeRequirement|requiredRuntime|requiresRuntime)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line.text);
    if (runtimeRequirement) {
      const [, rowKind, name, rest] = runtimeRequirement;
      children.push(conversionChild(source, block, options, line, {
        kind: 'conversionRuntimeRequirement',
        rowKind,
        normalizedRowKind: 'runtimeRequirement',
        name,
        id: idFrom(rest, `runtime_requirement_${name}`)
      }));
      continue;
    }
    const dialect = /^(dialect|extern)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line.text);
    if (dialect) {
      const [, rowKind, name, rest] = dialect;
      children.push(conversionChild(source, block, options, line, {
        kind: rowKind === 'extern' ? 'conversionExtern' : 'conversionDialect',
        rowKind,
        normalizedRowKind: rowKind,
        name,
        id: idFrom(rest, `${rowKind}_${name}`)
      }));
      continue;
    }
    const evidence = /^(evidence|proofEvidence)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line.text);
    if (evidence) {
      const [, rowKind, name, rest] = evidence;
      children.push(conversionChild(source, block, options, line, {
        kind: 'conversionEvidence',
        rowKind,
        normalizedRowKind: 'evidence',
        name,
        id: idFrom(rest, `conversion_evidence_${name}`)
      }));
      continue;
    }
    const constraint = /^constraint\s+([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line.text);
    if (!constraint) {
      const row = /^([A-Za-z_$][\w$-]*)\b/.exec(line.text);
      children.push(conversionChild(source, block, options, line, {
        kind: 'conversionUnknownRow',
        rowKind: row?.[1],
        normalizedRowKind: 'unknown',
        name: row?.[1] ?? 'unknown',
        id: `conversion_unknown_${safeId(row?.[1] ?? 'row')}_${line.startOffset}`,
        reason: 'unsupported-conversion-row',
        recognized: false
      }));
      continue;
    }
    const [, family, name, rest] = constraint;
    children.push(conversionChild(source, block, options, line, {
      kind: 'conversionConstraint',
      name,
      id: idFrom(rest, `conversion_constraint_${family}_${name}`),
      family,
      role: readInlineWord('role', rest) ?? 'source',
      recognized: true
    }));
  }
  return children;
}

function conversionChild(source, block, options, line, child) {
  return cleanRecord({
    header: line.text,
    startOffset: line.startOffset,
    endOffset: line.endOffset,
    location: sourcePosition(source, line.startOffset),
    parentKind: block.kind,
    parentId: block.id,
    parentName: block.name,
    moduleId: block.moduleId,
    moduleName: block.moduleName,
    sourceSpan: sourceSpan(source, block, line.startOffset, line.endOffset, options),
    recognized: true,
    ...child
  });
}

function readGenericRowSyntaxChildren(source, block, options, config) {
  const children = [];
  const rowPattern = new RegExp('^([A-Za-z_$][\\w$-]*)\\s+' + ROW_NAME_PATTERN + '(.*)$');
  for (const line of readBodyLines(source, block)) {
    if (!line.text || line.text.startsWith('#')) continue;
    const row = rowPattern.exec(line.text);
    if (!row) continue;
    const [, rowKind, name, rest] = row;
    if (!config.rowKinds.has(rowKind)) continue;
    const normalizedRowKind = config.normalize?.(rowKind) ?? rowKind;
    children.push(cleanRecord({
      kind: config.childKind,
      rowKind,
      normalizedRowKind,
      name,
      id: idFrom(rest, `${config.idPrefix}_${safeId(normalizedRowKind)}_${safeId(name)}`),
      header: line.text,
      startOffset: line.startOffset,
      endOffset: line.endOffset,
      location: sourcePosition(source, line.startOffset),
      parentKind: block.kind,
      parentId: block.id,
      parentName: block.name,
      moduleId: block.moduleId,
      moduleName: block.moduleName,
      sourceSpan: sourceSpan(source, block, line.startOffset, line.endOffset, options),
      recognized: true
    }));
  }
  return children;
}

function readBodyLines(source, block) {
  const body = source.slice(block.bodyStartOffset, block.bodyEndOffset);
  const lines = body.split('\n');
  const records = [];
  let lineStart = block.bodyStartOffset;
  for (const rawLine of lines) {
    const rawEnd = lineStart + rawLine.length;
    const leading = /^\s*/.exec(rawLine)?.[0].length ?? 0;
    const trailing = /\s*$/.exec(rawLine)?.[0].length ?? 0;
    const startOffset = lineStart + leading;
    const endOffset = Math.max(startOffset, rawEnd - trailing);
    records.push({ text: rawLine.trim(), startOffset, endOffset });
    lineStart = rawEnd + 1;
  }
  return records;
}

function sourcePosition(source, offset) {
  const lines = source.slice(0, offset).split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1, offset };
}

function sourceSpan(source, block, startOffset, endOffset, options = {}) {
  return cleanRecord({
    sourceId: options.documentId,
    path: options.sourcePath,
    blockId: block.id,
    blockKind: block.kind,
    startOffset,
    endOffset,
    start: sourcePosition(source, startOffset),
    end: sourcePosition(source, endOffset)
  });
}

function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function safeId(value) { return String(value).replace(/[^A-Za-z0-9_$-]+/g, '_').replace(/^_+|_+$/g, '') || 'row'; }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
