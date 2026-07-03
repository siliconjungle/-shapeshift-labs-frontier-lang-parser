import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const document = parseFrontierSource(`
module FrontierTypeParameterConstraintProbe @id("mod_frontier_type_parameter_constraint_probe")

type Box<T extends Json = Json> @id("type_box") {
  value @id("field_value"): T
}

type Pair<K: Text, V extends Result<Text, Json> = Result<Text, Json>> @id("type_pair") {
  key @id("field_key"): K
  value @id("field_pair_value"): V
}
`);

assert.deepEqual(document.nodes.type_box.parameters, ['T']);
assert.deepEqual(document.nodes.type_box.typeParameters, [
  { name: 'T', constraint: 'Json', default: 'Json' }
]);
assert.deepEqual(document.nodes.type_pair.parameters, ['K', 'V']);
assert.deepEqual(document.nodes.type_pair.typeParameters, [
  { name: 'K', constraint: 'Text' },
  {
    name: 'V',
    constraint: { kind: 'ref', name: 'Result', args: ['Text', 'Json'] },
    default: { kind: 'ref', name: 'Result', args: ['Text', 'Json'] }
  }
]);
