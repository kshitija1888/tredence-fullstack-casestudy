import React, { useEffect } from 'react';
import type {
  StartNodeData, TaskNodeData, ApprovalNodeData,
  AutomatedNodeData, EndNodeData, WorkflowNodeData, KeyValue, AutomationAction,
} from '../../types';
import { useWorkflowStore } from '../../hooks/useWorkflowStore';

// ─── Key-Value Editor ───────────────────────────────────────────────────────────

function KVEditor({ pairs, onChange }: { pairs: KeyValue[]; onChange: (p: KeyValue[]) => void }) {
  const add = () => onChange([...pairs, { key: '', value: '' }]);
  const remove = (i: number) => onChange(pairs.filter((_, idx) => idx !== i));
  const update = (i: number, field: 'key' | 'value', val: string) =>
    onChange(pairs.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  return (
    <div className="kv-editor">
      {pairs.map((pair, i) => (
        <div key={i} className="kv-row">
          <input placeholder="Key" value={pair.key} onChange={e => update(i, 'key', e.target.value)} className="form-input kv-input" />
          <input placeholder="Value" value={pair.value} onChange={e => update(i, 'value', e.target.value)} className="form-input kv-input" />
          <button onClick={() => remove(i)} className="btn-icon btn-danger" title="Remove">×</button>
        </div>
      ))}
      <button onClick={add} className="btn-ghost btn-sm">+ Add field</button>
    </div>
  );
}

// ─── Field Wrappers ─────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="field-label">{label}{required && <span className="required">*</span>}</label>
      {children}
    </div>
  );
}

// ─── Start Form ─────────────────────────────────────────────────────────────────

function StartForm({ data, nodeId }: { data: StartNodeData; nodeId: string }) {
  const { updateNodeData } = useWorkflowStore();
  const up = (partial: Partial<StartNodeData>) => updateNodeData(nodeId, partial);
  return (
    <>
      <Field label="Start title" required>
        <input className="form-input" value={data.label} onChange={e => up({ label: e.target.value })} placeholder="e.g. Start Onboarding" />
      </Field>
      <Field label="Metadata fields">
        <KVEditor pairs={data.metadata} onChange={metadata => up({ metadata })} />
      </Field>
    </>
  );
}

// ─── Task Form ──────────────────────────────────────────────────────────────────

function TaskForm({ data, nodeId }: { data: TaskNodeData; nodeId: string }) {
  const { updateNodeData } = useWorkflowStore();
  const up = (partial: Partial<TaskNodeData>) => updateNodeData(nodeId, partial);
  return (
    <>
      <Field label="Title" required>
        <input className="form-input" value={data.label} onChange={e => up({ label: e.target.value })} placeholder="e.g. Collect Documents" />
      </Field>
      <Field label="Description">
        <textarea className="form-input form-textarea" value={data.description} onChange={e => up({ description: e.target.value })} placeholder="Describe the task..." rows={3} />
      </Field>
      <Field label="Assignee">
        <input className="form-input" value={data.assignee} onChange={e => up({ assignee: e.target.value })} placeholder="e.g. HR Coordinator" />
      </Field>
      <Field label="Due date">
        <input className="form-input" type="date" value={data.dueDate} onChange={e => up({ dueDate: e.target.value })} />
      </Field>
      <Field label="Custom fields">
        <KVEditor pairs={data.customFields} onChange={customFields => up({ customFields })} />
      </Field>
    </>
  );
}

// ─── Approval Form ──────────────────────────────────────────────────────────────

const APPROVER_ROLES = ['Manager', 'HRBP', 'Director', 'VP', 'C-Level'];

function ApprovalForm({ data, nodeId }: { data: ApprovalNodeData; nodeId: string }) {
  const { updateNodeData } = useWorkflowStore();
  const up = (partial: Partial<ApprovalNodeData>) => updateNodeData(nodeId, partial);
  return (
    <>
      <Field label="Title" required>
        <input className="form-input" value={data.label} onChange={e => up({ label: e.target.value })} placeholder="e.g. Manager Approval" />
      </Field>
      <Field label="Approver role">
        <select className="form-input" value={data.approverRole} onChange={e => up({ approverRole: e.target.value })}>
          <option value="">Select role…</option>
          {APPROVER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Auto-approve threshold (%)">
        <div className="threshold-row">
          <input
            className="form-input threshold-input"
            type="number" min={0} max={100}
            value={data.autoApproveThreshold}
            onChange={e => up({ autoApproveThreshold: Number(e.target.value) })}
          />
          <div className="threshold-bar">
            <div className="threshold-fill" style={{ width: `${data.autoApproveThreshold}%` }} />
          </div>
        </div>
        <p className="field-hint">0 = manual review always required</p>
      </Field>
    </>
  );
}

// ─── Automated Form ─────────────────────────────────────────────────────────────

function AutomatedForm({ data, nodeId, automations }: { data: AutomatedNodeData; nodeId: string; automations: AutomationAction[] }) {
  const { updateNodeData } = useWorkflowStore();
  const up = (partial: Partial<AutomatedNodeData>) => updateNodeData(nodeId, partial);

  const selectedAction = automations.find(a => a.id === data.actionId);

  const handleActionChange = (actionId: string) => {
    const action = automations.find(a => a.id === actionId);
    const actionParams: Record<string, string> = {};
    action?.params.forEach(p => { actionParams[p] = data.actionParams[p] ?? ''; });
    up({ actionId, actionParams });
  };

  return (
    <>
      <Field label="Title" required>
        <input className="form-input" value={data.label} onChange={e => up({ label: e.target.value })} placeholder="e.g. Send Welcome Email" />
      </Field>
      <Field label="Action">
        <select className="form-input" value={data.actionId} onChange={e => handleActionChange(e.target.value)}>
          <option value="">Select action…</option>
          {automations.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </Field>
      {selectedAction && selectedAction.params.map(param => (
        <Field key={param} label={param.charAt(0).toUpperCase() + param.slice(1)}>
          <input
            className="form-input"
            value={data.actionParams[param] ?? ''}
            onChange={e => up({ actionParams: { ...data.actionParams, [param]: e.target.value } })}
            placeholder={`Enter ${param}…`}
          />
        </Field>
      ))}
    </>
  );
}

// ─── End Form ───────────────────────────────────────────────────────────────────

function EndForm({ data, nodeId }: { data: EndNodeData; nodeId: string }) {
  const { updateNodeData } = useWorkflowStore();
  const up = (partial: Partial<EndNodeData>) => updateNodeData(nodeId, partial);
  return (
    <>
      <Field label="Title" required>
        <input className="form-input" value={data.label} onChange={e => up({ label: e.target.value })} placeholder="e.g. Onboarding Complete" />
      </Field>
      <Field label="End message">
        <textarea className="form-input form-textarea" value={data.endMessage} onChange={e => up({ endMessage: e.target.value })} placeholder="Final message shown to users…" rows={3} />
      </Field>
      <Field label="Show summary">
        <label className="toggle-row">
          <input type="checkbox" className="toggle-checkbox" checked={data.showSummary} onChange={e => up({ showSummary: e.target.checked })} />
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">{data.showSummary ? 'Summary enabled' : 'Summary disabled'}</span>
        </label>
      </Field>
    </>
  );
}

// ─── Node Form Panel ────────────────────────────────────────────────────────────

const KIND_META: Record<string, { label: string; accent: string; icon: string }> = {
  start:     { label: 'Start Node',       accent: '#10b981', icon: '▶' },
  task:      { label: 'Task Node',        accent: '#3b82f6', icon: '☑' },
  approval:  { label: 'Approval Node',    accent: '#f59e0b', icon: '✓' },
  automated: { label: 'Automated Step',   accent: '#8b5cf6', icon: '⚡' },
  end:       { label: 'End Node',         accent: '#ef4444', icon: '■' },
};

interface NodeFormPanelProps {
  nodeId: string;
  data: WorkflowNodeData;
  automations: AutomationAction[];
  onClose: () => void;
}

export function NodeFormPanel({ nodeId, data, automations, onClose }: NodeFormPanelProps) {
  const meta = KIND_META[data.kind];

  return (
    <aside className="form-panel">
      <div className="form-panel-header" style={{ borderLeftColor: meta.accent }}>
        <div className="form-panel-title">
          <span className="form-panel-icon">{meta.icon}</span>
          <div>
            <p className="form-panel-kind">{meta.label}</p>
            <p className="form-panel-id">ID: {nodeId}</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-icon" title="Close panel">×</button>
      </div>

      <div className="form-panel-body">
        {data.kind === 'start'     && <StartForm     data={data} nodeId={nodeId} />}
        {data.kind === 'task'      && <TaskForm       data={data} nodeId={nodeId} />}
        {data.kind === 'approval'  && <ApprovalForm   data={data} nodeId={nodeId} />}
        {data.kind === 'automated' && <AutomatedForm  data={data} nodeId={nodeId} automations={automations} />}
        {data.kind === 'end'       && <EndForm        data={data} nodeId={nodeId} />}
      </div>
    </aside>
  );
}
