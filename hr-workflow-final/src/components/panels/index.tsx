import React from 'react';
import type { SimulationResult, ValidationError } from '../../types';
import { useWorkflowStore } from '../../hooks/useWorkflowStore';

// ─── Node Palette Item (draggable) ─────────────────────────────────────────────

const NODE_PALETTE = [
  { type: 'startNode',     label: 'Start',          icon: '▶', accent: '#10b981', desc: 'Workflow entry point' },
  { type: 'taskNode',      label: 'Task',           icon: '☑', accent: '#3b82f6', desc: 'Human task assignment' },
  { type: 'approvalNode',  label: 'Approval',       icon: '✓', accent: '#f59e0b', desc: 'Manager approval step' },
  { type: 'automatedNode', label: 'Automated Step', icon: '⚡', accent: '#8b5cf6', desc: 'System-triggered action' },
  { type: 'endNode',       label: 'End',            icon: '■', accent: '#ef4444', desc: 'Workflow completion' },
];

export function NodePalette() {
  const onDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="palette">
      <p className="palette-title">Node Types</p>
      <p className="palette-hint">Drag onto canvas</p>
      <div className="palette-list">
        {NODE_PALETTE.map(n => (
          <div
            key={n.type}
            className="palette-item"
            draggable
            onDragStart={e => onDragStart(e, n.type)}
            style={{ borderLeftColor: n.accent }}
          >
            <span className="palette-icon" style={{ color: n.accent }}>{n.icon}</span>
            <div>
              <p className="palette-label">{n.label}</p>
              <p className="palette-desc">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Simulation Panel ───────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, string> = {
  success: '✓', warning: '⚠', error: '✕', skipped: '–',
};
const STATUS_COLOR: Record<string, string> = {
  success: '#10b981', warning: '#f59e0b', error: '#ef4444', skipped: '#9ca3af',
};

interface SimPanelProps {
  result: SimulationResult | null;
  isSimulating: boolean;
  validationErrors: ValidationError[];
  onClose: () => void;
}

export function SimulationPanel({ result, isSimulating, validationErrors, onClose }: SimPanelProps) {
  return (
    <div className="sim-panel">
      <div className="sim-header">
        <div>
          <p className="sim-title">Workflow Simulation</p>
          {result && (
            <span className={`sim-status-badge ${result.success ? 'badge-success' : 'badge-error'}`}>
              {result.success ? '✓ Passed' : '✕ Failed'}
            </span>
          )}
        </div>
        <button onClick={onClose} className="btn-icon">×</button>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="sim-section">
          <p className="sim-section-title">Validation</p>
          {validationErrors.map((e, i) => (
            <div key={i} className={`sim-error-row ${e.severity === 'error' ? 'row-error' : 'row-warning'}`}>
              <span>{e.severity === 'error' ? '✕' : '⚠'}</span>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}

      {isSimulating && (
        <div className="sim-loading">
          <div className="spinner" />
          <span>Running simulation…</span>
        </div>
      )}

      {result && !isSimulating && (
        <>
          {result.errors.length > 0 && (
            <div className="sim-section">
              <p className="sim-section-title">Errors</p>
              {result.errors.map((e, i) => (
                <div key={i} className="sim-error-row row-error"><span>✕</span><span>{e}</span></div>
              ))}
            </div>
          )}

          {result.steps.length > 0 && (
            <div className="sim-section">
              <p className="sim-section-title">Execution Log</p>
              <div className="sim-log">
                {result.steps.map((step, i) => (
                  <div key={i} className="sim-step">
                    <div className="sim-step-dot" style={{ background: STATUS_COLOR[step.status] }}>
                      {STATUS_ICON[step.status]}
                    </div>
                    <div className="sim-step-content">
                      <p className="sim-step-label">{step.nodeLabel}</p>
                      <p className="sim-step-msg">{step.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sim-summary">
            <p>{result.summary}</p>
          </div>
        </>
      )}
    </div>
  );
}
