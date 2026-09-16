
export default function TechStackMatrix() {
  return (
    <div className="w-full mt-24 mb-24">
      <h3 className="text-3xl font-bold mb-4">Tech Stack & When To Use What</h3>
      <p className="text-slate-600 mb-8 max-w-2xl">
        A quick guide on selecting the right tools for your Agentic RAG architecture depending on the scale and complexity of your data.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="p-4 rounded-tl-lg font-bold">Category</th>
              <th className="p-4 font-bold">Small / Prototyping</th>
              <th className="p-4 font-bold">Enterprise / Production</th>
              <th className="p-4 rounded-tr-lg font-bold">When to choose what?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            <tr>
              <td className="p-4 font-semibold text-slate-900">Orchestrator</td>
              <td className="p-4 text-slate-600">LangChain, LlamaIndex</td>
              <td className="p-4 text-slate-600">LangGraph, AutoGen, CrewAI</td>
              <td className="p-4 text-sm text-slate-500">Use standard frameworks for simple pipelines. Use LangGraph/CrewAI for multi-agent workflows with cycles, fallback loops, and state memory.</td>
            </tr>
            <tr>
              <td className="p-4 font-semibold text-slate-900">Vector DB</td>
              <td className="p-4 text-slate-600">ChromaDB, FAISS</td>
              <td className="p-4 text-slate-600">Pinecone, Qdrant, Milvus, pgvector</td>
              <td className="p-4 text-sm text-slate-500">FAISS is local. Move to Pinecone/Qdrant for massive scale and managed infra. Use pgvector if your metadata/relational data is already in Postgres.</td>
            </tr>
            <tr>
              <td className="p-4 font-semibold text-slate-900">Embeddings</td>
              <td className="p-4 text-slate-600">OpenAI text-embedding-3</td>
              <td className="p-4 text-slate-600">ColBERT, Nomic, BGE-M3</td>
              <td className="p-4 text-sm text-slate-500">OpenAI is easy. Use ColBERT for complex queries. Use BGE-M3 for multi-lingual. Use Nomic/CLIP for multimodal.</td>
            </tr>
            <tr>
              <td className="p-4 font-semibold text-slate-900">Evaluation</td>
              <td className="p-4 text-slate-600">Manual review</td>
              <td className="p-4 text-slate-600">RAGAS, TruLens, LangSmith</td>
              <td className="p-4 text-sm text-slate-500">You must evaluate context precision, recall, and answer faithfulness in production using LLM-as-a-judge frameworks like RAGAS.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
