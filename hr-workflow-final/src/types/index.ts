export type NodeKind = 'start' | 'task' | 'approval' | 'automated' | 'end';

export interface KeyValue {
  key: string;
  value: string;
}

export interface StartNodeData extends Record<string, unknown> {
  kind: 'start';
  label: string;
  metadata: KeyValue[];
}

export interface TaskNodeData extends Record<string, unknown> {
  kind: 'task';
  label: string;
  description: string;
  assignee: string;
  dueDate: string;
  customFields: KeyValue[];
}

export interface ApprovalNodeData extends Record<string, unknown> {
  kind: 'approval';
  label: string;
  approverRole: string;
  autoApproveThreshold: number;
}

export interface AutomatedNodeData extends Record<string, unknown> {
  kind: 'automated';
  label: string;
  actionId: string;
  actionParams: Record<string, string>;
}

export interface EndNodeData extends Record<string, unknown> {
  kind: 'end';
  label: string;
  endMessage: string;
  showSummary: boolean;
}

export type WorkflowNodeData =
  | StartNodeData
  | TaskNodeData
  | ApprovalNodeData
  | AutomatedNodeData
  | EndNodeData;

export interface AutomationAction {
  id: string;
  label: string;
  params: string[];
}

export interface SimulationStep {
  nodeId: string;
  nodeLabel: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  message: string;
  timestamp: string;
}

export interface SimulationResult {
  success: boolean;
  steps: SimulationStep[];
  summary: string;
  errors: string[];
}

export interface WorkflowGraph {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: WorkflowNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export interface ValidationError {
  nodeId?: string;
  message: string;
  severity: 'error' | 'warning';
}
