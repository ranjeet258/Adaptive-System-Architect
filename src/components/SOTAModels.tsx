import { Cpu, Image as ImageIcon, Search } from 'lucide-react';

export default function SOTAModels() {
  return (
    <div className="w-full mt-24">
      <h3 className="text-3xl font-bold mb-4">SOTA Embeddings & Multimodal Parsing</h3>
      <p className="text-slate-600 mb-8 max-w-2xl">
        Agentic RAG isn't just text anymore. It involves processing PDFs, images, and tabular data using state-of-the-art vision and embedding models.
      </p>

      <div className="space-y-6">
        <div className="bg-white p-6 border border-slate-200 rounded-2xl flex gap-6 items-start">
          <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-bold mb-2">Text Embeddings & Late Interaction</h4>
            <p className="text-sm text-slate-600 mb-3">
              Standard dense models like <strong>OpenAI text-embedding-3</strong> or <strong>Cohere English v3</strong> are great baselines. However, <strong>ColBERT (Late Interaction)</strong> preserves token-level semantics, offering superior retrieval for complex phrasing without the latency of a cross-encoder.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-600">OpenAI</span>
              <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-600">Cohere</span>
              <span className="px-2 py-1 bg-indigo-100 text-xs rounded text-indigo-700 font-medium">ColBERTv2</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded-2xl flex gap-6 items-start">
          <div className="p-4 bg-pink-50 rounded-xl text-pink-600 shrink-0">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-bold mb-2">Multimodal & Vision Parsing</h4>
            <p className="text-sm text-slate-600 mb-3">
              When dealing with PDFs, charts, or Excel files, standard text extraction fails. Use Vision models (<strong>GPT-4o, Claude 3.5 Sonnet</strong>) to parse images into markdown. Use multimodal embeddings like <strong>CLIP</strong> or <strong>Nomic Embed Vision</strong> to query images and text simultaneously in the same vector space.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-600">CLIP</span>
              <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-600">Nomic</span>
              <span className="px-2 py-1 bg-pink-100 text-xs rounded text-pink-700 font-medium">GPT-4o Vision</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded-2xl flex gap-6 items-start">
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-bold mb-2">Advanced Retrieval & Re-ranking</h4>
            <p className="text-sm text-slate-600 mb-3">
              <strong>Hybrid Search:</strong> Combine Dense (Semantic) and Sparse (BM25/Keyword) retrieval. <br/>
              <strong>Re-ranking:</strong> Use Cross-Encoders (e.g., Cohere Re-rank, BGE-Reranker) to rescore the top K results. This drastically improves precision by evaluating the query-document pair directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
