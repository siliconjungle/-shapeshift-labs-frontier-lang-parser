import {
  actionNode,
  capabilityNode,
  createDocument,
  effectNode,
  entityNode,
  externNode,
  latticeNode,
  migrationNode,
  nativeSourceNode,
  stateNode,
  targetNode,
  typeNode
} from '@shapeshift-labs/frontier-lang-kernel';
import { parseViewBlock } from './view.js';

export function parseFrontierSource(source, options = {}) {
  const nodes = [];
  const documentId = options.id ?? readId(source) ?? 'mod_frontier';
  const documentName = options.name ?? readName(source) ?? 'FrontierModule';
  for (const block of readBlocks(source)) {
    if (block.kind === 'entity') nodes.push(parseEntity(block));
    if (block.kind === 'state') nodes.push(parseState(block));
    if (block.kind === 'action') nodes.push(parseAction(block));
    if (block.kind === 'view') nodes.push(parseViewBlock(block));
    if (block.kind === 'migration') nodes.push(parseMigration(block));
    if (block.kind === 'capability') nodes.push(parseCapability(block));
    if (block.kind === 'effect') nodes.push(parseEffect(block));
    if (block.kind === 'type') nodes.push(parseType(block));
    if (block.kind === 'extern') nodes.push(parseExtern(block));
    if (block.kind === 'lattice') nodes.push(parseLattice(block));
    if (block.kind === 'nativeSource') nodes.push(parseNativeSource(block));
    if (block.kind === 'target') nodes.push(parseTarget(block));
  }
  return createDocument({ id: documentId, name: documentName, nodes });
}

export function parseFrontierFile(name, source) {
  return parseFrontierSource(source, { name: name.replace(/\.frontier$/, '') });
}

function readName(source) { return /module\s+([A-Za-z_$][\w$]*)/.exec(source)?.[1]; }
function readId(source) { return /module\s+[A-Za-z_$][\w$]*\s+@id\(\s*["']([^"']+)["']\s*\)/.exec(source)?.[1]; }
function readBlocks(source) {
  const blocks = [];
  const header = /\b(entity|state|action|view|migration|capability|effect|type|extern|lattice|nativeSource|target)\s+([^{}]+)\{/g;
  let match;
  while ((match = header.exec(source))) {
    let depth = 1; let index = header.lastIndex;
    while (index < source.length && depth > 0) { const ch = source[index++]; if (ch === '{') depth++; if (ch === '}') depth--; }
    blocks.push({ kind: match[1], header: match[2].trim(), body: source.slice(header.lastIndex, index - 1) });
    header.lastIndex = index;
  }
  return blocks;
}
function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Unnamed'; }
function parseEntity(block) {
  const name = nameFrom(block.header);
  const fields = [];
  const fieldRe = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?\s*:\s*([^@{\n]+)([^\n{]*)(?:\{([^}]*)\})?/gm;
  let m;
  while ((m = fieldRe.exec(block.body))) {
    const mergeText = (m[4] ?? '') + ' ' + (m[5] ?? '');
    fields.push({
      id: m[2] ?? `field_${name}_${m[1]}`,
      name: m[1],
      type: parseTypeExpression(m[3].trim()),
      key: /@key/.test(m[4] ?? ''),
      merge: parseMerge(mergeText),
      semantic: parseSemantic(mergeText)
    });
  }
  return entityNode({ id: idFrom(block.header, `ent_${name}`), name, fields });
}
function parseState(block) {
  const name = nameFrom(block.header);
  const collections = [];
  const re = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?\s*:\s*([^@{\n]+)(?:\{([^}]*)\})?/gm;
  let m;
  while ((m = re.exec(block.body))) {
    collections.push({
      id: m[2] ?? `collection_${name}_${m[1]}`,
      name: m[1],
      type: parseTypeExpression(m[3].trim()),
      merge: parseMerge(m[4] ?? ''),
      semantic: parseSemantic(m[4] ?? '')
    });
  }
  return stateNode({ id: idFrom(block.header, `state_${name}`), name, collections });
}
function parseAction(block) {
  const name = nameFrom(block.header);
  return actionNode({
    id: idFrom(block.header, `action_${name}`),
    name,
    input: parseOptionalTypeExpression(/input\s*:?\s*([^\n]+)/.exec(block.body)?.[1]),
    returns: parseOptionalTypeExpression(/returns\s+([^\n]+)/.exec(block.body)?.[1]),
    reads: readList('reads', block.body),
    writes: readList('writes', block.body),
    uses: readList('uses', block.body)
  });
}
function parseMigration(block) {
  const name = nameFrom(block.header);
  return migrationNode({ id: idFrom(block.header, `migration_${name}`), name, fromVersion: readWord('fromVersion', block.body) ?? readWord('from', block.body) ?? 'unknown', toVersion: readWord('toVersion', block.body) ?? readWord('to', block.body) ?? 'unknown', changes: readChangeRecords(block.body), invariants: readList('invariants', block.body) });
}
function parseEffect(block) {
  const name = nameFrom(block.header);
  return effectNode({
    id: idFrom(block.header, `effect_${name}`),
    name,
    capability: /capability\s+([^\n]+)/.exec(block.body)?.[1]?.trim() ?? name,
    input: parseOptionalTypeExpression(/input\s*:?\s*([^\n]+)/.exec(block.body)?.[1]),
    returns: parseOptionalTypeExpression(/returns\s+([^\n]+)/.exec(block.body)?.[1]),
    resources: readList('resources', block.body)
  });
}
function parseCapability(block) {
  const name = nameFrom(block.header);
  return capabilityNode({
    id: idFrom(block.header, `cap_${name}`),
    name,
    capability: readLine('capability', block.body) ?? name,
    category: readWord('category', block.body),
    input: parseOptionalTypeExpression(/input\s*:?\s*([^\n]+)/.exec(block.body)?.[1]),
    returns: parseOptionalTypeExpression(/returns\s+([^\n]+)/.exec(block.body)?.[1]),
    effects: readList('effects', block.body),
    resources: readList('resources', block.body),
    adapters: readAdapters(block.body),
    unsupportedTargets: readUnsupportedTargets(block.body)
  });
}
function parseType(block) {
  const name = nameFrom(block.header);
  const alias = /^\s*=\s*([^\n]+)/m.exec(block.body)?.[1]?.trim();
  return typeNode({
    id: idFrom(block.header, `type_${name}`),
    name,
    parameters: readTypeParameters(block.header),
    type: alias ? parseTypeExpression(alias) : undefined,
    fields: readTypeFields(block.body),
    variants: readVariants(block.body),
    invariants: readList('invariants', block.body)
  });
}
function parseExtern(block) {
  const name = nameFrom(block.header);
  return externNode({
    id: idFrom(block.header, `extern_${name}`),
    name,
    language: readWord('language', block.body) ?? readWord('target', block.body) ?? 'javascript',
    symbol: readWord('symbol', block.body) ?? name,
    signature: {
      input: parseOptionalTypeExpression(/input\s*:?\s*([^\n]+)/.exec(block.body)?.[1]),
      returns: parseOptionalTypeExpression(/returns\s+([^\n]+)/.exec(block.body)?.[1])
    },
    effects: readList('effects', block.body) ?? readList('uses', block.body),
    resources: readList('resources', block.body)
  });
}
function parseLattice(block) {
  const name = nameFrom(block.header);
  const exportName = readWord('frontierCrdt', block.body) ?? readWord('frontier-crdt', block.body);
  return latticeNode({
    id: idFrom(block.header, `lattice_${name}`),
    name,
    carrier: parseTypeExpression(readLine('carrier', block.body) ?? 'Json'),
    laws: readList('laws', block.body) ?? readList('law', block.body) ?? [],
    frontierCrdt: exportName ? {
      packageName: '@shapeshift-labs/frontier-crdt',
      exportName,
      lawChecker: readWord('lawChecker', block.body)
    } : undefined
  });
}
function parseNativeSource(block) {
  const name = nameFrom(block.header);
  const losses = [];
  const lossRe = /^\s*loss\s+([A-Za-z][\w-]*)\s+["']([^"']+)["'](?:\s+severity\s+([A-Za-z][\w-]*))?/gm;
  let match;
  while ((match = lossRe.exec(block.body))) {
    losses.push({
      id: `loss_${name}_${losses.length}`,
      kind: match[1],
      message: match[2],
      severity: match[3] ?? 'warning'
    });
  }
  return nativeSourceNode({
    id: idFrom(block.header, `native_${name}`),
    name,
    language: readWord('language', block.body) ?? name,
    parser: readWord('parser', block.body),
    parserVersion: readWord('parserVersion', block.body),
    sourcePath: readWord('sourcePath', block.body) ?? readWord('path', block.body),
    sourceHash: readWord('sourceHash', block.body),
    symbol: readWord('symbol', block.body),
    frontierNodeIds: readList('frontierNodes', block.body),
    losses: losses.length ? losses : undefined
  });
}
function parseTarget(block) {
  const name = nameFrom(block.header);
  return targetNode({
    id: idFrom(block.header, `target_${name}`),
    name,
    target: {
      language: readWord('language', block.body) ?? name,
      packageName: readWord('package', block.body),
      emitPath: readWord('emitPath', block.body),
      moduleFormat: readWord('moduleFormat', block.body)
    }
  });
}
function readList(label, body) { const line = new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]; return line ? line.split(',').map((item) => item.trim()).filter(Boolean) : undefined; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readWord(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\s,]+)', 'm').exec(body)?.[1]?.trim(); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readAdapters(body) {
  const adapters = [];
  const re = /^\s*adapter\s+([A-Za-z][\w-]*)\s+symbol\s+([^\s]+)([^\n]*)$/gm;
  let match;
  while ((match = re.exec(body))) {
    const rest = match[3] ?? '';
    adapters.push({
      target: {
        language: match[1],
        platform: readInlineWord('platform', rest),
        framework: readInlineWord('framework', rest),
        packageName: readInlineWord('package', rest) ?? readInlineWord('packageName', rest),
        adapterPackage: readInlineWord('adapterPackage', rest)
      },
      symbol: match[2],
      kind: readInlineWord('kind', rest),
      packageName: readInlineWord('package', rest) ?? readInlineWord('packageName', rest),
      importPath: readInlineWord('import', rest) ?? readInlineWord('importPath', rest),
      requires: readInlineWord('requires', rest)?.split('|').map((item) => item.trim()).filter(Boolean)
    });
  }
  return adapters.length ? adapters : undefined;
}
function readUnsupportedTargets(body) {
  const unsupported = [];
  const re = /^\s*unsupported\s+([A-Za-z][\w-]*)([^\n]*)$/gm;
  let match;
  while ((match = re.exec(body))) {
    const rest = match[2] ?? '';
    unsupported.push({
      target: { language: match[1], platform: readInlineWord('platform', rest), framework: readInlineWord('framework', rest) },
      reason: readInlineQuoted('reason', rest) ?? (rest.trim() || 'Unsupported by this target.')
    });
  }
  return unsupported.length ? unsupported : undefined;
}
function readChangeRecords(body) {
  const changes = [];
  const re = /^\s*change\s+([A-Za-z][\w-]*)(?:\s+([^\n]+))?/gm;
  let match;
  while ((match = re.exec(body))) {
    const statement = match[2]?.trim();
    changes.push({ id: `change_${changes.length}`, kind: match[1], ...(statement ? { statement, target: statement.split(/\s+/)[0] } : {}) });
  }
  return changes;
}
function parseMerge(text) {
  const kind = /merge\s+([A-Za-z][\w-]*)/.exec(text)?.[1];
  if (!kind) return undefined;
  const law = /law\s+([A-Za-z][\w-]*)/.exec(text)?.[1];
  const laws = /laws\s+([A-Za-z][\w-]*(?:\s*,\s*[A-Za-z][\w-]*)*)/.exec(text)?.[1]?.split(',').map((item) => item.trim()).filter(Boolean);
  const latticeId = /lattice\s+([A-Za-z_$][\w$-]*)/.exec(text)?.[1];
  return { kind, law, laws, latticeId };
}
function parseSemantic(text) {
  const crdtType = /crdt\s+([A-Za-z][\w-]*)/.exec(text)?.[1];
  const latticeId = /lattice\s+([A-Za-z_$][\w$-]*)/.exec(text)?.[1];
  if (crdtType) return { kind: 'crdt', latticeId, crdt: { type: crdtType } };
  if (latticeId) return { kind: 'lattice', latticeId };
  return undefined;
}
function parseOptionalTypeExpression(value) { return value ? parseTypeExpression(value.trim()) : undefined; }
function parseTypeExpression(value) {
  const text = value.trim();
  if (/^Set<.+>$/.test(text)) return { kind: 'set', item: parseTypeExpression(text.slice(4, -1)) };
  if (/^List<.+>$/.test(text)) return { kind: 'list', item: parseTypeExpression(text.slice(5, -1)) };
  const map = /^Map<(.+),\s*(.+)>$/.exec(text);
  if (map) return { kind: 'map', key: parseTypeExpression(map[1]), value: parseTypeExpression(map[2]) };
  return text;
}
function readTypeParameters(header) {
  return /<([^>]+)>/.exec(header)?.[1]?.split(',').map((item) => item.trim()).filter(Boolean);
}
function readTypeFields(body) {
  const fields = [];
  const re = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?\s*:\s*([^\n]+)/gm;
  let match;
  while ((match = re.exec(body))) {
    fields.push({ id: match[2] ?? `type_field_${match[1]}`, name: match[1], type: parseTypeExpression(match[3].trim()) });
  }
  return fields.length ? fields : undefined;
}
function readVariants(body) {
  const variants = [];
  const re = /^\s*variant\s+([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?/gm;
  let match;
  while ((match = re.exec(body))) variants.push({ id: match[2], name: match[1] });
  return variants.length ? variants : undefined;
}
