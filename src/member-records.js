import { entityNode, stateNode } from '@shapeshift-labs/frontier-lang-kernel';
import { parseTypeExpression } from './type-expressions.js';

export function parseEntityBlock(block, idFrom, nameFrom) {
  const name = nameFrom(block.header);
  const fields = [], seen = identitySets();
  const fieldRe = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?\s*:\s*([^@{\n]+)([^\n{]*)(?:\{([^}]*)\})?/gm;
  let m;
  while ((m = fieldRe.exec(block.body))) {
    const mergeText = (m[4] ?? '') + ' ' + (m[5] ?? '');
    appendUnique(fields, seen, {
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

export function parseStateBlock(block, idFrom, nameFrom) {
  const name = nameFrom(block.header);
  const collections = [], seen = identitySets();
  const re = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?\s*:\s*([^@{\n]+)(?:\{([^}]*)\})?/gm;
  let m;
  while ((m = re.exec(block.body))) {
    appendUnique(collections, seen, {
      id: m[2] ?? `collection_${name}_${m[1]}`,
      name: m[1],
      type: parseTypeExpression(m[3].trim()),
      merge: parseMerge(m[4] ?? ''),
      semantic: parseSemantic(m[4] ?? '')
    });
  }
  return stateNode({ id: idFrom(block.header, `state_${name}`), name, collections });
}

export function readTypeFields(body) {
  const fields = [], seen = identitySets();
  const re = /^\s*([A-Za-z_$][\w$]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?\s*:\s*([^\n]+)/gm;
  let match;
  while ((match = re.exec(body))) {
    appendUnique(fields, seen, { id: match[2] ?? `type_field_${match[1]}`, name: match[1], type: parseTypeExpression(match[3].trim()) });
  }
  return fields.length ? fields : undefined;
}

function identitySets() {
  return { names: new Set(), ids: new Set() };
}

function appendUnique(records, seen, record) {
  if (seen.names.has(record.name) || seen.ids.has(record.id)) return;
  seen.names.add(record.name); seen.ids.add(record.id); records.push(record);
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
