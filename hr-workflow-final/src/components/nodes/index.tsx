import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type {
  StartNodeData,
  TaskNodeData,
  ApprovalNodeData,
  AutomatedNodeData,
  EndNodeData,
} from '../../types';
import { useWorkflowStore } from '../../hooks/useWorkflowStore';

// ─── Shared Node Shell ──────────────────────────────────────────────────────────

interface ShellProps {
  id: string;
  accent: string;
  icon: string;
  badge: string;
  children: React.ReactNode;
  sourceHandle?: boolean;
  targetHandle?: boolean;
}

function NodeShell({ id, accent, icon, badge, children, sourceHandle = true, targetHandle = true }: ShellProps) {
  const { selectedNodeId, setSelectedNodeId } = useWorkflowStore();
  const selected = selectedNodeId === id;

  return (
    <div
      onClick={() => setSelectedNodeId(selected ? null : id)}
      className={`node-shell ${selected ? 'node-selected' : ''}`}
      style={{ borderLeftColor: accent }}
    >
      {targetHandle && <Handle type="target" position={Position.Top} />}
      <div className="node-header">
        <span className="node-icon">{icon}</span>
        <span className="node-badge" style={{ background: accent + '22', color: accent }}>{badge}</span>
      </div>
      <div className="node-body">{children}</div>
      {sourceHandle && <Handle type="source" position={Position.Bottom} />}
    </div>
  );
}

// ─── Start Node ─────────────────────────────────────────────────────────────────

export const StartNode = memo(({ id, data }: NodeProps) => {
  const d = data as StartNodeData;
  return (
    <NodeShell id={id} accent="#10b981" icon="▶" badge="START" targetHandle={false}>
      <p className="node-title">{d.label || 'Start'}</p>
      {d.metadata?.length > 0 && (
        <p className="node-meta">{d.metadata.length} metadata field{d.metadata.length !== 1 ? 's' : ''}</p>
      )}
    </NodeShell>
  );
});

// ─── Task Node ──────────────────────────────────────────────────────────────────

export const TaskNode = memo(({ id, data }: NodeProps) => {
  const d = data as TaskNodeData;
  return (
    <NodeShell id={id} accent="#3b82f6" icon="☑" badge="TASK">
      <p className="node-title">{d.label || 'Task'}</p>
      {d.assignee && <p className="node-meta">→ {d.assignee}</p>}
      {d.description && <p className="node-desc">{d.description.slice(0, 60)}{d.description.length > 60 ? '…' : ''}</p>}
    </NodeShell>
  );
});

// ─── Approval Node ──────────────────────────────────────────────────────────────

export const ApprovalNode = memo(({ id, data }: NodeProps) => {
  const d = data as ApprovalNodeData;
  return (
    <NodeShell id={id} accent="#f59e0b" icon="✓" badge="APPROVAL">
      <p className="node-title">{d.label || 'Approval'}</p>
      {d.approverRole && <p className="node-meta">Role: {d.approverRole}</p>}
      {d.autoApproveThreshold > 0 && (
        <p className="node-meta">Auto ≥ {d.autoApproveThreshold}%</p>
      )}
    </NodeShell>
  );
});

// ─── Automated Node ─────────────────────────────────────────────────────────────

export const AutomatedNode = memo(({ id, data }: NodeProps) => {
  const d = data as AutomatedNodeData;
  return (
    <NodeShell id={id} accent="#8b5cf6" icon="⚡" badge="AUTOMATED">
      <p className="node-title">{d.label || 'Automated Step'}</p>
      {d.actionId && <p className="node-meta">Action: {d.actionId}</p>}
    </NodeShell>
  );
});

// ─── End Node ───────────────────────────────────────────────────────────────────

export const EndNode = memo(({ id, data }: NodeProps) => {
  const d = data as EndNodeData;
  return (
    <NodeShell id={id} accent="#ef4444" icon="■" badge="END" sourceHandle={false}>
      <p className="node-title">{d.label || 'End'}</p>
      {d.endMessage && <p className="node-desc">{d.endMessage.slice(0, 60)}{d.endMessage.length > 60 ? '…' : ''}</p>}
    </NodeShell>
  );
});

// ─── Node Types Map (for React Flow) ───────────────────────────────────────────

export const nodeTypes = {
  startNode:     StartNode,
  taskNode:      TaskNode,
  approvalNode:  ApprovalNode,
  automatedNode: AutomatedNode,
  endNode:       EndNode,
};
