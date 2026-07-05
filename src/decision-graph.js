import {
  createDecisionGraphAdmissionDecisionRecord,
  createDecisionGraphCandidateDecisionRecord,
  createDecisionGraphChunkRecord,
  createDecisionGraphEvidenceRecord,
  createDecisionGraphGateRecord,
  createDecisionGraphGraphRecord,
  createDecisionGraphImprovementFeedbackRecord,
  createDecisionGraphMergeDecisionRecord,
  createDecisionGraphPanelProjectionRecord,
  createDecisionGraphPatchEventRecord,
  createDecisionGraphReplayRecord,
  createDecisionGraphRsiLoopRecord,
  createDecisionGraphSemanticChangeRecord,
  createDecisionGraphTournamentCandidateRecord,
  createDecisionGraphTournamentRecord
} from '@shapeshift-labs/frontier-lang-kernel';

const RECORD_FIELDS = Object.freeze({
  gate: 'gateIds',
  evidence: 'evidenceIds',
  semanticChange: 'semanticChangeIds',
  patchEvent: 'patchEventIds',
  admissionDecision: 'admissionDecisionIds',
  candidateDecision: 'decisionIds',
  mergeDecision: 'decisionIds',
  replay: 'replayRecordIds',
  tournament: 'tournamentRecordIds',
  tournamentCandidate: 'tournamentRecordIds',
  panelProjection: 'panelProjectionIds',
  rsiLoop: 'rsiLoopIds',
  improvementFeedback: 'feedbackIds'
});

export function parseDecisionGraphBlock(block) {
  const name = nameFrom(block.header);
  const graph = {
    id: idFrom(block.header, `decisionGraph_${name}`),
    graphKind: readLine('graphKind', block.body) ?? readLine('kind', block.body) ?? 'semantic-merge-admission',
    scopeId: readLine('scope', block.body) ?? readLine('scopeId', block.body),
    rootId: readLine('root', block.body) ?? readLine('rootId', block.body),
    status: readLine('status', block.body) ?? 'open',
    subjectIds: readListLine('subject', block.body) ?? readListLine('subjects', block.body) ?? [],
    nodes: [],
    edges: [],
    records: [],
    metadata: { name }
  };

  for (const rawLine of block.body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || isGraphPropertyLine(line)) continue;
    const match = /^([A-Za-z_$][\w$-]*)\s+([A-Za-z_$][\w$-]*)(.*)$/.exec(line);
    if (!match) continue;
    const [, rowKind, rowName, rest] = match;
    const normalized = normalizeRowKind(rowKind);
    if (normalized === 'node') graph.nodes.push(parseNode(rowName, rest));
    else if (normalized === 'edge') graph.edges.push(parseEdge(rowName, rest));
    else {
      const record = parseDecisionRecord(normalized, rowName, rest, graph.id);
      if (record) graph.records.push(record);
    }
  }

  const grouped = groupRecords(graph.records);
  const graphRecord = createDecisionGraphGraphRecord({
    id: graph.id,
    graphKind: graph.graphKind,
    scopeId: graph.scopeId,
    rootId: graph.rootId,
    status: graph.status,
    subjectIds: graph.subjectIds,
    recordIds: graph.records.map((record) => record.id),
    nodeIds: graph.nodes.map((node) => node.id),
    edgeIds: graph.edges.map((edge) => edge.id),
    semanticChangeIds: grouped.semanticChangeIds,
    admissionDecisionIds: grouped.admissionDecisionIds,
    decisionIds: grouped.decisionIds,
    gateIds: grouped.gateIds,
    evidenceIds: grouped.evidenceIds,
    replayRecordIds: grouped.replayRecordIds,
    patchEventIds: grouped.patchEventIds,
    tournamentRecordIds: grouped.tournamentRecordIds,
    panelProjectionIds: grouped.panelProjectionIds,
    rsiLoopIds: grouped.rsiLoopIds,
    feedbackIds: grouped.feedbackIds,
    nodes: graph.nodes,
    edges: graph.edges,
    metadata: graph.metadata
  });

  return {
    id: graph.id,
    graph: graphRecord,
    records: graph.records,
    nodes: graph.nodes,
    edges: graph.edges,
    summary: {
      graphCount: 1,
      recordCount: graph.records.length,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      semanticChangeCount: grouped.semanticChangeIds.length,
      gateCount: grouped.gateIds.length,
      evidenceCount: grouped.evidenceIds.length,
      admissionDecisionCount: grouped.admissionDecisionIds.length,
      decisionCount: grouped.decisionIds.length,
      patchEventCount: grouped.patchEventIds.length,
      replayCount: grouped.replayRecordIds.length,
      tournamentCount: grouped.tournamentRecordIds.length,
      panelProjectionCount: grouped.panelProjectionIds.length,
      rsiLoopCount: grouped.rsiLoopIds.length,
      feedbackCount: grouped.feedbackIds.length
    },
    metadata: { name }
  };
}

function parseNode(name, text) {
  return cleanRecord({
    id: idFrom(text, `decision_node_${name}`),
    nodeKind: readInlineWord('nodeKind', text) ?? readInlineWord('kind', text) ?? 'record',
    recordId: readInlineWord('record', text) ?? readInlineWord('recordId', text),
    label: readInlineQuoted('label', text) ?? readInlineWord('label', text) ?? name,
    status: readInlineWord('status', text)
  });
}

function parseEdge(name, text) {
  return cleanRecord({
    id: idFrom(text, `decision_edge_${name}`),
    edgeKind: readInlineWord('edgeKind', text) ?? readInlineWord('kind', text) ?? 'relates-to',
    fromId: readInlineWord('from', text) ?? readInlineWord('fromId', text) ?? readInlineWord('source', text) ?? readInlineWord('sourceId', text),
    toId: readInlineWord('to', text) ?? readInlineWord('toId', text) ?? readInlineWord('target', text) ?? readInlineWord('targetId', text),
    status: readInlineWord('status', text)
  });
}

function parseDecisionRecord(kind, name, text, graphId) {
  const common = commonRecord(name, text, graphId);
  if (kind === 'chunk') return createDecisionGraphChunkRecord({ ...common, chunkKind: readInlineWord('chunkKind', text) ?? readInlineWord('kind', text), sequence: readInlineNumber('sequence', text), recordIds: readInlineList(text, 'record', 'records', 'recordIds') });
  if (kind === 'gate') return createDecisionGraphGateRecord({ ...common, gateKind: readInlineWord('gateKind', text) ?? readInlineWord('kind', text) ?? name, command: readInlineQuoted('command', text) ?? readInlineWord('command', text), required: readInlineFlag('required', text) });
  if (kind === 'evidence') return createDecisionGraphEvidenceRecord({ ...common, evidenceKind: readInlineWord('evidenceKind', text) ?? readInlineWord('kind', text) ?? name, path: readInlineWord('path', text) });
  if (kind === 'semanticChange') return createDecisionGraphSemanticChangeRecord({ ...common, changeKind: readInlineWord('changeKind', text) ?? readInlineWord('kind', text) ?? 'semantic', language: readInlineWord('language', text), sourcePath: readInlineWord('sourcePath', text) ?? readInlineWord('path', text), baseHash: readInlineWord('baseHash', text), targetHash: readInlineWord('targetHash', text), patchIds: readInlineList(text, 'patch', 'patches', 'patchId', 'patchIds'), operationIds: readInlineList(text, 'operation', 'operations', 'operationId', 'operationIds'), semanticNodeIds: readInlineList(text, 'semanticNode', 'semanticNodes', 'semanticNodeId', 'semanticNodeIds'), semanticSymbolIds: readInlineList(text, 'semanticSymbol', 'semanticSymbols', 'symbol', 'symbols', 'semanticSymbolId', 'semanticSymbolIds'), effectIds: readInlineList(text, 'effect', 'effects', 'effectId', 'effectIds'), regions: readInlineList(text, 'region', 'regions'), risk: readInlineWord('risk', text) });
  if (kind === 'patchEvent') return createDecisionGraphPatchEventRecord({ ...common, eventId: readInlineWord('event', text) ?? readInlineWord('eventId', text), patchId: readInlineWord('patch', text) ?? readInlineWord('patchId', text), patchIds: readInlineList(text, 'patch', 'patches', 'patchId', 'patchIds'), actor: readInlineWord('actor', text), at: readInlineWord('at', text), baseHash: readInlineWord('baseHash', text), targetHash: readInlineWord('targetHash', text), operationIds: readInlineList(text, 'operation', 'operations', 'operationId', 'operationIds'), deterministic: readInlineFlag('deterministic', text) });
  if (kind === 'admissionDecision') return createDecisionGraphAdmissionDecisionRecord({ ...common, admissionId: readInlineWord('admission', text) ?? readInlineWord('admissionId', text), candidateId: readInlineWord('candidate', text) ?? readInlineWord('candidateId', text), classification: readInlineWord('classification', text), decision: readInlineWord('decision', text), autoMergeable: readInlineFlag('autoMergeable', text) || readInlineFlag('autoMerge', text), conflictKeys: readInlineList(text, 'conflictKey', 'conflictKeys'), conflictKeyKinds: readInlineList(text, 'conflictKeyKind', 'conflictKeyKinds'), reasons: readInlineList(text, 'reason', 'reasons') });
  if (kind === 'candidateDecision') return createDecisionGraphCandidateDecisionRecord({ ...common, candidateId: readInlineWord('candidate', text) ?? readInlineWord('candidateId', text), decision: readInlineWord('decision', text), score: readInlineNumber('score', text), rank: readInlineNumber('rank', text), reviewerIds: readInlineList(text, 'reviewer', 'reviewers', 'reviewerId', 'reviewerIds'), reasons: readInlineList(text, 'reason', 'reasons') });
  if (kind === 'mergeDecision') return createDecisionGraphMergeDecisionRecord({ ...common, decision: readInlineWord('decision', text), autoMergeable: readInlineFlag('autoMergeable', text) || readInlineFlag('autoMerge', text), baseHash: readInlineWord('baseHash', text), targetHash: readInlineWord('targetHash', text), conflictKeys: readInlineList(text, 'conflictKey', 'conflictKeys'), reasons: readInlineList(text, 'reason', 'reasons'), candidateDecisionIds: readInlineList(text, 'candidateDecision', 'candidateDecisionId', 'candidateDecisionIds') });
  if (kind === 'replay') return createDecisionGraphReplayRecord({ ...common, eventIds: readInlineList(text, 'event', 'events', 'eventId', 'eventIds'), patchIds: readInlineList(text, 'patch', 'patches', 'patchId', 'patchIds'), baseHash: readInlineWord('baseHash', text), finalHash: readInlineWord('finalHash', text), issues: readInlineList(text, 'issue', 'issues'), replayComplete: readInlineFlag('replayComplete', text), deterministic: readInlineFlag('deterministic', text) });
  if (kind === 'tournament') return createDecisionGraphTournamentRecord({ ...common, tournamentId: readInlineWord('tournament', text) ?? readInlineWord('tournamentId', text), tournamentKind: readInlineWord('tournamentKind', text) ?? readInlineWord('kind', text), winnerCandidateId: readInlineWord('winner', text) ?? readInlineWord('winnerCandidateId', text) });
  if (kind === 'tournamentCandidate') return createDecisionGraphTournamentCandidateRecord({ ...common, tournamentId: readInlineWord('tournament', text) ?? readInlineWord('tournamentId', text), candidateId: readInlineWord('candidate', text) ?? readInlineWord('candidateId', text), lane: readInlineWord('lane', text), taskId: readInlineWord('task', text) ?? readInlineWord('taskId', text), agentId: readInlineWord('agent', text) ?? readInlineWord('agentId', text), score: readInlineNumber('score', text), rank: readInlineNumber('rank', text) });
  if (kind === 'panelProjection') return createDecisionGraphPanelProjectionRecord({ ...common, panelId: readInlineWord('panel', text) ?? readInlineWord('panelId', text), projectionKind: readInlineWord('projectionKind', text) ?? readInlineWord('kind', text), mergeDecisionIds: readInlineList(text, 'mergeDecision', 'mergeDecisionId', 'mergeDecisionIds'), fields: readInlineList(text, 'field', 'fields') });
  if (kind === 'rsiLoop') return createDecisionGraphRsiLoopRecord({ ...common, loopId: readInlineWord('loop', text) ?? readInlineWord('loopId', text), loopKind: readInlineWord('loopKind', text) ?? readInlineWord('kind', text), iteration: readInlineNumber('iteration', text), objective: readInlineQuoted('objective', text) ?? readInlineWord('objective', text), action: readInlineWord('action', text), feedbackIds: readInlineList(text, 'feedback', 'feedbackId', 'feedbackIds') });
  if (kind === 'improvementFeedback') return createDecisionGraphImprovementFeedbackRecord({ ...common, loopId: readInlineWord('loop', text) ?? readInlineWord('loopId', text), loopKind: readInlineWord('loopKind', text), feedbackKind: readInlineWord('feedbackKind', text) ?? readInlineWord('kind', text), subjectId: readInlineWord('subject', text) ?? readInlineWord('subjectId', text), severity: readInlineWord('severity', text), action: readInlineWord('action', text), feedback: readInlineQuoted('feedback', text) });
  return undefined;
}

function commonRecord(name, text, graphId) {
  return cleanRecord({
    id: idFrom(text, undefined),
    name,
    graphIds: [graphId],
    status: readInlineWord('status', text),
    subjectIds: readInlineList(text, 'subject', 'subjects', 'subjectId', 'subjectIds'),
    candidateIds: readInlineList(text, 'candidate', 'candidates', 'candidateId', 'candidateIds'),
    semanticMergeCandidateIds: readInlineList(text, 'semanticMergeCandidate', 'semanticMergeCandidates', 'semanticMergeCandidateId', 'semanticMergeCandidateIds'),
    semanticChangeIds: readInlineList(text, 'semanticChange', 'semanticChanges', 'semanticChangeId', 'semanticChangeIds'),
    admissionDecisionIds: readInlineList(text, 'admissionDecision', 'admissionDecisionId', 'admissionDecisionIds'),
    decisionIds: readInlineList(text, 'decisionId', 'decisionIds'),
    gateIds: readInlineList(text, 'gate', 'gates', 'gateId', 'gateIds'),
    evidenceIds: readInlineList(text, 'evidence', 'evidenceId', 'evidenceIds'),
    replayRecordIds: readInlineList(text, 'replay', 'replayId', 'replayRecord', 'replayRecordId', 'replayRecordIds'),
    patchEventIds: readInlineList(text, 'patchEvent', 'patchEventId', 'patchEventIds'),
    tournamentRecordIds: readInlineList(text, 'tournamentRecord', 'tournamentRecordId', 'tournamentRecordIds'),
    rsiLoopIds: readInlineList(text, 'rsiLoop', 'rsiLoopId', 'rsiLoopIds'),
    summary: readInlineQuoted('summary', text),
    metadata: { authoredName: name }
  });
}

function groupRecords(records) {
  const grouped = {
    gateIds: [],
    evidenceIds: [],
    semanticChangeIds: [],
    patchEventIds: [],
    admissionDecisionIds: [],
    decisionIds: [],
    replayRecordIds: [],
    tournamentRecordIds: [],
    panelProjectionIds: [],
    rsiLoopIds: [],
    feedbackIds: []
  };
  for (const record of records) {
    const key = RECORD_FIELDS[recordName(record)];
    if (key && record.id) grouped[key].push(record.id);
  }
  return Object.fromEntries(Object.entries(grouped).map(([key, value]) => [key, unique(value)]));
}

function recordName(record) {
  return String(record?.recordKind ?? record?.kind ?? '').replace('frontier.lang.decisionGraph.', '');
}

function normalizeRowKind(kind) {
  if (kind === 'change') return 'semanticChange';
  if (kind === 'patch') return 'patchEvent';
  if (kind === 'admission') return 'admissionDecision';
  if (kind === 'candidate') return 'candidateDecision';
  if (kind === 'merge') return 'mergeDecision';
  if (kind === 'panel') return 'panelProjection';
  if (kind === 'feedback') return 'improvementFeedback';
  return kind;
}

function isGraphPropertyLine(line) {
  return /^(graphKind|kind|scope|scopeId|root|rootId|status|subject|subjects)\s+/.test(line);
}

function idFrom(text, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'DecisionGraph'; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readListLine(label, body) {
  const line = readLine(label, body);
  return line ? line.split(/[|,]/).map((item) => item.trim()).filter(Boolean) : undefined;
}
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readInlineFlag(label, text) { return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(text) || undefined; }
function readInlineNumber(label, text) {
  const value = readInlineWord(label, text);
  return value === undefined ? undefined : Number(value);
}
function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}
