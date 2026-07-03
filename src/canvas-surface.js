import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { createRowIdentityTracker } from './row-identity.js';

export function parseCanvasSurfaceBlock(block) {
  const name = nameFrom(block.header);
  const sourcePath = readLine('sourcePath', block.body) ?? readLine('path', block.body);
  const sourceHash = readLine('sourceHash', block.body);
  const rowIdentity = createRowIdentityTracker();
  const evidence = [];
  const records = [];
  const commandTraces = [];
  const proofGaps = [];
  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || isPropertyLine(line)) continue;
    const match = /^(element|command|state|stateWrite|trace|evidence|proofEvidence|gap|proofGap)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, rest] = match;
    if (rowKind === 'evidence' || rowKind === 'proofEvidence') {
      rowIdentity.push(evidence, canvasEvidence(rowName, rest), { rowKind, normalizedRowKind: 'evidence', name: rowName });
      continue;
    }
    if (rowKind === 'gap' || rowKind === 'proofGap') {
      rowIdentity.push(proofGaps, canvasProofGap(rowName, rest), { rowKind, normalizedRowKind: 'proofGap', name: rowName });
      continue;
    }
    if (rowKind === 'trace') {
      rowIdentity.push(commandTraces, canvasTrace(rowName, rest, { sourcePath }), { rowKind, normalizedRowKind: 'trace', name: rowName });
      continue;
    }
    const normalizedRowKind = rowKind === 'stateWrite' ? 'state-write' : rowKind;
    rowIdentity.push(records, canvasRecord(normalizedRowKind, rowName, rest, { sourcePath, sourceHash }), { rowKind, normalizedRowKind, name: rowName });
  }
  const allGaps = [...records.flatMap((record) => record.proofGaps ?? []), ...proofGaps];
  const tree = {
    kind: 'frontier.lang.canvasSemanticTree',
    version: 1,
    id: idFrom(block.header, `canvas_surface_${name}`),
    name,
    sourcePath,
    sourceHash,
    records,
    commandTraces,
    proofGaps: allGaps,
    evidence,
    parser: { status: 'authored', errors: rowIdentity.errors },
    claims: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      browserRuntimeEquivalenceClaim: false,
      canvasRuntimeEquivalenceClaim: false,
      canvasVisualEquivalenceClaim: false
    },
    metadata: { authoredName: name }
  };
  tree.summary = summarizeCanvasSurface(tree);
  tree.treeHash = hashSemanticValue({ kind: 'frontier.lang.canvas.authoredTree.v1', records: records.map(hashableRecord), proofGaps: allGaps.map((gap) => gap.code), commandTraces: commandTraces.map((trace) => trace.traceHash) });
  return tree;
}

function canvasRecord(kind, name, text, context) {
  const category = readInlineWord('category', text) ?? defaultCategory(kind);
  const recordName = readInlineWord('name', text) ?? name;
  const order = readInlineNumber('order', text) ?? readInlineNumber('renderOrder', text) ?? 0;
  const proofGaps = readInlineList(text, 'proofGap', 'proofGaps', 'gap', 'gaps')?.map((code) => canvasProofGap(code, '')) ?? [];
  const textValue = readInlineQuoted('text', text) ?? readInlineWord('text', text) ?? `${kind}:${category}:${recordName}:${order}`;
  return cleanRecord({
    kind,
    id: idFrom(text, `canvas_${kind.replace(/-/g, '_')}_${safeId(recordName)}`),
    name: recordName,
    category,
    contextKind: readInlineWord('context', text) ?? readInlineWord('contextKind', text),
    renderOrder: order,
    identityKey: readInlineWord('identity', text) ?? readInlineWord('identityKey', text) ?? `canvas:${kind}:${category}:${recordName}:${order || safeId(recordName)}`,
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text) ?? context.sourcePath,
    sourceHash: readInlineWord('sourceHash', text) ?? context.sourceHash,
    sourceSpan: parseSpan(readInlineWord('sourceSpan', text)),
    textHash: hashSemanticValue({ kind: 'frontier.lang.canvas.authoredRecordText.v1', text: textValue }),
    attributes: parsePairs(readInlineWord('attributes', text) ?? readInlineWord('attrs', text) ?? readInlineWord('attr', text)),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    proofGaps
  });
}

function canvasTrace(name, text, context) {
  const commands = readInlineList(text, 'command', 'commands') ?? [];
  const records = commands.map((command, index) => ({
    kind: 'trace-command',
    name: command,
    category: readInlineWord('category', text) ?? 'custom',
    ordinal: index + 1,
    commandHash: hashSemanticValue({ kind: 'frontier.lang.canvas.authoredTraceCommand.v1', command, index }),
    argsHash: hashSemanticValue({ kind: 'frontier.lang.canvas.authoredTraceArgs.v1', command, index }),
    proofGaps: []
  }));
  return cleanRecord({
    kind: 'frontier.lang.canvasCommandTrace',
    version: 1,
    id: idFrom(text, `canvas_trace_${name}`),
    name,
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text) ?? context.sourcePath,
    traceHash: hashSemanticValue({ kind: 'frontier.lang.canvas.authoredTrace.v1', commands }),
    records,
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    runtimeEquivalenceClaim: false,
    visualEquivalenceClaim: false,
    summary: {
      commands: records.length,
      drawCommands: records.filter((record) => ['draw', 'image', 'text', 'path'].includes(record.category)).length,
      proofGaps: 0
    }
  });
}

function canvasProofGap(name, text) {
  const code = readInlineWord('code', text) ?? name;
  return cleanRecord({
    id: idFrom(text, `canvas_gap_${safeId(code)}`),
    code,
    status: readInlineWord('status', text) ?? 'not-claimed',
    summary: readInlineQuoted('summary', text) ?? readInlineQuoted('message', text),
    failClosed: true,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false,
    canvasRuntimeEquivalenceClaim: false,
    canvasVisualEquivalenceClaim: false,
    sourceSpan: parseSpan(readInlineWord('sourceSpan', text))
  });
}

function canvasEvidence(name, text) {
  return cleanRecord({
    id: idFrom(text, `evidence_${name}`),
    kind: readInlineWord('kind', text) ?? 'note',
    status: readInlineWord('status', text) ?? 'unknown',
    path: readInlineWord('path', text),
    summary: readInlineQuoted('summary', text),
    metadata: { name }
  });
}

function summarizeCanvasSurface(tree) {
  return {
    elements: tree.records.filter((record) => record.kind === 'element').length,
    commands: tree.records.filter((record) => record.kind === 'command').length,
    stateWrites: tree.records.filter((record) => record.kind === 'state-write').length,
    drawCommands: tree.records.filter((record) => ['draw', 'image', 'text', 'path'].includes(record.category)).length,
    offscreenCommands: tree.records.filter((record) => record.category === 'offscreen').length,
    gpuCommands: tree.records.filter((record) => record.contextKind === 'webgl' || record.contextKind === 'webgl2' || record.contextKind === 'webgpu').length,
    commandTraces: tree.commandTraces.length,
    proofGaps: tree.proofGaps.length,
    parseErrors: tree.parser.errors.length
  };
}

function defaultCategory(kind) {
  if (kind === 'element') return 'html-canvas';
  if (kind === 'state-write') return 'state';
  return 'draw';
}

function parsePairs(value) {
  if (!value) return undefined;
  const pairs = Object.fromEntries(value.split(/[|,]/).map((item) => {
    const [key, rawValue] = item.split('=');
    return [key, rawValue ?? true];
  }).filter(([key]) => key));
  return Object.keys(pairs).length ? pairs : undefined;
}

function hashableRecord(record) {
  return { kind: record.kind, name: record.name, category: record.category, contextKind: record.contextKind, renderOrder: record.renderOrder, proofGaps: record.proofGaps?.map((gap) => gap.code) };
}

function isPropertyLine(line) {
  return /^(sourcePath|path|sourceHash)\s+/.test(line);
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$-]*)/.exec(header)?.[1] ?? 'CanvasSurface'; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineNumber(label, text) {
  const value = readInlineWord(label, text);
  return value === undefined ? undefined : Number(value);
}
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
