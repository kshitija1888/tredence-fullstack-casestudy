import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from './hooks/useWorkflowStore';
import { nodeTypes } from './components/nodes';
import { NodeFormPanel } from './components/forms/NodeFormPanel';
import { NodePalette, SimulationPanel } from './components/panels';
import type { WorkflowNodeData, StartNodeData, TaskNodeData, ApprovalNodeData, AutomatedNodeData, EndNodeData } from './types';
import './styles.css';

// ─── Default data per node type ────────────────────────────────────────────────

function defaultData(type: string): WorkflowNodeData {
  switch (type) {
    case 'startNode':     return { kind: 'start',     label: 'Start',         metadata: [] } as StartNodeData;
    case 'taskNode':      return { kind: 'task',       label: 'New Task',      description: '', assignee: '', dueDate: '', customFields: [] } as TaskNodeData;
    case 'approvalNode':  return { kind: 'approval',   label: 'New Approval',  approverRole: 'Manager', autoApproveThreshold: 0 } as ApprovalNodeData;
    case 'automatedNode': return { kind: 'automated',  label: 'Automated Step', actionId: '', actionParams: {} } as AutomatedNodeData;
    case 'endNode':       return { kind: 'end',        label: 'End',           endMessage: '', showSummary: false } as EndNodeData;
    default:              return { kind: 'task', label: 'Node', description: '', assignee: '', dueDate: '', customFields: [] } as TaskNodeData;
  }
}

let nodeIdCounter = 100;

export default function App() {
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    setNodes,
    selectedNodeId, setSelectedNodeId,
    automations, loadAutomations,
    simulationResult, isSimulating, showSimPanel,
    runSimulation, setShowSimPanel, clearSimulation,
    validationErrors, runValidation,
    exportWorkflow, importWorkflow,
  } = useWorkflowStore();

  const rfInstance = useRef<any>(null);
  const canvasRef   = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAutomations(); }, []);

  // ── Drag & Drop from palette ─────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type || !rfInstance.current) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const position = rfInstance.current.screenToFlowPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    const id = `node-${++nodeIdCounter}`;
    const newNode = { id, type, position, data: defaultData(type) };
    setNodes([...nodes, newNode as any]);
    setSelectedNodeId(id);
  }, [nodes, setNodes, setSelectedNodeId]);

  // ── Selected node data ───────────────────────────────────────────────────────

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // ── Export / Import ──────────────────────────────────────────────────────────

  const handleExport = () => {
    const json = exportWorkflow();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'workflow.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => importWorkflow(ev.target?.result as string);
      reader.readAsText(file);
    };
    input.click();
  };

  const handleValidate = () => { runValidation(); setShowSimPanel(true); };

  return (
    <div className="app-root">
      {/* ── Top Toolbar ─────────────────────────────────────────────────────── */}
      <header className="toolbar">
        <div className="toolbar-brand">
          <span className="toolbar-logo">◈</span>
          <div>
            <p className="toolbar-title">HR Workflow Designer</p>
            <p className="toolbar-subtitle">Tredence Studio</p>
          </div>
        </div>

        <nav className="toolbar-actions">
          <button className="btn-toolbar" onClick={handleValidate} title="Validate workflow">
            <span>⚙</span> Validate
          </button>
          <button className="btn-toolbar btn-primary" onClick={() => { runValidation(); runSimulation(); }} title="Run simulation">
            <span>▶</span> Run Simulation
          </button>
          <div className="toolbar-divider" />
          <button className="btn-toolbar" onClick={handleImport} title="Import JSON">↑ Import</button>
          <button className="btn-toolbar" onClick={handleExport} title="Export JSON">↓ Export</button>
        </nav>
      </header>

      {/* ── Main Layout ─────────────────────────────────────────────────────── */}
      <div className="main-layout">
        {/* Left: Node Palette */}
        <NodePalette />

        {/* Center: Canvas */}
        <div className="canvas-wrapper" ref={canvasRef} onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={inst => { rfInstance.current = inst; }}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            defaultEdgeOptions={{ animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } }}
            deleteKeyCode="Delete"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(n) => {
                const kind = (n.data as WorkflowNodeData).kind;
                return { start: '#10b981', task: '#3b82f6', approval: '#f59e0b', automated: '#8b5cf6', end: '#ef4444' }[kind] ?? '#94a3b8';
              }}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            />
          </ReactFlow>

          {/* Canvas tip */}
          {nodes.length <= 5 && !selectedNodeId && (
            <div className="canvas-tip">
              Drag nodes from the left panel · Click a node to configure it · Press Delete to remove
            </div>
          )}
        </div>

        {/* Right: Form Panel or Simulation Panel */}
        {selectedNode && !showSimPanel && (
          <NodeFormPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as WorkflowNodeData}
            automations={automations}
            onClose={() => setSelectedNodeId(null)}
          />
        )}

        {showSimPanel && (
          <SimulationPanel
            result={simulationResult}
            isSimulating={isSimulating}
            validationErrors={validationErrors}
            onClose={clearSimulation}
          />
        )}
      </div>
    </div>
  );
}
