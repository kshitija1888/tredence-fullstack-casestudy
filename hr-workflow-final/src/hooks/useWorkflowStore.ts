import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import type { WorkflowNodeData, AutomationAction, SimulationResult, ValidationError } from '../types';
import { getAutomations, simulateWorkflow, validateGraph } from '../api/mockApi';

export type WorkflowNode = Node<WorkflowNodeData>;

interface WorkflowState {
  // Graph
  nodes: WorkflowNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<WorkflowNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: Edge[]) => void;

  // Selection & editing
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => void;

  // Automations
  automations: AutomationAction[];
  loadAutomations: () => Promise<void>;

  // Simulation
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  showSimPanel: boolean;
  runSimulation: () => Promise<void>;
  setShowSimPanel: (v: boolean) => void;
  clearSimulation: () => void;

  // Validation
  validationErrors: ValidationError[];
  runValidation: () => void;

  // Export/Import
  exportWorkflow: () => string;
  importWorkflow: (json: string) => void;
}

const initialNodes: WorkflowNode[] = [
  {
    id: 'start-1',
    type: 'startNode',
    position: { x: 240, y: 60 },
    data: { kind: 'start', label: 'Start Onboarding', metadata: [] },
  },
  {
    id: 'task-1',
    type: 'taskNode',
    position: { x: 240, y: 200 },
    data: { kind: 'task', label: 'Collect Documents', description: 'Gather all required onboarding documents from employee.', assignee: 'HR Coordinator', dueDate: '', customFields: [] },
  },
  {
    id: 'approval-1',
    type: 'approvalNode',
    position: { x: 240, y: 360 },
    data: { kind: 'approval', label: 'Manager Approval', approverRole: 'Manager', autoApproveThreshold: 0 },
  },
  {
    id: 'auto-1',
    type: 'automatedNode',
    position: { x: 240, y: 510 },
    data: { kind: 'automated', label: 'Send Welcome Email', actionId: 'send_email', actionParams: { to: 'employee@company.com', subject: 'Welcome to the team!' } },
  },
  {
    id: 'end-1',
    type: 'endNode',
    position: { x: 240, y: 650 },
    data: { kind: 'end', label: 'Onboarding Complete', endMessage: 'Employee successfully onboarded.', showSummary: true },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'start-1',    target: 'task-1' },
  { id: 'e2', source: 'task-1',     target: 'approval-1' },
  { id: 'e3', source: 'approval-1', target: 'auto-1' },
  { id: 'e4', source: 'auto-1',     target: 'end-1' },
];

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,

  onNodesChange: (changes) =>
    set(s => ({ nodes: applyNodeChanges(changes, s.nodes) as WorkflowNode[] })),
  onEdgesChange: (changes) =>
    set(s => ({ edges: applyEdgeChanges(changes, s.edges) })),
  onConnect: (connection) =>
    set(s => ({ edges: addEdge({ ...connection, animated: true }, s.edges) })),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  updateNodeData: (id, partial) =>
    set(s => ({
      nodes: s.nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, ...partial } as WorkflowNodeData } : n
      ),
    })),

  automations: [],
  loadAutomations: async () => {
    const automations = await getAutomations();
    set({ automations });
  },

  simulationResult: null,
  isSimulating: false,
  showSimPanel: false,

  runSimulation: async () => {
    const { nodes, edges } = get();
    set({ isSimulating: true, showSimPanel: true, simulationResult: null });
    const graph = {
      nodes: nodes.map(n => ({ id: n.id, type: n.type ?? '', position: n.position, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    };
    const result = await simulateWorkflow(graph);
    set({ simulationResult: result, isSimulating: false });
  },

  setShowSimPanel: (v) => set({ showSimPanel: v }),
  clearSimulation: () => set({ simulationResult: null, showSimPanel: false }),

  validationErrors: [],
  runValidation: () => {
    const { nodes, edges } = get();
    const graph = {
      nodes: nodes.map(n => ({ id: n.id, type: n.type ?? '', position: n.position, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    };
    set({ validationErrors: validateGraph(graph) });
  },

  exportWorkflow: () => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges }, null, 2);
  },

  importWorkflow: (json) => {
    try {
      const { nodes, edges } = JSON.parse(json);
      set({ nodes, edges, selectedNodeId: null, simulationResult: null });
    } catch {
      alert('Invalid workflow JSON.');
    }
  },
}));
