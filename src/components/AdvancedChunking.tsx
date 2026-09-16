import { Layers, Puzzle, AlignLeft, BoxSelect } from 'lucide-react';

const chunkingMethods = [
  {
    icon: <AlignLeft className="w-6 h-6 text-indigo-500" />,
    title: "Fixed-Size / Recursive",
    desc: "Splits text by character count with overlap. Standard baseline, fast but lacks semantic awareness.",
    badge: "Basic"
  },
  {
    icon: <Puzzle className="w-6 h-6 text-purple-500" />,
    title: "Semantic Chunking",
    desc: "Uses embeddings to split text at semantic boundaries (e.g., changes in topic), keeping related ideas intact.",
    badge: "Intermediate"
  },
  {
    icon: <Layers className="w-6 h-6 text-pink-500" />,
    title: "Hierarchical Chunking",
    desc: "Creates summaries of parent documents pointing to smaller child chunks. Excellent for broad 'compare and contrast' queries.",
    badge: "Advanced"
  },
  {
    icon: <BoxSelect className="w-6 h-6 text-emerald-500" />,
    title: "Late Chunking & Contextual",
    desc: "Embeds the whole document first, then chunks (Late Chunking), or prepends document summaries to each chunk (Contextual Retrieval) so chunks don't lose global context.",
    badge: "SOTA"
  }
];

export default function AdvancedChunking() {
  return (
    <div className="w-full">
      <h3 className="text-3xl font-bold mb-4">Advanced Chunking Strategies</h3>
      <p className="text-slate-600 mb-8 max-w-2xl">
        Standard RAG often fails because chunks lose context. Advanced Agentic systems use sophisticated chunking to ensure the retrieved text contains the complete thought.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chunkingMethods.map((method, i) => (
          <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                {method.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                method.badge === 'SOTA' ? 'bg-emerald-100 text-emerald-700' :
                method.badge === 'Advanced' ? 'bg-pink-100 text-pink-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {method.badge}
              </span>
            </div>
            <h4 className="text-xl font-bold mb-2">{method.title}</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{method.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
