import { actionNode, capabilityNode, createDocument, effectNode, externNode, latticeNode, migrationNode, targetNode, typeNode } from '@shapeshift-labs/frontier-lang-kernel';
import { readActionBodyRecords, stripNestedBlocks } from './action-body.js';
import { parseConstraintSpaceBlock } from './constraint-space.js';
import { parseConversionBlock } from './conversion.js';
import { parseApplicationSurfaceBlock } from './application-surface.js';
import { parseCanvasSurfaceBlock } from './canvas-surface.js';
import { parseDecisionGraphBlock } from './decision-graph.js';
import { parseDialectRegistryBlock } from './dialect-registry.js';
import { parseGateAdmissionEvidenceBlock } from './gate-admission-evidence.js';
import { parseInterlinguaBlock } from './interlingua.js';
import { parseMachineGraphBlock } from './machine-graph.js';
import { createParsedMetadata } from './metadata.js';
import { parseEntityBlock, parseStateBlock, readTypeFields } from './member-records.js';
import { parseSemanticEditRecordsBlock } from './semantic-edit-records.js';
import { parseSemanticOperationsBlock } from './operations.js';
import { parsePackageManifestBlock } from './package-manifest.js';
import { parseParadigmBlock } from './paradigm.js';
import { parseProofBlock } from './proof.js';
import { parseResourceGraphBlock } from './resource-graph.js';
import { parseRuntimeCapabilityBlock } from './runtime-capability.js';
import { parseNativeSourceBlock } from './source-evidence.js';
import { parseTargetProjectionMetadata } from './target-projection.js';
import { parseOptionalTypeExpression, parseTypeExpression } from './type-expressions.js';
import { readTypeParameterNames, readTypeParameterRecords } from './type-parameters.js';
import { readVariantPayloadFields } from './type-variants.js';
import { parseViewBlock } from './view.js';
import { FrontierSourceBlockKinds, readFrontierSourceBlocks } from './source-syntax-report.js';
export { FrontierSourceBlockKinds, inspectFrontierSourceSyntax } from './source-syntax-report.js';

export function parseFrontierSource(source, options = {}) {
  const nodes = [];
  const proofBlocks = [];
  const paradigmBlocks = [];
  const operationBlocks = [];
  const semanticEditBlocks = [];
  const conversionBlocks = [];
  const constraintSpaceBlocks = [];
  const decisionGraphBlocks = [];
  const gateAdmissionEvidenceBlocks = [];
  const dialectRegistryBlocks = [];
  const interlinguaBlocks = [];
  const resourceGraphBlocks = [], machineGraphBlocks = [];
  const nativeSourceBlocks = [];
  const packageManifestBlocks = [];
  const canvasSurfaceBlocks = [];
  const applicationSurfaceBlocks = [];
  const runtimeCapabilityBlocks = [], targetProjectionTargets = [];
  const documentId = options.id ?? readId(source) ?? 'mod_frontier';
  const documentName = options.name ?? readName(source) ?? 'FrontierModule';
  for (const block of readBlocks(source, options)) {
    if (block.kind === 'entity') nodes.push(parseEntity(block));
    if (block.kind === 'state') nodes.push(parseState(block));
    if (block.kind === 'action') nodes.push(parseAction(block));
    if (block.kind === 'view') nodes.push(parseViewBlock(block));
    if (block.kind === 'migration') nodes.push(parseMigration(block));
    if (block.kind === 'capability') nodes.push(parseCapability(block));
    if (block.kind === 'effect') nodes.push(parseEffect(block));
    if (block.kind === 'type') nodes.push(parseType(block));
    if (block.kind === 'extern') nodes.push(parseExtern(block));
    if (block.kind === 'lattice') nodes.push(parseLattice(block));
    if (block.kind === 'nativeSource') {
      const parsed = parseNativeSourceBlock(block);
      nodes.push(parsed.node);
      nativeSourceBlocks.push(parsed);
    }
    if (block.kind === 'target') { const parsed = parseTarget(block); nodes.push(parsed); if (parsed.metadata?.authoredTargetProjection) targetProjectionTargets.push(parsed); }
    if (block.kind === 'proof') proofBlocks.push(parseProofBlock(block));
    if (block.kind === 'paradigm' || block.kind === 'paradigmSemantics') paradigmBlocks.push(parseParadigmBlock(block));
    if (block.kind === 'operations' || block.kind === 'semanticOperations') operationBlocks.push(parseSemanticOperationsBlock(block));
    if (block.kind === 'semanticEdits' || block.kind === 'semanticEditRecords') semanticEditBlocks.push(parseSemanticEditRecordsBlock(block));
    if (block.kind === 'conversion' || block.kind === 'universalConversionPlan') conversionBlocks.push(parseConversionBlock(block));
    if (block.kind === 'constraintSpace' || block.kind === 'possibilitySpace') constraintSpaceBlocks.push(parseConstraintSpaceBlock(block));
    if (block.kind === 'decisionGraph' || block.kind === 'admissionGraph') decisionGraphBlocks.push(parseDecisionGraphBlock(block));
    if (block.kind === 'gateEvidence' || block.kind === 'admissionEvidence' || block.kind === 'routeEvidence') gateAdmissionEvidenceBlocks.push(parseGateAdmissionEvidenceBlock(block));
    if (block.kind === 'dialectRegistry' || block.kind === 'universalDialectRegistry') dialectRegistryBlocks.push(parseDialectRegistryBlock(block));
    if (block.kind === 'interlingua' || block.kind === 'universalInterlingua') interlinguaBlocks.push(parseInterlinguaBlock(block));
    if (block.kind === 'resourceGraph' || block.kind === 'semanticResourceGraph') resourceGraphBlocks.push(parseResourceGraphBlock(block));
    if (block.kind === 'machineGraph' || block.kind === 'executionGraph' || block.kind === 'lowLevelGraph') machineGraphBlocks.push(parseMachineGraphBlock(block));
    if (block.kind === 'packageManifest' || block.kind === 'packageGraph' || block.kind === 'packageSurface') packageManifestBlocks.push(parsePackageManifestBlock(block));
    if (block.kind === 'canvasSurface' || block.kind === 'canvasGraph') canvasSurfaceBlocks.push(parseCanvasSurfaceBlock(block));
    if (block.kind === 'applicationSurface' || block.kind === 'appHost' || block.kind === 'plugin' || block.kind === 'pluginSurface' || block.kind === 'pluginContract') applicationSurfaceBlocks.push(parseApplicationSurfaceBlock(block));
    if (block.kind === 'runtimeCapabilities' || block.kind === 'runtimeCapabilityMatrix' || block.kind === 'runtimeHosts') runtimeCapabilityBlocks.push(parseRuntimeCapabilityBlock(block));
  }
  const metadata = createParsedMetadata({ proofBlocks, paradigmBlocks, operationBlocks, semanticEditBlocks, conversionBlocks, constraintSpaceBlocks, decisionGraphBlocks, gateAdmissionEvidenceBlocks, dialectRegistryBlocks, interlinguaBlocks, resourceGraphBlocks, machineGraphBlocks, nativeSourceBlocks, packageManifestBlocks, canvasSurfaceBlocks, applicationSurfaceBlocks, runtimeCapabilityBlocks, targetProjectionTargets });
  return createDocument({ id: documentId, name: documentName, nodes, ...(metadata ? { metadata } : {}) });
}

export function parseFrontierFile(name, source) { return parseFrontierSource(source, { name: name.replace(/\.frontier$/, ''), sourcePath: name }); }

function readName(source) { return /module\s+([A-Za-z_$][\w$]*)/.exec(source)?.[1]; }
function readId(source) { return /module\s+[A-Za-z_$][\w$]*\s+@id\(\s*["']([^"']+)["']\s*\)/.exec(source)?.[1]; }
function readBlocks(source, options) {
  return readFrontierSourceBlocks(source, options);
}
function idFrom(header, fallback) { return /@id\(\s*["']([^"']+)["']\s*\)/.exec(header)?.[1] ?? fallback; }
function nameFrom(header) { return /^([A-Za-z_$][\w$]*)/.exec(header)?.[1] ?? 'Unnamed'; }
function parseEntity(block) { return parseEntityBlock(block, idFrom, nameFrom); }
function parseState(block) { return parseStateBlock(block, idFrom, nameFrom); }
function parseAction(block) {
  const name = nameFrom(block.header);
  const topLevelBody = stripNestedBlocks('body', block.body);
  const body = readActionBodyRecords(block.body);
  return actionNode({
    id: idFrom(block.header, `action_${name}`),
    name,
    input: parseOptionalTypeExpression(/input\s*:?\s*([^\n]+)/.exec(topLevelBody)?.[1]),
    returns: parseOptionalTypeExpression(/returns\s+([^\n]+)/.exec(topLevelBody)?.[1]),
    reads: readList('reads', topLevelBody),
    writes: readList('writes', topLevelBody),
    uses: readList('uses', topLevelBody),
    throws: readList('throws', topLevelBody),
    body: body.length ? body : undefined
  });
}

function parseMigration(block) {
  const name = nameFrom(block.header);
  return migrationNode({ id: idFrom(block.header, `migration_${name}`), name, fromVersion: readWord('fromVersion', block.body) ?? readWord('from', block.body) ?? 'unknown', toVersion: readWord('toVersion', block.body) ?? readWord('to', block.body) ?? 'unknown', changes: readChangeRecords(block.body), invariants: readList('invariants', block.body) });
}
function parseEffect(block) {
  const name = nameFrom(block.header);
  return effectNode({
    id: idFrom(block.header, `effect_${name}`),
    name,
    capability: /capability\s+([^\n]+)/.exec(block.body)?.[1]?.trim() ?? name,
    input: parseOptionalTypeExpression(/input\s*:?\s*([^\n]+)/.exec(block.body)?.[1]),
    returns: parseOptionalTypeExpression(/returns\s+([^\n]+)/.exec(block.body)?.[1]),
    resources: readList('resources', block.body)
  });
}
function parseCapability(block) {
  const name = nameFrom(block.header);
  return capabilityNode({
    id: idFrom(block.header, `cap_${name}`),
    name,
    capability: readLine('capability', block.body) ?? name,
    category: readWord('category', block.body),
    input: parseOptionalTypeExpression(/input\s*:?\s*([^\n]+)/.exec(block.body)?.[1]),
    returns: parseOptionalTypeExpression(/returns\s+([^\n]+)/.exec(block.body)?.[1]),
    effects: readList('effects', block.body),
    resources: readList('resources', block.body),
    adapters: readAdapters(block.body),
    unsupportedTargets: readUnsupportedTargets(block.body)
  });
}
function parseType(block) {
  const name = nameFrom(block.header);
  const alias = /^\s*=\s*([^\n]+)/m.exec(block.body)?.[1]?.trim();
  const typeParameters = readTypeParameterRecords(block.header);
  return typeNode({
    id: idFrom(block.header, `type_${name}`),
    name,
    parameters: typeParameters?.map((parameter) => parameter.name) ?? readTypeParameterNames(block.header),
    ...(typeParameters ? { typeParameters } : {}),
    type: alias ? parseTypeExpression(alias) : undefined,
    fields: readTypeFields(block.body),
    variants: readVariants(block.body),
    invariants: readList('invariants', block.body)
  });
}
function parseExtern(block) {
  const name = nameFrom(block.header);
  return externNode({
    id: idFrom(block.header, `extern_${name}`),
    name,
    language: readWord('language', block.body) ?? readWord('target', block.body) ?? 'javascript',
    symbol: readWord('symbol', block.body) ?? name,
    signature: {
      input: parseOptionalTypeExpression(/input\s*:?\s*([^\n]+)/.exec(block.body)?.[1]),
      returns: parseOptionalTypeExpression(/returns\s+([^\n]+)/.exec(block.body)?.[1])
    },
    effects: readList('effects', block.body) ?? readList('uses', block.body),
    resources: readList('resources', block.body)
  });
}
function parseLattice(block) {
  const name = nameFrom(block.header);
  const exportName = readWord('frontierCrdt', block.body) ?? readWord('frontier-crdt', block.body);
  return latticeNode({
    id: idFrom(block.header, `lattice_${name}`),
    name,
    carrier: parseTypeExpression(readLine('carrier', block.body) ?? 'Json'),
    laws: readList('laws', block.body) ?? readList('law', block.body) ?? [],
    frontierCrdt: exportName ? {
      packageName: '@shapeshift-labs/frontier-crdt',
      exportName,
      lawChecker: readWord('lawChecker', block.body)
    } : undefined
  });
}
function parseTarget(block) {
  const name = nameFrom(block.header);
  const metadata = parseTargetProjectionMetadata(block, name);
  return targetNode({
    id: idFrom(block.header, `target_${name}`),
    name,
    target: {
      language: readWord('language', block.body) ?? name,
      packageName: readWord('package', block.body),
      emitPath: readWord('emitPath', block.body),
      moduleFormat: readWord('moduleFormat', block.body)
    },
    ...(metadata ? { metadata } : {})
  });
}
function readList(label, body) { const line = new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]; return line ? line.split(',').map((item) => item.trim()).filter(Boolean) : undefined; }
function readLine(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\n]+)', 'm').exec(body)?.[1]?.trim(); }
function readWord(label, body) { return new RegExp('^\\s*' + label + '\\s+([^\\s,]+)', 'm').exec(body)?.[1]?.trim(); }
function readInlineWord(label, text) { return new RegExp('(?:^|\\s)' + label + '\\s+([^\\s,]+)').exec(text)?.[1]?.trim(); }
function readInlineQuoted(label, text) { return new RegExp("(?:^|\\s)" + label + "\\s+[\"']([^\"']+)[\"']").exec(text)?.[1]?.trim(); }
function readAdapters(body) {
  const adapters = [];
  const re = /^\s*adapter\s+([A-Za-z][\w-]*)\s+symbol\s+([^\s]+)([^\n]*)$/gm;
  let match;
  while ((match = re.exec(body))) {
    const rest = match[3] ?? '';
    adapters.push({
      target: {
        language: match[1],
        platform: readInlineWord('platform', rest),
        framework: readInlineWord('framework', rest),
        packageName: readInlineWord('package', rest) ?? readInlineWord('packageName', rest),
        adapterPackage: readInlineWord('adapterPackage', rest)
      },
      symbol: match[2],
      kind: readInlineWord('kind', rest),
      packageName: readInlineWord('package', rest) ?? readInlineWord('packageName', rest),
      importPath: readInlineWord('import', rest) ?? readInlineWord('importPath', rest),
      requires: readInlineWord('requires', rest)?.split('|').map((item) => item.trim()).filter(Boolean)
    });
  }
  return adapters.length ? adapters : undefined;
}
function readUnsupportedTargets(body) {
  const unsupported = [];
  const re = /^\s*unsupported\s+([A-Za-z][\w-]*)([^\n]*)$/gm;
  let match;
  while ((match = re.exec(body))) {
    const rest = match[2] ?? '';
    unsupported.push({
      target: { language: match[1], platform: readInlineWord('platform', rest), framework: readInlineWord('framework', rest) },
      reason: readInlineQuoted('reason', rest) ?? (rest.trim() || 'Unsupported by this target.')
    });
  }
  return unsupported.length ? unsupported : undefined;
}
function readChangeRecords(body) {
  const changes = [];
  const re = /^\s*change\s+([A-Za-z][\w-]*)(?:\s+([^\n]+))?/gm;
  let match;
  while ((match = re.exec(body))) {
    const statement = match[2]?.trim();
    changes.push({ id: `change_${changes.length}`, kind: match[1], ...(statement ? { statement, target: statement.split(/\s+/)[0] } : {}) });
  }
  return changes;
}
function readVariants(body) {
  const variants = [];
  const seenNames = new Set();
  const seenIds = new Set();
  const re = /^\s*variant\s+([A-Za-z_$][\w$]*)(.*)$/gm;
  let match;
  while ((match = re.exec(body))) {
    const fields = readVariantPayloadFields(match[2] ?? '', match[1], parseTypeExpression);
    if (fields === null) continue;
    const id = /@id\(\s*["']([^"']+)["']\s*\)/.exec(match[2] ?? '')?.[1];
    const variantId = id ?? `type_variant_${safeId(match[1])}`;
    if (seenNames.has(match[1]) || seenIds.has(variantId)) continue;
    seenNames.add(match[1]); seenIds.add(variantId);
    variants.push({ ...(id ? { id } : {}), name: match[1], ...(fields?.length ? { fields } : {}) });
  }
  return variants.length ? variants : undefined;
}
