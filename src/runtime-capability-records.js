export function summarizeRuntimeCapabilities(matrix) {
  return {
    blockCount: matrix.blocks?.length ?? 1,
    hostProfileCount: matrix.hostProfiles.length,
    sourceHostCount: matrix.sourceHosts.length,
    targetHostCount: matrix.targetHosts.length,
    hostCapabilityCount: matrix.hostCapabilities?.length ?? 0,
    hostBindingCount: matrix.hostBindings?.length ?? 0,
    capabilityCount: matrix.hostProfiles.reduce((total, profile) => total + Object.keys(profile.capabilities ?? {}).length, 0),
    runtimeRequirementCount: matrix.runtimeRequirements.length,
    evidenceCount: matrix.evidence.length,
    proofGapCount: matrix.proofGaps.length
  };
}

export function runtimeFalseClaims() {
  return {
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    projectionEquivalenceClaim: false,
    hostCapabilityEquivalenceClaim: false
  };
}

export function runtimeEvidence(name, text) {
  return cleanRecord({
    id: idFrom(text, `runtime_evidence_${safeId(name)}`),
    name,
    kind: readInlineWord('kind', text) ?? 'runtime-adapter-proof',
    status: readInlineWord('status', text) ?? 'unknown',
    capability: readInlineWord('capability', text) ?? readInlineWord('runtimeCapability', text) ?? readInlineWord('runtimeProofCapability', text),
    runtimeCapability: readInlineWord('runtimeCapability', text),
    runtimeProofCapability: readInlineWord('runtimeProofCapability', text),
    sourceHost: readInlineWord('sourceHost', text) ?? readInlineWord('sourceHostId', text),
    targetHost: readInlineWord('targetHost', text) ?? readInlineWord('targetHostId', text),
    adapterRequirementId: readInlineWord('adapterRequirement', text) ?? readInlineWord('adapterRequirementId', text),
    runtimeAdapterRequirementId: readInlineWord('runtimeAdapterRequirement', text) ?? readInlineWord('runtimeAdapterRequirementId', text),
    runtimeProofSignals: readInlineList(text, 'runtimeProofSignal', 'runtimeProofSignals', 'proofSignal', 'proofSignals', 'signal', 'signals'),
    sourceHash: readInlineWord('sourceHash', text),
    targetHash: readInlineWord('targetHash', text),
    outputHash: readInlineWord('outputHash', text),
    command: readInlineQuoted('command', text) ?? readInlineWord('command', text),
    runtimeCommand: readInlineQuoted('runtimeCommand', text) ?? readInlineWord('runtimeCommand', text),
    probeId: readInlineWord('probeId', text) ?? readInlineWord('probe', text),
    telemetryHash: readInlineWord('telemetryHash', text),
    eventTraceHash: readInlineWord('eventTraceHash', text),
    networkTraceHash: readInlineWord('networkTraceHash', text),
    storageSnapshotHash: readInlineWord('storageSnapshotHash', text),
    filesystemTraceHash: readInlineWord('filesystemTraceHash', text),
    processTraceHash: readInlineWord('processTraceHash', text),
    environmentSnapshotHash: readInlineWord('environmentSnapshotHash', text),
    shellPolicyHash: readInlineWord('shellPolicyHash', text) ?? readInlineWord('shellPolicy', text),
    secretScopePolicyHash: readInlineWord('secretScopePolicyHash', text) ?? readInlineWord('secretScopePolicy', text),
    domSnapshotHash: readInlineWord('domSnapshotHash', text),
    computedStyleHash: readInlineWord('computedStyleHash', text),
    layoutSnapshotHash: readInlineWord('layoutSnapshotHash', text),
    accessibilitySnapshotHash: readInlineWord('accessibilitySnapshotHash', text),
    focusTraceHash: readInlineWord('focusTraceHash', text),
    bitmapHash: readInlineWord('bitmapHash', text),
    drawCommandTraceHash: readInlineWord('drawCommandTraceHash', text),
    gpuCommandTraceHash: readInlineWord('gpuCommandTraceHash', text),
    wasmModuleHash: readInlineWord('wasmModuleHash', text),
    sandboxPolicyHash: readInlineWord('sandboxPolicyHash', text),
    workerMessageTraceHash: readInlineWord('workerMessageTraceHash', text),
    deterministicInputHash: readInlineWord('deterministicInputHash', text),
    adapterBindingHash: readInlineWord('adapterBindingHash', text),
    path: readInlineWord('path', text),
    summary: readInlineQuoted('summary', text),
    claims: runtimeFalseClaims()
  });
}

export function runtimeProofGap(name, text) {
  const code = readInlineWord('code', text) ?? name;
  return cleanRecord({
    id: idFrom(text, `runtime_gap_${safeId(code)}`),
    code,
    status: readInlineWord('status', text) ?? 'not-claimed',
    summary: readInlineQuoted('summary', text) ?? readInlineQuoted('message', text),
    failClosed: true,
    ...runtimeFalseClaims()
  });
}

export function isPropertyLine(line) {
  return /^(generatedAt|version|claim|claims)\s+/.test(line);
}

export function idFrom(text, fallback) {
  return /@id\(\s*["']([^"']+)["']\s*\)/.exec(text)?.[1] ?? fallback;
}

export function nameFrom(header) {
  return /^([A-Za-z_$][\w$-]*)/.exec(header)?.[1] ?? 'RuntimeCapabilities';
}

export function readInlineWord(label, text) {
  return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim();
}

export function readInlineQuoted(label, text) {
  return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim();
}

export function readInlineFlag(label, text) {
  return new RegExp('(?:^|\\s)' + label + '(?:\\s|$)').test(text) || undefined;
}

export function readInlineList(text, ...labels) {
  for (const label of labels) {
    const value = new RegExp('(?:^|\\s)' + label + '\\s+([^\\s]+)').exec(text)?.[1]?.trim();
    if (value) return value.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}

export function ids(records = []) {
  return records.map((record) => record?.id).filter(Boolean);
}

export function hostIds(records = []) {
  return records.map((record) => typeof record === 'string' ? record : record?.id).filter(Boolean);
}

export function uniqueRecords(records = []) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record?.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function uniqueHostSelectors(records = []) {
  const seen = new Set();
  return records.filter((record) => {
    const key = typeof record === 'string' ? record : record?.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0) && (!value || typeof value !== 'object' || Object.keys(value).length > 0)));
}

export function safeId(value) {
  return String(value ?? 'unknown').replace(/[^A-Za-z0-9_$-]+/g, '_');
}
