import type {
  AutomationAction,
  SimulationResult,
  SimulationStep,
  WorkflowGraph,
  ValidationError,
} from '../types';

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_AUTOMATIONS: AutomationAction[] = [
  { id: 'send_email',     label: 'Send Email',           params: ['to', 'subject', 'body'] },
  { id: 'generate_doc',   label: 'Generate Document',    params: ['template', 'recipient'] },
  { id: 'send_slack',     label: 'Send Slack Message',   params: ['channel', 'message'] },
  { id: 'create_ticket',  label: 'Create Jira Ticket',   params: ['project', 'summary'] },
  { id: 'update_hrms',    label: 'Update HRMS Record',   params: ['employeeId', 'field', 'value'] },
  { id: 'trigger_webhook',label: 'Trigger Webhook',      params: ['url', 'payload'] },
];

// ─── Validation Helpers ────────────────────────────────────────────────────────

export function validateGraph(graph: WorkflowGraph): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodes, edges } = graph;

  const startNodes = nodes.filter(n => n.data.kind === 'start');
  const endNodes   = nodes.filter(n => n.data.kind === 'end');

  if (startNodes.length === 0) errors.push({ message: 'Workflow must have a Start node.', severity: 'error' });
  if (startNodes.length > 1)   errors.push({ message: 'Workflow must have exactly one Start node.', severity: 'error' });
  if (endNodes.length === 0)   errors.push({ message: 'Workflow must have at least one End node.', severity: 'error' });

  // Check for disconnected nodes
  const connectedIds = new Set<string>();
  edges.forEach(e => { connectedIds.add(e.source); connectedIds.add(e.target); });
  nodes.forEach(n => {
    if (!connectedIds.has(n.id) && nodes.length > 1) {
      errors.push({ nodeId: n.id, message: `Node "${n.data.label}" is not connected to the workflow.`, severity: 'warning' });
    }
  });

  // Check for cycle (simple DFS)
  const adjacency: Record<string, string[]> = {};
  nodes.forEach(n => adjacency[n.id] = []);
  edges.forEach(e => adjacency[e.source]?.push(e.target));

  const visited = new Set<string>();
  const inStack = new Set<string>();
  let hasCycle = false;

  function dfs(id: string) {
    if (inStack.has(id)) { hasCycle = true; return; }
    if (visited.has(id)) return;
    visited.add(id); inStack.add(id);
    adjacency[id]?.forEach(dfs);
    inStack.delete(id);
  }
  nodes.forEach(n => dfs(n.id));
  if (hasCycle) errors.push({ message: 'Workflow contains a cycle. Ensure the graph is acyclic.', severity: 'error' });

  return errors;
}

// ─── Topological sort ───────────────────────────────────────────────────────────

function topoSort(graph: WorkflowGraph): string[] {
  const { nodes, edges } = graph;
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  nodes.forEach(n => { adj[n.id] = []; inDegree[n.id] = 0; });
  edges.forEach(e => { adj[e.source].push(e.target); inDegree[e.target]++; });

  const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
  const result: string[] = [];

  while (queue.length) {
    const id = queue.shift()!;
    result.push(id);
    adj[id].forEach(next => {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    });
  }
  return result;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

/** GET /automations */
export async function getAutomations(): Promise<AutomationAction[]> {
  await delay(200);
  return MOCK_AUTOMATIONS;
}

/** POST /simulate */
export async function simulateWorkflow(graph: WorkflowGraph): Promise<SimulationResult> {
  await delay(600);

  const validationErrors = validateGraph(graph);
  const hardErrors = validationErrors.filter(e => e.severity === 'error');

  if (hardErrors.length > 0) {
    return {
      success: false,
      steps: [],
      summary: 'Simulation aborted due to validation errors.',
      errors: hardErrors.map(e => e.message),
    };
  }

  const nodeMap = Object.fromEntries(graph.nodes.map(n => [n.id, n]));
  const order   = topoSort(graph);
  const steps: SimulationStep[] = [];

  for (const id of order) {
    const node = nodeMap[id];
    if (!node) continue;
    await delay(80);

    const step: SimulationStep = {
      nodeId: id,
      nodeLabel: node.data.label || node.data.kind,
      status: 'success',
      message: getStepMessage(node.data),
      timestamp: new Date().toISOString(),
    };

    // Simulate occasional warnings/approvals
    if (node.data.kind === 'approval') {
      const threshold = (node.data as any).autoApproveThreshold ?? 0;
      if (threshold > 80) {
        step.status = 'warning';
        step.message = `Auto-approve threshold is high (${threshold}%). Recommend manual review.`;
      }
    }

    steps.push(step);
  }

  return {
    success: true,
    steps,
    summary: `Workflow executed successfully across ${steps.length} step${steps.length !== 1 ? 's' : ''}.`,
    errors: [],
  };
}

function getStepMessage(data: any): string {
  switch (data.kind) {
    case 'start':     return `Workflow initiated: "${data.label}"`;
    case 'task':      return `Task assigned to ${data.assignee || 'unassigned'}: "${data.description || data.label}"`;
    case 'approval':  return `Approval requested from ${data.approverRole || 'approver'}`;
    case 'automated': return `Automation triggered: ${data.actionId || 'action'}`;
    case 'end':       return data.endMessage || 'Workflow completed.';
    default:          return 'Step executed.';
  }
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
