export const FrontierSourceBlockKinds = Object.freeze([
  'entity',
  'state',
  'action',
  'view',
  'migration',
  'capability',
  'effect',
  'type',
  'extern',
  'lattice',
  'nativeSource',
  'target',
  'proof',
  'paradigm',
  'paradigmSemantics',
  'operations',
  'semanticOperations',
  'conversion',
  'universalConversionPlan',
  'constraintSpace',
  'possibilitySpace',
  'decisionGraph',
  'admissionGraph',
  'dialectRegistry',
  'universalDialectRegistry',
  'interlingua',
  'universalInterlingua',
  'resourceGraph',
  'semanticResourceGraph',
  'packageManifest',
  'packageGraph',
  'packageSurface',
  'canvasSurface',
  'canvasGraph',
  'applicationSurface',
  'appHost',
  'plugin',
  'pluginSurface',
  'pluginContract',
  'runtimeCapabilities',
  'runtimeCapabilityMatrix',
  'runtimeHosts'
]);

const FrontierSourceBlockKindSet = new Set(FrontierSourceBlockKinds);

export function inspectFrontierSourceSyntax(source, options = {}) {
  const documentId = options.id ?? readId(source) ?? 'mod_frontier';
  const documentName = options.name ?? readName(source) ?? 'FrontierModule';
  const blocks = readCandidateDeclarationBlocks(source).map((block) => ({
    ...block,
    recognized: FrontierSourceBlockKindSet.has(block.kind)
  }));
  const recognizedBlocks = blocks.filter((block) => block.recognized);
  const unknownBlocks = blocks.filter((block) => !block.recognized).map((block) => ({
    ...block,
    reason: 'unsupported-top-level-block'
  }));
  return {
    kind: 'frontier.lang.sourceSyntaxReport',
    version: 1,
    documentId,
    documentName,
    blocks,
    recognizedBlocks,
    unknownBlocks,
    summary: {
      blockCount: blocks.length,
      recognizedBlockCount: recognizedBlocks.length,
      unknownBlockCount: unknownBlocks.length,
      recognizedKinds: unique(recognizedBlocks.map((block) => block.kind)),
      unknownKinds: unique(unknownBlocks.map((block) => block.kind)),
      failClosed: unknownBlocks.length > 0,
      unsupportedSyntax: unknownBlocks.length > 0
    },
    metadata: {
      sourceBytes: source.length,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  };
}

function readCandidateDeclarationBlocks(source) {
  const moduleRanges = readModuleRanges(source);
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
    const close = findMatchingBrace(source, open);
    const depth = braceDepthBefore(source, start);
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
      endOffset: close + 1,
      bodyStartOffset: open + 1,
      bodyEndOffset: close,
      location: sourcePosition(source, start),
      moduleId: moduleRange?.id,
      moduleName: moduleRange?.name
    });
  }
  return blocks;
}

function readModuleRanges(source) {
  const ranges = [];
  const header = /(^|\n)\s*module\s+([^{}\n]+)\{/g;
  let match;
  while ((match = header.exec(source))) {
    const fullStart = match.index + match[1].length;
    const leading = /^\s*/.exec(source.slice(fullStart))?.[0].length ?? 0;
    const start = fullStart + leading;
    const open = header.lastIndex - 1;
    const close = findMatchingBrace(source, open);
    ranges.push({
      start,
      open,
      close,
      depth: braceDepthBefore(source, start),
      name: nameFrom(match[2].trim()),
      id: idFrom(match[2].trim())
    });
  }
  return ranges;
}

function findMatchingBrace(source, open) {
  let depth = 1;
  for (let index = open + 1; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') depth--;
    if (depth === 0) return index;
  }
  return source.length - 1;
}

function braceDepthBefore(source, offset) {
  let depth = 0;
  for (let index = 0; index < offset; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') depth = Math.max(0, depth - 1);
  }
  return depth;
}

function sourcePosition(source, offset) {
  const lines = source.slice(0, offset).split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1, offset };
}

function readName(source) { return /module\s+([A-Za-z_$][\w$]*)/.exec(source)?.[1]; }
function readId(source) { return /module\s+[A-Za-z_$][\w$]*\s+@id\(\s*["']([^"']+)["']\s*\)/.exec(source)?.[1]; }
function idFrom(header) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1]; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Unnamed'; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
