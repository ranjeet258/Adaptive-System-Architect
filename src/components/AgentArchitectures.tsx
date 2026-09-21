import { useState, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Layers } from 'lucide-react';

type CaseNode = { id: string, label: string, position: { x: number, y: number } };
type CaseEdge = { source: string, target: string, label?: string };

type UseCase = {
  id: string;
  name: string;
  nodes: CaseNode[];
  edges: CaseEdge[];
};

const USE_CASES: UseCase[] = [
  {
    id: 'caseA',
    name: 'Use Case A — Agentic Management MIS',
    nodes: [
      { id: '1', label: 'Scheduler', position: { x: 50, y: 150 } },
      { id: '2', label: 'Data Agent', position: { x: 300, y: 50 } },
      { id: '3', label: 'Validation Agent', position: { x: 300, y: 250 } },
      { id: '4', label: 'Control Agent', position: { x: 550, y: 250 } },
      { id: '5', label: 'Analytics Agent', position: { x: 550, y: 50 } },
      { id: '6', label: 'Root-cause Agent', position: { x: 800, y: 50 } },
      { id: '7', label: 'Commentary Agent', position: { x: 1050, y: 150 } },
      { id: '8', label: 'Finance Reviewer', position: { x: 1300, y: 150 } },
      { id: '9', label: 'Approved Report', position: { x: 1550, y: 150 } },
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '1', target: '3' },
      { source: '2', target: '4' },
      { source: '3', target: '4' },
      { source: '2', target: '5' },
      { source: '5', target: '6' },
      { source: '6', target: '7' },
      { source: '4', target: '7' },
      { source: '7', target: '8' },
      { source: '8', target: '9' },
    ]
  },
  {
    id: 'caseB',
    name: 'Use Case B — Reconciliation & Exception Agent',
    nodes: [
      { id: '1', label: 'Bank Statement', position: { x: 50, y: 150 } },
      { id: '2', label: 'Ingestion', position: { x: 300, y: 150 } },
      { id: '3', label: 'Normalization', position: { x: 550, y: 150 } },
      { id: '4', label: 'Deterministic Matching', position: { x: 800, y: 150 } },
      { id: '5', label: 'Tolerance Rules', position: { x: 1050, y: 50 } },
      { id: '6', label: 'Exception Classifier', position: { x: 1050, y: 250 } },
      { id: '7', label: 'Evidence Retrieval', position: { x: 1300, y: 250 } },
      { id: '8', label: 'Suggested Resolution', position: { x: 1550, y: 250 } },
      { id: '9', label: 'Human Approval', position: { x: 1800, y: 150 } },
      { id: '10', label: 'Audit Log', position: { x: 2050, y: 150 } },
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' },
      { source: '4', target: '5', label: 'Match' },
      { source: '4', target: '6', label: 'Exception' },
      { source: '5', target: '9' },
      { source: '6', target: '7' },
      { source: '7', target: '8' },
      { source: '8', target: '9' },
      { source: '9', target: '10' },
    ]
  },
  {
    id: 'caseC',
    name: 'Use Case C — Product Profitability & Unit Economics',
    nodes: [
      { id: '1', label: 'Retrieve Data', position: { x: 50, y: 150 } },
      { id: '2', label: 'Finance Semantic Layer', position: { x: 300, y: 150 } },
      { id: '3', label: 'Calculate Contribution', position: { x: 550, y: 50 } },
      { id: '4', label: 'Compare Actuals vs Plan', position: { x: 550, y: 250 } },
      { id: '5', label: 'Identify Drivers', position: { x: 800, y: 50 } },
      { id: '6', label: 'Run Scenarios', position: { x: 800, y: 250 } },
      { id: '7', label: 'Management Explanation', position: { x: 1050, y: 150 } }
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '2', target: '4' },
      { source: '3', target: '5' },
      { source: '4', target: '6' },
      { source: '5', target: '7' },
      { source: '6', target: '7' }
    ]
  },
  {
    id: 'caseD',
    name: 'Use Case D — Treasury Cash-Flow Planning',
    nodes: [
      { id: '1', label: 'Historical Cash Flows', position: { x: 50, y: 150 } },
      { id: '2', label: 'Feature Engineering', position: { x: 300, y: 150 } },
      { id: '3', label: 'Baseline Forecast', position: { x: 550, y: 50 } },
      { id: '4', label: 'Scenario Engine', position: { x: 550, y: 250 } },
      { id: '5', label: 'Agentic Explanation', position: { x: 800, y: 50 } },
      { id: '6', label: 'Treasury Review', position: { x: 1050, y: 150 } },
      { id: '7', label: 'Approved Forecast', position: { x: 1300, y: 150 } },
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '2', target: '4' },
      { source: '3', target: '5' },
      { source: '4', target: '6' },
      { source: '5', target: '6' },
      { source: '6', target: '7' },
    ]
  },
  {
    id: 'caseE',
    name: 'Use Case E — Budget vs Actual & Forecasting',
    nodes: [
      { id: '1', label: 'Data Collection', position: { x: 50, y: 150 } },
      { id: '2', label: 'Validation', position: { x: 300, y: 150 } },
      { id: '3', label: 'Variance Calculation', position: { x: 550, y: 50 } },
      { id: '4', label: 'Forecast Generation', position: { x: 550, y: 250 } },
      { id: '5', label: 'Driver Analysis', position: { x: 800, y: 50 } },
      { id: '6', label: 'Narrative Engine', position: { x: 1050, y: 150 } },
      { id: '7', label: 'Review Loop', position: { x: 1300, y: 150 } },
      { id: '8', label: 'Distribution', position: { x: 1550, y: 150 } }
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '2', target: '4' },
      { source: '3', target: '5' },
      { source: '5', target: '6' },
      { source: '4', target: '6' },
      { source: '6', target: '7' },
      { source: '7', target: '8' },
      { source: '7', target: '6', label: 'Revision' },
    ]
  },
  {
    id: 'caseF',
    name: 'Use Case F — Expense, Invoice & Payment',
    nodes: [
      { id: '1', label: 'Invoice / Doc', position: { x: 50, y: 150 } },
      { id: '2', label: 'OCR / Document AI', position: { x: 300, y: 150 } },
      { id: '3', label: 'Vendor Extraction', position: { x: 550, y: 50 } },
      { id: '4', label: 'Policy Check', position: { x: 550, y: 250 } },
      { id: '5', label: 'Accounting Code', position: { x: 800, y: 50 } },
      { id: '6', label: 'Duplicate Check', position: { x: 800, y: 250 } },
      { id: '7', label: 'Exception Queue', position: { x: 1050, y: 250 } },
      { id: '8', label: 'Approval Agent', position: { x: 1050, y: 50 } },
      { id: '9', label: 'Payment System', position: { x: 1300, y: 50 } }
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '2', target: '4' },
      { source: '3', target: '5' },
      { source: '4', target: '6' },
      { source: '5', target: '8' },
      { source: '6', target: '8', label: 'Pass' },
      { source: '6', target: '7', label: 'Fail' },
      { source: '4', target: '7', label: 'Fail' },
      { source: '8', target: '9' }
    ]
  },
  {
    id: 'caseG',
    name: 'Use Case G — Tax & Compliance Support',
    nodes: [
      { id: '1', label: 'Extract Data', position: { x: 50, y: 150 } },
      { id: '2', label: 'Map Transactions', position: { x: 300, y: 50 } },
      { id: '3', label: 'Retrieve Policy', position: { x: 300, y: 250 } },
      { id: '4', label: 'Prepare Workpapers', position: { x: 550, y: 50 } },
      { id: '5', label: 'Identify Missing Docs', position: { x: 550, y: 250 } },
      { id: '6', label: 'Draft Checklists', position: { x: 800, y: 150 } }
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '1', target: '3' },
      { source: '2', target: '4' },
      { source: '3', target: '5' },
      { source: '4', target: '6' },
      { source: '5', target: '6' }
    ]
  },
  {
    id: 'caseH',
    name: 'Finance Knowledge & NL Assistant',
    nodes: [
      { id: '1', label: 'User Question', position: { x: 50, y: 150 } },
      { id: '2', label: 'Planner Agent', position: { x: 300, y: 150 } },
      { id: '3', label: 'Tools Selection', position: { x: 550, y: 50 } },
      { id: '4', label: 'Action Execution', position: { x: 800, y: 50 } },
      { id: '5', label: 'Explanation + Citation', position: { x: 1050, y: 150 } },
      { id: '6', label: 'Reviewer', position: { x: 550, y: 250 } }
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' },
      { source: '4', target: '5' },
      { source: '5', target: '6' },
      { source: '6', target: '5', label: 'Revise' },
      { source: '6', target: '1', label: 'Final Answer' }
    ]
  }
];

export default function AgentArchitectures() {
  const [activeCaseId, setActiveCaseId] = useState(USE_CASES[0].id);

  const activeCase = USE_CASES.find(c => c.id === activeCaseId) || USE_CASES[0];

  const formatNodes = (ac: UseCase): Node[] => ac.nodes.map(n => ({
    id: n.id,
    position: n.position,
    data: { label: n.label },
    className: 'bg-indigo-50 border-2 border-indigo-500 rounded-lg p-4 font-bold text-slate-800 shadow-md flex items-center justify-center text-center text-sm w-44',
  }));

  const formatEdges = (ac: UseCase): Edge[] => ac.edges.map((e, idx) => ({
    id: `e${e.source}-${e.target}-${idx}`,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 2 }
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(formatNodes(activeCase));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(formatEdges(activeCase));

  useEffect(() => {
    setNodes(formatNodes(activeCase));
    setEdges(formatEdges(activeCase));
  }, [activeCase, setNodes, setEdges]);

  return (
    <div className="w-full h-full flex flex-col xl:flex-row bg-slate-50 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-80">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Select Architecture
        </h3>
        <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
          {USE_CASES.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCaseId(c.id)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCaseId === c.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-indigo-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 w-full h-full relative">
        <ReactFlow 
          key={activeCaseId} 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          fitView 
          minZoom={0.1} 
          maxZoom={1.5}
          style={{ width: '100%', height: '100%', minHeight: '600px' }}
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
