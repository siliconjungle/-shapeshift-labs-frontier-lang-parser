import { readFileSync } from 'node:fs';
import { parseFrontierFile } from '../dist/index.js';
console.log(parseFrontierFile('todo.frontier', readFileSync(new URL('./todo.frontier', import.meta.url), 'utf8')));
