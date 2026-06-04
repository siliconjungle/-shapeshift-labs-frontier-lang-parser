import { actionNode, createDocument, effectNode, entityNode, stateNode } from '@shapeshift-labs/frontier-lang-kernel';

export function parseFrontierSource(source, options = {}) {
  const nodes = [];
  const documentId = options.id ?? readId(source) ?? 'mod_frontier';
  const documentName = options.name ?? readName(source) ?? 'FrontierModule';
  for (const block of readBlocks(source)) {
    if (block.kind === 'entity') nodes.push(parseEntity(block));
    if (block.kind === 'state') nodes.push(parseState(block));
    if (block.kind === 'action') nodes.push(parseAction(block));
    if (block.kind === 'effect') nodes.push(parseEffect(block));
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
  const header = /\b(entity|state|action|effect)\s+([^{}]+)\{/g;
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
    fields.push({ id: m[2] ?? `field_${name}_${m[1]}`, name: m[1], type: m[3].trim(), key: /@key/.test(m[4] ?? ''), merge: parseMerge(mergeText) });
  }
  return entityNode({ id: idFrom(block.header, `ent_${name}`), name, fields });
}
function parseState(block) {
  const name = nameFrom(block.header);
  const collections = [];
  const re = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?\s*:\s*([^@{\n]+)(?:\{([^}]*)\})?/gm;
  let m;
  while ((m = re.exec(block.body))) collections.push({ id: m[2] ?? `collection_${name}_${m[1]}`, name: m[1], type: m[3].trim(), merge: parseMerge(m[4] ?? '') });
  return stateNode({ id: idFrom(block.header, `state_${name}`), name, collections });
}
function parseAction(block) {
  const name = nameFrom(block.header);
  return actionNode({ id: idFrom(block.header, `action_${name}`), name, input: /input\s*:\s*([^\n]+)/.exec(block.body)?.[1]?.trim(), returns: /returns\s+([^\n]+)/.exec(block.body)?.[1]?.trim(), reads: readList('reads', block.body), writes: readList('writes', block.body), uses: readList('uses', block.body) });
}
function parseEffect(block) {
  const name = nameFrom(block.header);
  return effectNode({ id: idFrom(block.header, `effect_${name}`), name, capability: /capability\s+([^\n]+)/.exec(block.body)?.[1]?.trim() ?? name, resources: readList('resources', block.body) });
}
function readList(label, body) { const line = new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]; return line ? line.split(',').map((item) => item.trim()).filter(Boolean) : undefined; }
function parseMerge(text) { const kind = /merge\s+([A-Za-z][\w-]*)/.exec(text)?.[1]; if (!kind) return undefined; const law = /law\s+([A-Za-z][\w-]*)/.exec(text)?.[1]; return { kind, law }; }
