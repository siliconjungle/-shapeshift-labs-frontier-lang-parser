export function createRowIdentityTracker(options = {}) {
  const seenIds = new Map();
  const errors = [];
  const code = options.code ?? 'duplicate-generic-row-id';

  function accept(record, context = {}) {
    if (!record?.id) return true;
    const first = seenIds.get(record.id);
    if (first) {
      errors.push(duplicateRowIdError(record, context, first, code, errors.length, true));
      return false;
    }
    seenIds.set(record.id, rowIdentity(record, context));
    return true;
  }

  function preserve(record, context = {}) {
    if (!record?.id) return true;
    const first = seenIds.get(record.id);
    if (first) {
      errors.push(duplicateRowIdError(record, context, first, code, errors.length, false));
      return true;
    }
    seenIds.set(record.id, rowIdentity(record, context));
    return true;
  }

  return {
    errors,
    accept,
    preserve,
    push(target, record, context = {}) {
      if (record && accept(record, context)) target.push(record);
      return record;
    }
  };
}

function duplicateRowIdError(record, context, first, code, index, suppressed) {
  const current = rowIdentity(record, context);
  return cleanRecord({
    id: `parser_error_${safeId(code)}_${safeId(record.id)}_${index}`,
    code,
    reason: code,
    severity: 'error',
    failClosed: true,
    action: suppressed ? 'ignored-duplicate-row' : 'preserved-duplicate-row',
    disposition: context.disposition,
    suppressed,
    rowId: record.id,
    nodeId: record.id,
    rowKind: current.rowKind,
    normalizedRowKind: current.normalizedRowKind,
    name: current.name,
    sourceSpan: current.sourceSpan,
    firstRowKind: first.rowKind,
    firstNormalizedRowKind: first.normalizedRowKind,
    firstName: first.name,
    firstSourceSpan: first.sourceSpan,
    message: suppressed
      ? `Duplicate authored row id "${record.id}" was ignored.`
      : `Duplicate authored row id "${record.id}" was preserved.`
  });
}

function rowIdentity(record, context = {}) {
  return cleanRecord({
    rowKind: context.rowKind ?? record.rowKind ?? record.recordKind ?? record.kind,
    normalizedRowKind: context.normalizedRowKind ?? record.normalizedRowKind ?? record.recordKind ?? record.kind,
    name: context.name ?? record.name,
    sourceSpan: context.sourceSpan ?? record.sourceSpan
  });
}

function cleanRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function safeId(value) {
  return String(value ?? 'unknown').replace(/[^A-Za-z0-9_$-]+/g, '_');
}
