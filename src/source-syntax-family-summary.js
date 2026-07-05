export function summarizeSourceSyntaxFamilies(blocks) {
  const childEntries = blocks.flatMap((block) => (block.children ?? []).map((child) => ({
    blockFamily: sourceSyntaxBlockFamily(block),
    rowFamily: sourceSyntaxRowFamily(child)
  })));
  const blockFamilies = unique(blocks.map(sourceSyntaxBlockFamily));
  return {
    sourceSyntaxBlockFamilies: blockFamilies,
    sourceSyntaxBlockFamilyCounts: countBy(blocks, sourceSyntaxBlockFamily),
    sourceSyntaxRowFamilies: unique(childEntries.map((entry) => entry.rowFamily)),
    sourceSyntaxRowFamilyCounts: countBy(childEntries, (entry) => entry.rowFamily),
    sourceSyntaxRowFamiliesByBlockFamily: groupUniqueByKnownKeys(blockFamilies, childEntries, (entry) => entry.blockFamily, (entry) => entry.rowFamily),
    sourceSyntaxRowFamilyCountsByBlockFamily: groupCountsByKnownKeys(blockFamilies, childEntries, (entry) => entry.blockFamily, (entry) => entry.rowFamily)
  };
}

function sourceSyntaxBlockFamily(block) {
  return block.kind ?? 'unknown';
}

function sourceSyntaxRowFamily(child) {
  return child.recognized
    ? child.family ?? child.normalizedRowKind ?? child.rowKind ?? child.kind ?? 'unknown'
    : child.rowKind ?? child.normalizedRowKind ?? child.family ?? child.kind ?? 'unknown';
}

function countBy(values, keyFor) {
  const counts = {};
  for (const value of values) {
    const key = keyFor(value);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function groupUniqueByKnownKeys(keys, values, keyFor, valueFor) {
  const groups = Object.fromEntries(keys.map((key) => [key, []]));
  for (const value of values) {
    const key = keyFor(value);
    const item = valueFor(value);
    if (!key || !item) continue;
    groups[key] ??= [];
    if (!groups[key].includes(item)) groups[key].push(item);
  }
  return groups;
}

function groupCountsByKnownKeys(keys, values, keyFor, valueFor) {
  const groups = Object.fromEntries(keys.map((key) => [key, {}]));
  for (const value of values) {
    const key = keyFor(value);
    const item = valueFor(value);
    if (!key || !item) continue;
    groups[key] ??= {};
    groups[key][item] = (groups[key][item] ?? 0) + 1;
  }
  return groups;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
