import { readSourceSyntaxChildren } from './source-syntax-children.js';
import { FrontierSourceBlockKinds } from './source-block-kinds.js';

export { FrontierSourceBlockKinds };

const FrontierSourceBlockKindSet = new Set(FrontierSourceBlockKinds);

export function inspectFrontierSourceSyntax(source, options = {}) {
  const documentId = options.id ?? readId(source) ?? 'mod_frontier';
  const documentName = options.name ?? readName(source) ?? 'FrontierModule';
  const structure = scanFrontierStructure(source);
  const blocks = readCandidateDeclarationBlocks(source, structure).map((block) => ({
    ...block,
    recognized: FrontierSourceBlockKindSet.has(block.kind),
    children: readSourceSyntaxChildren(source, block, { ...options, documentId })
  }));
  for (const block of blocks) {
    if (!block.children.length) delete block.children;
  }
  const recognizedBlocks = blocks.filter((block) => block.recognized);
  const unknownBlocks = blocks.filter((block) => !block.recognized).map((block) => ({
    ...block,
    reason: 'unsupported-top-level-block'
  }));
  const childRecords = blocks.flatMap((block) => block.children ?? []);
  const unknownChildren = childRecords.filter((child) => !child.recognized).map((child) => ({
    ...child,
    reason: child.reason ?? 'unsupported-child-syntax'
  }));
  const malformedBlockOpenOffsets = new Set(blocks.filter((block) => block.malformed).map((block) => block.bodyStartOffset - 1));
  const diagnostics = [
    ...blocks.flatMap((block) => block.diagnostics ?? []),
    ...structure.unmatchedOpenBraces.filter((offset) => !malformedBlockOpenOffsets.has(offset)).map((offset) => ({
      reason: 'unterminated-block',
      message: 'Found an opening brace without a matching closing brace.',
      location: sourcePosition(source, offset)
    })),
    ...structure.unmatchedCloseBraces.map((offset) => ({
      reason: 'unmatched-close-brace',
      message: 'Found a closing brace without a matching opening brace.',
      location: sourcePosition(source, offset)
    }))
  ];
  const malformedBlocks = blocks.filter((block) => block.malformed);
  const failClosed = unknownBlocks.length > 0 || unknownChildren.length > 0 || diagnostics.length > 0;
  return {
    kind: 'frontier.lang.sourceSyntaxReport',
    version: 1,
    documentId,
    documentName,
    blocks,
    recognizedBlocks,
    unknownBlocks,
    unknownChildren,
    summary: {
      blockCount: blocks.length,
      recognizedBlockCount: recognizedBlocks.length,
      unknownBlockCount: unknownBlocks.length,
      unknownChildCount: unknownChildren.length,
      malformedBlockCount: malformedBlocks.length,
      childCount: childRecords.length,
      recognizedChildCount: childRecords.filter((child) => child.recognized).length,
      diagnosticCount: diagnostics.length,
      recognizedKinds: unique(recognizedBlocks.map((block) => block.kind)),
      recognizedChildKinds: unique(childRecords.filter((child) => child.recognized).map((child) => child.kind)),
      unknownKinds: unique(unknownBlocks.map((block) => block.kind)),
      unknownChildKinds: unique(unknownChildren.map((child) => child.rowKind ?? child.kind)),
      failClosed,
      unsupportedSyntax: unknownBlocks.length > 0 || unknownChildren.length > 0
    },
    diagnostics,
    metadata: {
      sourceBytes: utf8ByteLength(source),
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  };
}

export function readFrontierSourceBlocks(source, options = {}) {
  const report = inspectFrontierSourceSyntax(source, options);
  return report.recognizedBlocks.filter((block) => !block.malformed).map((block) => ({
    kind: block.kind,
    header: block.header,
    body: source.slice(block.bodyStartOffset, block.bodyEndOffset),
    syntax: block,
    sourceSpan: (startOffset, endOffset) => sourceSpan(source, block, startOffset, endOffset, { ...options, documentId: report.documentId })
  }));
}

export function readFrontierNestedBlocks(kind, source) {
  const structure = scanFrontierStructure(source);
  const blocks = [];
  const header = new RegExp('\\b' + escapeRegExp(kind) + '\\s+([^{}]+?)\\{', 'g');
  let match;
  while ((match = header.exec(source))) {
    const start = match.index;
    const open = header.lastIndex - 1;
    if (!structure.codeOffsets[start] || !structure.codeOffsets[open]) continue;
    const close = findMatchingBrace(structure, open);
    if (close < 0) continue;
    blocks.push({
      kind,
      header: match[1].trim(),
      body: source.slice(header.lastIndex, close),
      start,
      end: close + 1
    });
    header.lastIndex = close + 1;
  }
  return blocks;
}

function readCandidateDeclarationBlocks(source, structure) {
  const moduleRanges = readModuleRanges(source, structure);
  const blocks = [];
  const header = /(^|\n)\s*([A-Za-z_$][\w$]*)\s+([^{}\n]+)\{/g;
  let match;
  while ((match = header.exec(source))) {
    const fullStart = match.index + match[1].length;
    const leading = /^\s*/.exec(source.slice(fullStart))?.[0].length ?? 0;
    const start = fullStart + leading;
    const kind = match[2];
    if (kind === 'module') continue;
    const open = header.lastIndex - 1;
    if (!structure.codeOffsets[start] || !structure.codeOffsets[open]) continue;
    const close = findMatchingBrace(structure, open);
    const malformed = close < 0;
    const end = malformed ? source.length : close + 1;
    const bodyEnd = malformed ? source.length : close;
    const depth = braceDepthBefore(structure, start);
    const moduleRange = moduleRanges.find((range) => start > range.open && start < range.close);
    const declarationDepth = moduleRange ? moduleRange.depth + 1 : 0;
    if (depth !== declarationDepth) continue;
    const headerText = match[3].trim();
    blocks.push({
      kind,
      name: nameFrom(headerText),
      id: idFrom(headerText),
      header: headerText,
      startOffset: start,
      endOffset: end,
      bodyStartOffset: open + 1,
      bodyEndOffset: bodyEnd,
      location: sourcePosition(source, start),
      moduleId: moduleRange?.id,
      moduleName: moduleRange?.name,
      malformed,
      diagnostics: malformed ? [{
        reason: 'unterminated-block',
        message: `Block "${kind}" has no matching closing brace.`,
        location: sourcePosition(source, open)
      }] : []
    });
  }
  return blocks;
}

function readModuleRanges(source, structure) {
  const ranges = [];
  const header = /(^|\n)\s*module\s+([^{}\n]+)\{/g;
  let match;
  while ((match = header.exec(source))) {
    const fullStart = match.index + match[1].length;
    const leading = /^\s*/.exec(source.slice(fullStart))?.[0].length ?? 0;
    const start = fullStart + leading;
    const open = header.lastIndex - 1;
    if (!structure.codeOffsets[start] || !structure.codeOffsets[open]) continue;
    const close = findMatchingBrace(structure, open);
    const malformed = close < 0;
    ranges.push({
      start,
      open,
      close: malformed ? source.length : close,
      depth: braceDepthBefore(structure, start),
      name: nameFrom(match[2].trim()),
      id: idFrom(match[2].trim()),
      malformed
    });
  }
  return ranges;
}

function findMatchingBrace(structure, open) {
  return structure.bracePairs.get(open) ?? -1;
}

function braceDepthBefore(structure, offset) {
  return structure.depthBefore[Math.min(Math.max(offset, 0), structure.depthBefore.length - 1)] ?? 0;
}

function scanFrontierStructure(source) {
  const depthBefore = new Int32Array(source.length + 1);
  const codeOffsets = new Uint8Array(source.length);
  const stack = [];
  const bracePairs = new Map();
  const unmatchedCloseBraces = [];
  let depth = 0;
  let state = 'code';
  let quote = '';
  for (let index = 0; index < source.length; index++) {
    depthBefore[index] = depth;
    const char = source[index];
    const next = source[index + 1];
    if (state === 'line-comment') {
      if (char === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        depthBefore[index + 1] = depth;
        index++;
        state = 'code';
      }
      continue;
    }
    if (state === 'string') {
      if (char === '\\') {
        depthBefore[index + 1] = depth;
        index++;
        continue;
      }
      if (char === quote) {
        state = 'code';
        quote = '';
      }
      continue;
    }
    codeOffsets[index] = 1;
    if (char === '/' && next === '/') {
      codeOffsets[index + 1] = 0;
      depthBefore[index + 1] = depth;
      index++;
      state = 'line-comment';
      continue;
    }
    if (char === '/' && next === '*') {
      codeOffsets[index + 1] = 0;
      depthBefore[index + 1] = depth;
      index++;
      state = 'block-comment';
      continue;
    }
    if (char === '#' && isLineLeadingWhitespace(source, index)) {
      state = 'line-comment';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      state = 'string';
      quote = char;
      continue;
    }
    if (char === '{') {
      stack.push(index);
      depth++;
      continue;
    }
    if (char === '}') {
      const open = stack.pop();
      if (open === undefined) {
        unmatchedCloseBraces.push(index);
        continue;
      }
      depth = Math.max(0, depth - 1);
      bracePairs.set(open, index);
    }
  }
  depthBefore[source.length] = depth;
  return { bracePairs, codeOffsets, depthBefore, unmatchedCloseBraces, unmatchedOpenBraces: stack };
}

function isLineLeadingWhitespace(source, offset) {
  for (let index = offset - 1; index >= 0 && source[index] !== '\n'; index--) {
    if (!/\s/.test(source[index])) return false;
  }
  return true;
}

function utf8ByteLength(source) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(source).length;
  return unescape(encodeURIComponent(source)).length;
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

function readName(source) { return /module\s+([A-Za-z_$][\w$]*)/.exec(source)?.[1]; }
function readId(source) { return /module\s+[A-Za-z_$][\w$]*\s+@id\(\s*["']([^"']+)["']\s*\)/.exec(source)?.[1]; }
function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Unnamed'; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
