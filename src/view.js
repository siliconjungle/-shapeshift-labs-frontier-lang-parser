import { viewNode } from '@shapeshift-labs/frontier-lang-kernel';

export function parseViewBlock(block) {
  const name = nameFrom(block.header);
  const topLevelBody = stripNestedBlocks('render', block.body);
  const props = readViewProps(topLevelBody);
  const events = readViewEvents(topLevelBody);
  const renders = readRenderNodes(block.body);
  return viewNode({
    id: idFrom(block.header, `view_${name}`),
    name,
    reads: readList('reads', topLevelBody),
    dispatches: readList('dispatches', topLevelBody) ?? readList('dispatch', topLevelBody),
    props: props.length ? props : undefined,
    events: events.length ? events : undefined,
    renders: renders.length ? renders : undefined
  });
}

function readViewProps(body) {
  const props = [];
  const re = /^\s*prop\s+([A-Za-z_$][\w$.-]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?\s*:\s*([^\n]+)$/gm;
  let match;
  while ((match = re.exec(body))) props.push({ id: match[2] ?? `view_prop_${match[1]}`, name: match[1], type: parseTypeExpression(match[3].replace(/\s+optional\s*$/, '').trim()), optional: /\soptional\s*$/.test(match[3]) || undefined });
  return props;
}

function readViewEvents(body) {
  const events = [];
  const re = /^\s*event\s+([A-Za-z_$][\w$.-]*)(?:\s+@id\(\s*["']([^"']+)["']\s*\))?([^\n]*)$/gm;
  let match;
  while ((match = re.exec(body))) events.push({ id: match[2] ?? `view_event_${match[1]}`, name: match[1], action: readInlineWord('action', match[3]), input: parseOptionalTypeExpression(readInlineWord('input', match[3])) });
  return events;
}

function readRenderNodes(body) {
  const renders = [];
  for (const block of readNestedBlocks('render', body)) pushRenderNode(block, renders);
  return renders;
}

function pushRenderNode(block, renders) {
  const headerName = nameFrom(block.header);
  const ownBody = stripNestedBlocks('render', block.body);
  const kind = readInlineWord('kind', block.header) ?? readLine('kind', ownBody) ?? 'element';
  const props = readRenderProps(ownBody);
  const events = readRenderEvents(ownBody);
  const childBlocks = readNestedBlocks('render', block.body);
  const explicitChildren = readList('children', ownBody) ?? readList('child', ownBody);
  const nestedChildren = childBlocks.map((child) => idFrom(child.header, `render_${nameFrom(child.header)}`));
  renders.push(compactRecord({
    id: idFrom(block.header, `render_${headerName}`),
    kind,
    tagName: readLine('tag', ownBody) ?? readLine('tagName', ownBody) ?? (kind === 'component' || kind === 'text' ? undefined : headerName),
    component: readLine('component', ownBody) ?? (kind === 'component' ? headerName : undefined),
    identityKey: readLine('identity', ownBody) ?? readLine('key', ownBody),
    text: readQuotedLine('text', ownBody),
    props: props.length ? props : undefined,
    events: events.length ? events : undefined,
    children: uniqueStrings([...(explicitChildren ?? []), ...nestedChildren])
  }));
  for (const child of childBlocks) pushRenderNode(child, renders);
}

function readRenderProps(body) {
  const props = [];
  const re = /^\s*prop\s+([A-Za-z_$][\w$.-]*)\s+([^\n]+)$/gm;
  let match;
  while ((match = re.exec(body))) props.push({ name: match[1], ...readRenderValue(match[2]) });
  return props;
}

function readRenderEvents(body) {
  const events = [];
  const re = /^\s*on\s+([A-Za-z_$][\w$.-]*)\s+([A-Za-z_$][\w$.-]*)/gm;
  let match;
  while ((match = re.exec(body))) events.push({ name: match[1], action: match[2] });
  return events;
}

function readNestedBlocks(kind, source) {
  const blocks = [];
  const header = new RegExp('\\b' + kind + '\\s+([^{}]+)\\{', 'g');
  let match;
  while ((match = header.exec(source))) {
    let depth = 1; let index = header.lastIndex;
    while (index < source.length && depth > 0) { const ch = source[index++]; if (ch === '{') depth++; if (ch === '}') depth--; }
    blocks.push({ kind, header: match[1].trim(), body: source.slice(header.lastIndex, index - 1), start: match.index, end: index });
    header.lastIndex = index;
  }
  return blocks;
}

function stripNestedBlocks(kind, source) {
  let text = source;
  for (const block of readNestedBlocks(kind, source).reverse()) text = text.slice(0, block.start) + text.slice(block.end);
  return text;
}

function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Unnamed'; }
function readList(label, body) { const line = new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]; return line ? line.split(',').map((item) => item.trim()).filter(Boolean) : undefined; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readQuotedLine(label, body) { return new RegExp(`^\\s*${label}\\s+["']([^"']+)["']`, 'm').exec(body)?.[1]; }
function readInlineWord(label, text = '') { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readRenderValue(value) { const quoted = /^["']([^"']+)["']$/.exec(value.trim()); return quoted ? { value: quoted[1] } : { expression: value.trim() }; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueStrings(values) { const result = []; for (const value of values) if (value && !result.includes(value)) result.push(value); return result.length ? result : undefined; }
function parseOptionalTypeExpression(value) { return value ? parseTypeExpression(value.trim()) : undefined; }
function parseTypeExpression(value) {
  const text = value.trim();
  if (/^Set<.+>$/.test(text)) return { kind: 'set', item: parseTypeExpression(text.slice(4, -1)) };
  if (/^List<.+>$/.test(text)) return { kind: 'list', item: parseTypeExpression(text.slice(5, -1)) };
  const map = /^Map<(.+),\s*(.+)>$/.exec(text);
  if (map) return { kind: 'map', key: parseTypeExpression(map[1]), value: parseTypeExpression(map[2]) };
  return text;
}
