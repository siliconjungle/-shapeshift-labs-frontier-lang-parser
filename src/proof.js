const CONTRACT_GROUPS = {
  contract: 'contracts',
  refinement: 'refinements',
  invariant: 'invariants',
  termination: 'termination',
  temporal: 'temporal'
};

export function parseProofBlock(block) {
  const name = nameFrom(block.header);
  const proof = {
    id: idFrom(block.header, `proof_${name}`),
    contracts: [],
    refinements: [],
    invariants: [],
    termination: [],
    temporal: [],
    obligations: [],
    artifacts: [],
    assumptions: [],
    metadata: { name }
  };
  for (const authoredLine of readAuthoredLines(block)) {
    const line = authoredLine.text;
    if (!line || line.startsWith('#')) continue;
    const match = /^(contract|refinement|invariant|termination|temporal|obligation|proofObligation|artifact|assumption)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, section, recordName, rest] = match;
    const group = CONTRACT_GROUPS[section];
    if (group) proof[group].push(parseProofContract(section, recordName, rest, authoredLine));
    if (section === 'obligation' || section === 'proofObligation') proof.obligations.push(parseProofObligation(recordName, rest, section, authoredLine));
    if (section === 'artifact') proof.artifacts.push(parseProofArtifact(recordName, rest, authoredLine));
    if (section === 'assumption') proof.assumptions.push(parseProofAssumption(recordName, rest, authoredLine));
  }
  return omitEmptyArrays(proof);
}

function parseProofContract(section, name, text, authoredLine = {}) {
  return cleanRecord({
    id: idFrom(text, `proof_${section}_${name}`),
    kind: readInlineWord('kind', text) ?? section,
    subjectKind: readInlineWord('subjectKind', text),
    subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text),
    expression: readInlineQuoted('expression', text),
    statement: readInlineQuoted('statement', text),
    language: readInlineWord('language', text),
    sourceMapId: readInlineWord('sourceMap', text) ?? readInlineWord('sourceMapId', text),
    sourceMapMappingId: readInlineWord('sourceMapMapping', text) ?? readInlineWord('sourceMapMappingId', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    lossIds: readInlineList(text, 'loss', 'lossIds'),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: { name }
  });
}

function parseProofObligation(name, text, authoredKind = 'obligation', authoredLine = {}) {
  return cleanRecord({
    id: idFrom(text, `proof_obligation_${name}`),
    kind: readInlineWord('kind', text),
    status: readInlineWord('status', text),
    subjectKind: readInlineWord('subjectKind', text),
    subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text),
    expression: readInlineQuoted('expression', text),
    statement: readInlineQuoted('statement', text),
    contractIds: readInlineList(text, 'contract', 'contracts', 'contractIds'),
    assumptionIds: readInlineList(text, 'assumption', 'assumptions', 'assumptionIds'),
    artifactIds: readInlineList(text, 'artifact', 'artifacts', 'artifactIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    lossIds: readInlineList(text, 'loss', 'lossIds'),
    solver: readInlineWord('solver', text),
    staleAgainstHash: readInlineWord('staleAgainstHash', text),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: cleanRecord({ name, authoredKind: authoredKind === 'obligation' ? undefined : authoredKind })
  });
}

function parseProofArtifact(name, text, authoredLine = {}) {
  return cleanRecord({
    id: idFrom(text, `proof_artifact_${name}`),
    kind: readInlineWord('kind', text),
    status: readInlineWord('status', text),
    path: readInlineWord('path', text),
    hash: readInlineWord('hash', text),
    command: readInlineQuoted('command', text),
    prover: readInlineWord('prover', text),
    obligationIds: readInlineList(text, 'obligation', 'obligations', 'obligationIds'),
    assumptionIds: readInlineList(text, 'assumption', 'assumptions', 'assumptionIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    summary: readInlineQuoted('summary', text),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: { name }
  });
}

function parseProofAssumption(name, text, authoredLine = {}) {
  return cleanRecord({
    id: idFrom(text, `proof_assumption_${name}`),
    scope: readInlineWord('scope', text),
    subjectKind: readInlineWord('subjectKind', text),
    subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text),
    description: readInlineQuoted('description', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    sourceSpan: authoredLine.sourceSpan,
    authoredSourceSpan: authoredLine.sourceSpan,
    metadata: { name }
  });
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Proof'; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function readAuthoredLines(block) {
  const lines = block.body.split('\n');
  const records = [];
  let lineStart = block.syntax?.bodyStartOffset ?? 0;
  for (const rawLine of lines) {
    const rawEnd = lineStart + rawLine.length;
    const leading = /^\s*/.exec(rawLine)?.[0].length ?? 0;
    const trailing = /\s*$/.exec(rawLine)?.[0].length ?? 0;
    const startOffset = lineStart + leading;
    const endOffset = Math.max(startOffset, rawEnd - trailing);
    records.push({
      text: rawLine.trim(),
      sourceSpan: typeof block.sourceSpan === 'function' ? block.sourceSpan(startOffset, endOffset) : undefined
    });
    lineStart = rawEnd + 1;
  }
  return records;
}
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
function omitEmptyArrays(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => !Array.isArray(value) || value.length > 0));
}
