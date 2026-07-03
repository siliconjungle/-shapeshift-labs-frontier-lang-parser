export function mergeConversionBlocks(blocks) {
  const plan = {
    id: blocks.length === 1 ? blocks[0].id : 'universalConversionPlan:source',
    targets: [...new Set(blocks.flatMap((block) => block.targets ?? []))],
    metadata: { authoredConversionBlockIds: blocks.map((block) => block.id) }
  };
  for (const block of blocks) {
    if (block.sourceLanguage && !plan.sourceLanguage) plan.sourceLanguage = block.sourceLanguage;
    for (const [key, value] of Object.entries(block)) {
      if (Array.isArray(value) && key !== 'targets') plan[key] = [...(plan[key] ?? []), ...value];
      else if ((key === 'sourceRuntimes' || key === 'targetRuntimes') && value && typeof value === 'object') {
        plan[key] = { ...(plan[key] ?? {}), ...value };
      }
    }
  }
  plan.evidenceIds = ids(plan.evidence);
  plan.summary = {
    evidenceCount: plan.evidence?.length ?? 0,
    runtimeRequirementCount: plan.runtimeRequirements?.length ?? 0,
    dialectCount: plan.dialects?.length ?? 0,
    externCount: plan.externs?.length ?? 0,
    constraintCount: conversionConstraintCount(plan)
  };
  plan.claims = {
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    conversionEquivalenceClaim: false,
    runtimeEquivalenceClaim: false
  };
  return plan;
}

function ids(records = []) {
  return records.map((record) => record?.id).filter(Boolean);
}

function conversionConstraintCount(plan) {
  return Object.entries(plan).reduce((total, [key, value]) => {
    if (!Array.isArray(value)) return total;
    if (key.endsWith('Constraints') || key === 'resourceTransfers') return total + value.length;
    return total;
  }, 0);
}
