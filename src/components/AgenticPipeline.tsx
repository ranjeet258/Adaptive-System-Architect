import { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  {
    id: 'user',
    type: 'input',
    data: { label: 'User Query' },
    position: { x: 50, y: 200 },
    className: 'bg-slate-100 border-2 border-slate-300 rounded-lg p-4 font-bold shadow-sm',
  },
  {
    id: 'agent',
    data: { label: 'Agent / Orchestrator\n(ReAct / Plan & Solve)' },
    position: { x: 350, y: 200 },
    className: 'bg-indigo-100 border-2 border-indigo-500 rounded-lg p-4 font-bold text-indigo-900 shadow-md w-48 text-center',
  },
  {
    id: 'tool-search',
    data: { label: 'Web Search Tool\n(Tavily / Google)' },
    position: { x: 650, y: 50 },
    className: 'bg-emerald-50 border-2 border-emerald-400 rounded-lg p-3 text-sm text-emerald-800 shadow-sm w-40 text-center',
  },
  {
    id: 'tool-rag',
    data: { label: 'Vector DB Tool\n(Pinecone / Qdrant)' },
    position: { x: 650, y: 150 },
    className: 'bg-emerald-50 border-2 border-emerald-400 rounded-lg p-3 text-sm text-emerald-800 shadow-sm w-40 text-center',
  },
  {
    id: 'tool-sql',
    data: { label: 'SQL DB Tool\n(Postgres / BigQuery)' },
    position: { x: 650, y: 250 },
    className: 'bg-emerald-50 border-2 border-emerald-400 rounded-lg p-3 text-sm text-emerald-800 shadow-sm w-40 text-center',
  },
  {
    id: 'output',
    type: 'output',
    data: { label: 'Final Answer' },
    position: { x: 350, y: 400 },
    className: 'bg-slate-100 border-2 border-slate-300 rounded-lg p-4 font-bold shadow-sm',
  }
];

const initialEdges = [
  { id: 'e1-2', source: 'user', target: 'agent', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-3', source: 'agent', target: 'tool-search', animated: true, label: 'Act (Tool Call)', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3-2', source: 'tool-search', target: 'agent', animated: true, label: 'Observe', markerEnd: { type: MarkerType.ArrowClosed }, type: 'step' },
  { id: 'e2-6', source: 'agent', target: 'output', animated: true, label: 'Generate', markerEnd: { type: MarkerType.ArrowClosed } },
];

export default function AgenticPipeline() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const [temperature, setTemperature] = useState(0.2);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 border-r border-slate-200 bg-white p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h3 className="font-bold text-lg mb-1">Agent Settings</h3>
          <p className="text-xs text-slate-500 mb-4">Adjust parameters to see how the agent behaves.</p>
          
          <label className="text-sm font-semibold flex justify-between mb-2">
            Temperature <span>{temperature}</span>
          </label>
          <input 
            type="range" 
            min="0" max="1" step="0.1" 
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <p className="text-xs text-slate-500 mt-2">
            {temperature < 0.3 ? "Low (0-0.3): Deterministic, focused, good for factual retrieval." : 
             temperature < 0.7 ? "Medium (0.4-0.6): Balanced, good for summarization." : 
             "High (0.7-1.0): Creative, potentially hallucinates, bad for strict RAG."}
          </p>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h3 className="font-bold text-lg mb-2">Step-by-Step Trace</h3>
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-sm">
              <span className="font-bold text-indigo-600">User:</span> What were Apple's Q3 revenues compared to Microsoft?
            </div>
            <div className="p-3 bg-indigo-50 rounded border border-indigo-200 text-sm">
              <span className="font-bold text-indigo-800">Agent (Reason):</span> I need to find Q3 revenues for both Apple and Microsoft. I will use the Web Search Tool.
            </div>
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-sm font-mono text-xs overflow-x-auto">
              <span className="font-bold text-emerald-800 block mb-1">Tool Call: web_search</span>
              &#123; "query": "Apple Q3 revenue" &#125;
            </div>
            <div className="p-3 bg-indigo-50 rounded border border-indigo-200 text-sm">
              <span className="font-bold text-indigo-800">Agent (Fallback):</span> The search didn't return exact figures. Let me check the Vector DB for internal financial reports.
            </div>
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 relative h-[400px] md:h-auto">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap zoomable pannable nodeClassName={(n) => {
            if (n.id === 'agent') return 'bg-indigo-500';
            if (n.id.startsWith('tool')) return 'bg-emerald-500';
            return 'bg-slate-500';
          }} />
        </ReactFlow>
      </div>
    </div>
  );
}
