# HR Workflow Designer

🚀 Live Demo: https://tredence-fullstack-casestudy-1rqz4uhol-kshitija1888s-projects.vercel.app

Tredence Studio — Full Stack Engineering Intern Case Study

A functional prototype for an HR Workflow Designer module where HR admins can visually create, configure, and simulate internal workflows such as onboarding, leave approval, or document verification.

---

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:5173
```

---

## Features Implemented

### ✅ Core Requirements
| Feature | Status |
|---|---|
| React Flow drag-and-drop canvas | ✅ |
| All 5 custom node types | ✅ Start, Task, Approval, Automated, End |
| Node configuration forms | ✅ per-type with dynamic fields |
| Mock API layer (`GET /automations`, `POST /simulate`) | ✅ |
| Workflow simulation sandbox with step-by-step log | ✅ |
| Graph validation (cycles, disconnected nodes, start/end rules) | ✅ |
| Export / Import workflow JSON | ✅ |

### ✅ Bonus Features
- MiniMap for navigation
- Export workflow as JSON file
- Import workflow from JSON file
- Cycle detection with clear error messages
- Auto-validate before simulation

---

## Architecture

```
src/
├── types/
│   └── index.ts              # All TypeScript interfaces (node data, API types)
├── api/
│   └── mockApi.ts            # Mock GET /automations + POST /simulate + validation
├── hooks/
│   └── useWorkflowStore.ts   # Zustand global state (nodes, edges, simulation)
├── components/
│   ├── nodes/
│   │   └── index.tsx         # 5 custom React Flow nodes (StartNode, TaskNode…)
│   ├── forms/
│   │   └── NodeFormPanel.tsx # Per-type config forms (controlled, typed)
│   └── panels/
│       └── index.tsx         # NodePalette + SimulationPanel
├── App.tsx                   # Layout, canvas, drag-and-drop wiring
├── styles.css                # All CSS (no Tailwind dependency — pure CSS vars)
└── main.tsx                  # Entry point
```

### Design Decisions

**State management — Zustand over Redux/Context**
Zustand is minimal boilerplate for a self-contained tool. All graph state (nodes, edges, selected node, simulation result, automations) lives in one flat store with typed slices. No prop drilling.

**Separation of concerns**
- `api/mockApi.ts` is a pure async module — no React, no state. Easy to swap for a real HTTP client.
- `hooks/useWorkflowStore.ts` owns all mutable state. Components are thin and don't compute derived data.
- Node form components are fully controlled — they call `updateNodeData(id, partial)` which merges into the store.

**Type safety throughout**
Each node type has its own discriminated union member (`kind: 'start' | 'task' | ...`). TypeScript narrows the type in form components via the `kind` field. No `any` casts in forms.

**Extensible forms**
Adding a new node type requires: (1) add a type to the union, (2) add a form component, (3) add a node shell component, (4) register in `nodeTypes` map. No changes to the store or API layer needed.

**Graph validation**
The `validateGraph()` function is pure (no side effects) and runs both standalone (Validate button) and before simulation. It checks: single start node, at least one end node, connected nodes, and cycle detection via DFS.

**Topological sort for simulation**
The mock `/simulate` walks nodes in topological order, generating step-by-step execution logs. This accurately reflects how a DAG-based workflow engine would execute.

---

## Node Types & Forms

| Node | Accent | Fields |
|---|---|---|
| **Start** | Green | Title, metadata key-value pairs |
| **Task** | Blue | Title*, description, assignee, due date, custom fields |
| **Approval** | Amber | Title*, approver role (dropdown), auto-approve threshold (0–100%) |
| **Automated Step** | Purple | Title*, action selector (from mock API), dynamic action params |
| **End** | Red | Title*, end message, show summary toggle |

---

## Mock API

**`GET /automations`** — returns 6 mock automation actions:
```json
[
  { "id": "send_email",      "label": "Send Email",         "params": ["to", "subject", "body"] },
  { "id": "generate_doc",    "label": "Generate Document",  "params": ["template", "recipient"] },
  { "id": "send_slack",      "label": "Send Slack Message", "params": ["channel", "message"] },
  { "id": "create_ticket",   "label": "Create Jira Ticket", "params": ["project", "summary"] },
  { "id": "update_hrms",     "label": "Update HRMS Record", "params": ["employeeId", "field", "value"] },
  { "id": "trigger_webhook", "label": "Trigger Webhook",    "params": ["url", "payload"] }
]
```

**`POST /simulate`** — accepts workflow graph JSON, returns step-by-step execution result with status per node.

---

## What I Would Add With More Time

1. **Backend persistence** — FastAPI + PostgreSQL to save/load workflows
2. **Authentication** — OAuth/OIDC with Azure AD for role-based access (HR Admin vs Viewer)
3. **Conditional edges** — branches based on approval outcome (Approved / Rejected paths)
4. **Undo/Redo** — command pattern or Zustand temporal middleware
5. **Real-time collaboration** — WebSocket-based multi-user editing
6. **Node version history** — track changes with timestamps
7. **Workflow templates** — pre-built onboarding / leave-approval / offboarding flows
8. **Visual validation errors on nodes** — red border on invalid nodes rather than just the panel
9. **E2E tests** — Playwright coverage for drag-and-drop, form editing, and simulation
10. **Auto-layout** — Dagre or ELK layout engine for automatic positioning

---

*Submitted for: Tredence Studio AI Agents Engineering Internship — 2025 Cohort*
