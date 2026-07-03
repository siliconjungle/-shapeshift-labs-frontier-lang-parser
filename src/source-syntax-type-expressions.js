import { inspectTypeExpressionSyntax } from './type-expressions.js';

export function readTypeExpressionSyntaxChildren(source, block, options = {}) {
  const children = [];
  for (const line of readBodyLines(source, block)) {
    if (!line.text || line.text.startsWith('#')) continue;
    for (const candidate of readTypeExpressionCandidates(block, line.text)) {
      const inspected = inspectTypeExpressionSyntax(candidate.typeSource);
      if (inspected.ok) continue;
      children.push(cleanRecord({
        kind: 'typeExpressionSyntax',
        rowKind: candidate.rowKind,
        normalizedRowKind: candidate.rowKind,
        name: candidate.name,
        id: `${block.id ?? block.kind}_${candidate.rowKind}_${safeId(candidate.name)}_${line.startOffset}`,
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
        recognized: false,
        reason: inspected.reason,
        typeSource: candidate.typeSource
      }));
    }
  }
  return children;
}

function readTypeExpressionCandidates(block, text) {
  if (block.kind === 'type') return readTypeBlockTypeExpressionCandidates(block, text);
  if (block.kind === 'entity') return readNamedTypeFieldCandidate(text, 'field', { stopAtMetadata: true });
  if (block.kind === 'state') return readNamedTypeFieldCandidate(text, 'collection', { stopAtMetadata: true });
  if (block.kind === 'view') return readViewTypeExpressionCandidates(text);
  if (block.kind === 'action' || block.kind === 'effect' || block.kind === 'capability' || block.kind === 'extern') {
    return readSignatureTypeExpressionCandidates(text);
  }
  if (block.kind === 'lattice') return readCarrierTypeExpressionCandidate(text);
  return [];
}

function readTypeBlockTypeExpressionCandidates(block, text) {
  const alias = /^=\s*(.+)$/.exec(text);
  if (alias) return [{ rowKind: 'typeAlias', name: block.name ?? 'alias', typeSource: alias[1].trim() }];
  if (text.startsWith('variant ')) return [];
  return readNamedTypeFieldCandidate(text, 'typeField');
}

function readViewTypeExpressionCandidates(text) {
  const prop = /^prop\s+([A-Za-z_$][\w$.-]*)(?:\s+@id\(\s*["'][^"']+["']\s*\))?\s*:\s*(.+)$/.exec(text);
  if (prop) {
    const typeSource = prop[2].replace(/\s+optional\s*$/, '').trim();
    return typeSource ? [{ rowKind: 'viewProp', name: prop[1], typeSource }] : [];
  }
  const event = /^event\s+([A-Za-z_$][\w$.-]*)(?:\s+@id\(\s*["'][^"']+["']\s*\))?(.*)$/.exec(text);
  if (!event) return [];
  const input = readInlineType('input', event[2]);
  return input ? [{ rowKind: 'viewEventInput', name: event[1], typeSource: input }] : [];
}

function readSignatureTypeExpressionCandidates(text) {
  const input = /^input\s*:?\s*(.+)$/.exec(text);
  if (input) return [{ rowKind: 'input', name: 'input', typeSource: input[1].trim() }];
  const returns = /^returns\s+(.+)$/.exec(text);
  if (returns) return [{ rowKind: 'returns', name: 'returns', typeSource: returns[1].trim() }];
  return [];
}

function readCarrierTypeExpressionCandidate(text) {
  const carrier = /^carrier\s+(.+)$/.exec(text);
  return carrier ? [{ rowKind: 'carrier', name: 'carrier', typeSource: carrier[1].trim() }] : [];
}

function readNamedTypeFieldCandidate(text, rowKind, options = {}) {
  const field = /^([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["'][^"']+["']\s*\))?\s*:\s*(.+)$/.exec(text);
  if (!field) return [];
  const typeSource = options.stopAtMetadata ? readTypeSourceBeforeMetadata(field[2]) : field[2].trim();
  return typeSource ? [{ rowKind, name: field[1], typeSource }] : [];
}

function readTypeSourceBeforeMetadata(source) {
  let stack = [];
  let quote = '';
  let escaped = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (stack.length === 0 && char === '{') return source.slice(0, index).trim();
    if (char === '<' || char === '(' || char === '[' || char === '{') {
      stack.push(closingDelimiterFor(char));
      continue;
    }
    if (char === '>' || char === ')' || char === ']' || char === '}') {
      if (stack[stack.length - 1] === char) stack = stack.slice(0, -1);
      continue;
    }
    if (stack.length === 0 && /\s/.test(char) && source.slice(index).trimStart().startsWith('@')) {
      return source.slice(0, index).trim();
    }
  }
  return source.trim();
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

function readInlineType(label, text = '') { return new RegExp('(?:^|\\s)' + label + '\\s+(.+)$').exec(text)?.[1]?.trim(); }
function safeId(value) { return String(value).replace(/[^A-Za-z0-9_$-]+/g, '_').replace(/^_+|_+$/g, '') || 'row'; }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}

function closingDelimiterFor(char) {
  if (char === '<') return '>';
  if (char === '(') return ')';
  if (char === '[') return ']';
  return '}';
}
