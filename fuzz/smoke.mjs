import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

for (let index = 0; index < 100; index += 1) {
  const source = `module Fuzz${index} @id("mod_${index}") {
type Input${index} @id("type_input_${index}") {
  title: Text
  tags: Set<Text>
}
lattice TagSet${index} @id("lat_${index}") {
  carrier Set<Text>
  laws semilattice, commutative
}
entity Todo${index} @id("ent_${index}") {
  title @id("field_title_${index}"): Text { merge conflict }
  tags @id("field_tags_${index}"): Set<Text> { merge union lattice lat_${index} crdt or-set }
}
action Add${index} @id("action_${index}") {
  input Input${index}
  returns Patch
}
}`;
  const document = parseFrontierSource(source);
  assert.equal(document.nodes[`type_input_${index}`].kind, 'type');
  assert.equal(document.nodes[`lat_${index}`].kind, 'lattice');
  assert.equal(document.nodes[`ent_${index}`].fields[1].merge.latticeId, `lat_${index}`);
}
