import { ROW_SYNTAX_CONFIG } from './source-syntax-row-config.js';

const ROW_NAME_PATTERN = '([A-Za-z_$@./:*+-][\\w$./@:*+-]*)';

export function readSourceSyntaxChildren(source, block, options = {}) {
  if (block.malformed) return [];
  if (block.kind === 'action') {
    return readActionSyntaxChildren(source, block, options);
  }
  if (block.kind === 'conversion' || block.kind === 'universalConversionPlan') {
    return readConversionSyntaxChildren(source, block, options);
  }
  const rowConfig = ROW_SYNTAX_CONFIG[block.kind];
  if (rowConfig) return readGenericRowSyntaxChildren(source, block, options, rowConfig);
  return [];
}

const ACTION_BODY_ROWS = new Set(['set', 'insert', 'remove', 'merge', 'callEffect', 'return']);

function readActionSyntaxChildren(source, block, options) {
  const children = [];
  const body = source.slice(block.bodyStartOffset, block.bodyEndOffset);
  const bodyBlocks = readNestedBodyBlocks('body', body);
  let rowIndex = 0;
  for (const bodyBlock of bodyBlocks) {
    const bodyStartOffset = block.bodyStartOffset + bodyBlock.bodyStart;
    const bodyEndOffset = block.bodyStartOffset + bodyBlock.bodyEnd;
    for (const line of readTextLines(source, bodyStartOffset, bodyEndOffset)) {
      if (!line.text || line.text.startsWith('#')) continue;
      const row = /^([A-Za-z_$][\w$-]*)(?:\s+([A-Za-z_$@./:*+-][\w$./@:*+-]*))?(.*)$/.exec(line.text);
      const rowKind = row?.[1] ?? 'unknown';
      const name = row?.[2] && !row[2].startsWith('@') ? row[2] : `${rowKind}_${rowIndex}`;
      const rest = row?.[2]?.startsWith('@') ? ` ${row[2]}${row[3] ?? ''}` : (row?.[3] ?? '');
      const recognized = ACTION_BODY_ROWS.has(rowKind);
      children.push(cleanRecord({
        kind: recognized ? 'actionBodyRow' : 'actionUnknownRow',
        rowKind,
        normalizedRowKind: recognized ? rowKind : 'unknown',
        name,
        id: idFrom(rest, `action_body_${safeId(rowKind)}_${safeId(name)}_${rowIndex}`),
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
        recognized,
        reason: recognized ? undefined : 'unsupported-action-body-row'
      }));
      rowIndex++;
    }
  }
  return children;
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
  return readTextLines(source, block.bodyStartOffset, block.bodyEndOffset);
}

function readTextLines(source, startOffset, endOffset) {
  const body = source.slice(startOffset, endOffset);
  const lines = body.split('\n');
  const records = [];
  let lineStart = startOffset;
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

function readNestedBodyBlocks(kind, source) {
  const blocks = [];
  const header = new RegExp('\\b' + kind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s+([^{}\\n]+?))?\\s*\\{', 'g');
  let match;
  while ((match = header.exec(source))) {
    const open = header.lastIndex - 1;
    const close = findMatchingBrace(source, open);
    if (close < 0) continue;
    blocks.push({
      header: (match[1] ?? '').trim(),
      start: match.index,
      bodyStart: open + 1,
      bodyEnd: close,
      end: close + 1
    });
    header.lastIndex = close + 1;
  }
  return blocks;
}

function findMatchingBrace(source, open) {
  let depth = 0;
  let state = 'code';
  let quote = '';
  for (let index = open; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];
    if (state === 'line-comment') {
      if (char === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        index++;
        state = 'code';
      }
      continue;
    }
    if (state === 'string') {
      if (char === '\\') {
        index++;
        continue;
      }
      if (char === quote) {
        state = 'code';
        quote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      index++;
      state = 'line-comment';
      continue;
    }
    if (char === '/' && next === '*') {
      index++;
      state = 'block-comment';
      continue;
    }
    if (char === '"' || char === "'") {
      state = 'string';
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 0) return index;
    }
  }
  return -1;
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
