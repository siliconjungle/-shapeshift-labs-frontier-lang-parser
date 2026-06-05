import { performance } from 'node:perf_hooks';
import { parseFrontierSource } from '../dist/index.js';

const blocks = Array.from({ length: 100 }, (_, index) => `entity Todo${index} @id("ent_${index}") {
  title @id("field_title_${index}"): Text { merge conflict }
  tags @id("field_tags_${index}"): Set<Text> { merge union law semilattice }
}`).join('\n');
const source = `module Bench @id("mod_bench") {\n${blocks}\n}`;
const start = performance.now();
let document;
for (let index = 0; index < 250; index += 1) document = parseFrontierSource(source);
const durationMs = performance.now() - start;
console.log(JSON.stringify({ parses: 250, nodes: Object.keys(document.nodes).length, durationMs: Math.round(durationMs * 100) / 100 }, null, 2));
