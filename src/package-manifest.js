import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

export function parsePackageManifestBlock(block) {
  const name = nameFrom(block.header);
  const sourcePath = readLine('sourcePath', block.body) ?? readLine('path', block.body) ?? 'package.json';
  const sourceHash = readLine('sourceHash', block.body);
  const evidence = parseEvidenceRows(block.body);
  const records = [];
  const proofGaps = [];
  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || isPropertyLine(line)) continue;
    const match = /^(metadata|dependency|script|export|gap|proofGap)\s+([A-Za-z_$.*@/][\w$./@*-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, rest] = match;
    if (rowKind === 'gap' || rowKind === 'proofGap') {
      proofGaps.push(packageProofGap(rowName, rest));
      continue;
    }
    const record = packageRecord(rowKind, rowName, rest, { sourcePath, sourceHash, evidence });
    if (record) records.push(record);
  }
  const recordGaps = records.flatMap((record) => record.proofGaps ?? []);
  const allGaps = [...recordGaps, ...proofGaps];
  const tree = {
    kind: 'frontier.lang.packageManifestSemanticTree',
    version: 1,
    id: idFrom(block.header, `package_manifest_${name}`),
    name,
    sourcePath,
    sourceHash,
    packageManager: readLine('packageManager', block.body),
    records,
    proofGaps: allGaps,
    evidence,
    parser: { status: 'authored', errors: [] },
    claims: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      packageInstallEquivalenceClaim: false,
      installEquivalenceClaim: false,
      runtimeEquivalenceClaim: false
    },
    metadata: { authoredName: name }
  };
  tree.summary = summarizePackageManifest(tree);
  tree.treeHash = hashSemanticValue({ kind: 'frontier.lang.package.authoredTree.v1', records: records.map(hashableRecord), proofGaps: allGaps.map((gap) => gap.code) });
  return tree;
}

function packageRecord(kind, name, text, context) {
  const section = readInlineWord('section', text) ?? defaultSection(kind);
  const recordName = readInlineWord('name', text) ?? name;
  const value = packageValue(kind, text);
  const proofGaps = readInlineList(text, 'proofGap', 'proofGaps', 'gap', 'gaps')?.map((code) => packageProofGap(code, '')) ?? [];
  return cleanRecord({
    kind,
    id: idFrom(text, `package_${kind}_${safeId(section)}_${safeId(recordName)}`),
    section,
    name: recordName,
    value,
    valueHash: hashSemanticValue({ kind: 'frontier.lang.package.authoredRecordValue.v1', value }),
    identityKey: readInlineWord('identity', text) ?? readInlineWord('identityKey', text) ?? `${kind}:${section}:${recordName}`,
    sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text) ?? context.sourcePath,
    sourceHash: readInlineWord('sourceHash', text) ?? context.sourceHash,
    sourceSpan: parseSpan(readInlineWord('sourceSpan', text)),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    proofGaps
  });
}

function packageValue(kind, text) {
  if (kind === 'dependency') return readInlineQuoted('value', text) ?? readInlineWord('range', text) ?? readInlineWord('value', text) ?? '*';
  if (kind === 'script') return readInlineQuoted('command', text) ?? readInlineQuoted('value', text) ?? readInlineWord('command', text) ?? readInlineWord('value', text);
  if (kind === 'export') return readInlineQuoted('target', text) ?? readInlineQuoted('value', text) ?? readInlineWord('target', text) ?? readInlineWord('value', text);
  return readInlineQuoted('value', text) ?? readInlineWord('value', text);
}

function defaultSection(kind) {
  if (kind === 'dependency') return 'dependencies';
  if (kind === 'script') return 'scripts';
  if (kind === 'export') return 'exports';
  return 'metadata';
}

function packageProofGap(name, text) {
  const code = readInlineWord('code', text) ?? name;
  return cleanRecord({
    id: idFrom(text, `package_gap_${safeId(code)}`),
    code,
    status: readInlineWord('status', text) ?? 'not-claimed',
    summary: readInlineQuoted('summary', text) ?? readInlineQuoted('message', text),
    failClosed: true,
    semanticEquivalenceClaim: false,
    packageInstallEquivalenceClaim: false,
    installEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    sourceSpan: parseSpan(readInlineWord('sourceSpan', text))
  });
}

function parseEvidenceRows(body) {
  const records = [];
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    const match = /^(?:evidence|proofEvidence)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    records.push(cleanRecord({
      id: idFrom(match[2], `evidence_${match[1]}`),
      kind: readInlineWord('kind', match[2]) ?? 'note',
      status: readInlineWord('status', match[2]) ?? 'unknown',
      path: readInlineWord('path', match[2]),
      summary: readInlineQuoted('summary', match[2]),
      metadata: { name: match[1] }
    }));
  }
  return records;
}

function summarizePackageManifest(tree) {
  return {
    metadata: tree.records.filter((record) => record.kind === 'metadata').length,
    dependencies: tree.records.filter((record) => record.kind === 'dependency').length,
    scripts: tree.records.filter((record) => record.kind === 'script').length,
    exports: tree.records.filter((record) => record.kind === 'export').length,
    proofGaps: tree.proofGaps.length,
    parseErrors: tree.parser.errors.length
  };
}

function hashableRecord(record) {
  return { kind: record.kind, section: record.section, name: record.name, value: record.value, proofGaps: record.proofGaps?.map((gap) => gap.code) };
}

function isPropertyLine(line) {
  return /^(sourcePath|path|sourceHash|packageManager|evidence|proofEvidence)\s+/.test(line);
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$-]*)/.exec(header)?.[1] ?? 'PackageManifest'; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
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
