export function parseConstraintSpaceBlock(block) {
  const name = nameFrom(block.header);
  const space = {
    id: idFrom(block.header, `constraint_space_${name}`),
    name,
    targets: [],
    variables: [],
    constraints: [],
    preferences: [],
    collapseStrategies: [],
    admissions: [],
    metadata: { name }
  };
  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const target = /^target\s+([^\s,]+)/.exec(line)?.[1];
    const subject = /^subject\s+([^\s,]+)/.exec(line)?.[1];
    const scope = /^scope\s+([^\s,]+)/.exec(line)?.[1];
    const record = /^(variable|var|constraint|hard|soft|preference|prefer|collapse|admission)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (target) space.targets.push(target);
    else if (subject) space.subjectId = subject;
    else if (scope) space.scopeId = scope;
    else if (record) addConstraintSpaceRecord(space, record[1], record[2], record[3]);
  }
  return cleanRecord({
    ...space,
    targets: unique(space.targets),
    summary: {
      variableCount: space.variables.length,
      constraintCount: space.constraints.length,
      preferenceCount: space.preferences.length,
      collapseStrategyCount: space.collapseStrategies.length,
      admissionCount: space.admissions.length
    }
  });
}

function addConstraintSpaceRecord(space, section, name, text) {
  if (section === 'variable' || section === 'var') space.variables.push(parseVariable(name, text));
  else if (section === 'constraint' || section === 'hard' || section === 'soft') space.constraints.push(parseConstraint(name, text, section));
  else if (section === 'preference' || section === 'prefer') space.preferences.push(parsePreference(name, text));
  else if (section === 'collapse') space.collapseStrategies.push(parseCollapseStrategy(name, text));
  else if (section === 'admission') space.admissions.push(parseAdmission(name, text));
}

function parseVariable(name, text) {
  return cleanRecord({
    id: idFrom(text, `constraint_space_variable_${name}`),
    name,
    kind: readInlineWord('kind', text),
    domain: readInlineList(text, 'domain', 'choices', 'values'),
    default: readInlineWord('default', text),
    subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text),
    sourceId: readInlineWord('source', text) ?? readInlineWord('sourceId', text),
    target: readInlineWord('target', text),
    preserve: readInlineList(text, 'preserve', 'preserves'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    metadata: { name }
  });
}

function parseConstraint(name, text, section) {
  return cleanRecord({
    id: idFrom(text, `constraint_space_constraint_${name}`),
    name,
    kind: readInlineWord('kind', text),
    strength: readInlineWord('strength', text) ?? (section === 'hard' ? 'hard' : section === 'soft' ? 'soft' : undefined),
    family: readInlineWord('family', text),
    subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text),
    variableIds: readInlineList(text, 'variable', 'variables', 'variableIds'),
    target: readInlineWord('target', text),
    predicate: readInlineQuoted('predicate', text) ?? readInlineWord('predicate', text),
    requires: readInlineList(text, 'requires', 'required', 'require'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    proofObligationIds: readInlineList(text, 'proofObligation', 'proofObligations', 'proofObligationIds'),
    conflictKeys: readInlineList(text, 'conflictKey', 'conflictKeys'),
    failClosed: readInlineFlag('failClosed', text),
    metadata: { name }
  });
}

function parsePreference(name, text) {
  return cleanRecord({
    id: idFrom(text, `constraint_space_preference_${name}`),
    name,
    kind: readInlineWord('kind', text),
    weight: readNumber(readInlineWord('weight', text)),
    subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text),
    variableIds: readInlineList(text, 'variable', 'variables', 'variableIds'),
    target: readInlineWord('target', text),
    prefer: readInlineList(text, 'prefer', 'prefers'),
    reason: readInlineQuoted('reason', text) ?? readInlineWord('reason', text),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    metadata: { name }
  });
}

function parseCollapseStrategy(name, text) {
  return cleanRecord({
    id: idFrom(text, `constraint_space_collapse_${name}`),
    name,
    strategy: readInlineWord('strategy', text) ?? readInlineWord('kind', text),
    target: readInlineWord('target', text),
    variableIds: readInlineList(text, 'variable', 'variables', 'variableIds'),
    requires: readInlineList(text, 'requires', 'required', 'require'),
    produces: readInlineList(text, 'produces', 'produce', 'outputs', 'output'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    admissionIds: readInlineList(text, 'admission', 'admissions', 'admissionIds'),
    status: readInlineWord('status', text),
    metadata: { name }
  });
}

function parseAdmission(name, text) {
  return cleanRecord({
    id: idFrom(text, `constraint_space_admission_${name}`),
    name,
    kind: readInlineWord('kind', text),
    status: readInlineWord('status', text),
    subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text),
    target: readInlineWord('target', text),
    requires: readInlineList(text, 'requires', 'required', 'require'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceIds'),
    decision: readInlineWord('decision', text),
    reason: readInlineQuoted('reason', text) ?? readInlineWord('reason', text),
    failClosed: readInlineFlag('failClosed', text),
    metadata: { name }
  });
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'ConstraintSpace'; }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineFlag(label, text) { return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(text) || undefined; }
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function readNumber(value) {
  if (value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }
