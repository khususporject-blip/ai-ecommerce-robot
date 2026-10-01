const clean = (value, fallback = "") => String(value ?? fallback).trim().slice(0, 500);

export function createAuditEntry(input = {}) {
  return {
    id: clean(input.id, `audit-${Date.now().toString(36)}`),
    actor: clean(input.actor, "robot-ai"),
    action: clean(input.action),
    target: clean(input.target),
    decision: clean(input.decision),
    policy: clean(input.policy, "not_evaluated"),
    status: clean(input.status, "RECORDED"),
    result: input.result ?? null,
    error: clean(input.error),
    open_id: clean(input.open_id),
    timestamp: new Date().toISOString()
  };
}

export function appendAudit(store, entry) {
  store.push(entry);
  if (store.length > 1000) store.splice(0, store.length - 1000);
  return entry;
}
