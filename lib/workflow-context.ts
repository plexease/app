const CONTEXT_KEY = "plexease_workflow_context";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface WorkflowContext {
  sourceToolId: string;
  language: string;
  framework: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export function saveWorkflowContext(context: Omit<WorkflowContext, "timestamp">): void {
  try {
    const data: WorkflowContext = { ...context, timestamp: new Date().toISOString() };
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadWorkflowContext(acceptFrom?: string[]): WorkflowContext | null {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    if (!raw) return null;

    const data: WorkflowContext = JSON.parse(raw);

    // Check TTL
    const age = Date.now() - new Date(data.timestamp).getTime();
    if (age > TTL_MS) {
      localStorage.removeItem(CONTEXT_KEY);
      return null;
    }

    // Check source tool compatibility
    if (acceptFrom && !acceptFrom.includes(data.sourceToolId)) {
      return null;
    }

    return data;
  } catch {
    // Corrupted data — clear and return null
    try { localStorage.removeItem(CONTEXT_KEY); } catch {}
    return null;
  }
}

export function clearWorkflowContext(): void {
  try { localStorage.removeItem(CONTEXT_KEY); } catch {}
}
