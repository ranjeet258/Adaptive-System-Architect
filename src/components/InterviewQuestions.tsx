import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircleQuestion } from 'lucide-react';

const questions = [
  {
    q: "How would you design a RAG architecture that scales to 100M+ documents?",
    a: "Scaling to 100M+ documents requires decoupling indexing from retrieval. I'd use a distributed vector database (e.g., Milvus, Qdrant, or Pinecone) configured with sharding and replication. For indexing, I'd implement a distributed processing pipeline (e.g., Apache Spark or Ray) to chunk, embed, and upsert documents asynchronously. I'd use Approximate Nearest Neighbor (ANN) indexes like HNSW for fast retrieval, and implement tiered storage (hot/warm/cold) if access patterns are skewed. Additionally, caching frequent queries (using Redis) and applying pre-filtering via metadata (using scalar indexes) drastically reduces the search space and improves latency."
  },
  {
    q: "Why use a cross-encoder for reranking rather than using it for initial retrieval?",
    a: "Cross-encoders process the query and document together through a single Transformer model, allowing rich self-attention between query and document tokens, which yields highly accurate relevance scores. However, because every query-document pair must be processed dynamically, it is extremely computationally expensive (O(N) for N documents). For large corpora, this is far too slow for initial retrieval. Instead, we use bi-encoders (which pre-compute document embeddings for fast O(1) or O(log N) ANN search) to retrieve a small candidate set (e.g., top 100), and then apply the computationally heavy cross-encoder only on this small set to achieve high precision."
  },
  {
    q: "How would you choose between Dense Retrieval, BM25, and Hybrid Retrieval?",
    a: "BM25 (sparse retrieval) relies on exact keyword matching, which makes it excellent for specific terminology, SKUs, or names, but it fails at capturing semantic intent or synonyms. Dense retrieval (vector search) captures semantic meaning and conceptual similarity, making it great for natural language queries, but it can miss exact phrasing. Hybrid retrieval combines both, typically using Reciprocal Rank Fusion (RRF) or a convex combination of scores, to get the best of both worlds. I would choose Hybrid Retrieval by default for most production RAG systems, dropping to BM25 only if the data is heavily keyword-focused and latency/cost is a strict constraint."
  },
  {
    q: "How would you optimize RAG for the trade-off between quality, latency, cost, and scalability?",
    a: "Quality can be maximized using advanced techniques like query expansion, hybrid search, and cross-encoder reranking, but these increase latency and cost. To optimize the trade-off, I'd use caching for common queries (Semantic Cache) to instantly serve high-quality answers with zero LLM/reranker cost. I would use smaller, specialized embedding models (e.g., BGE-small) instead of large generic ones, and leverage quantization for models to reduce memory footprint. For the LLM generation step, I'd stream responses to improve perceived latency, and potentially route simpler queries to smaller, cheaper LLMs (like Llama-3-8B or GPT-4o-mini) while saving larger models for complex reasoning tasks."
  },
  {
    q: "When is fine-tuning actually needed in a RAG system, and when is better retrieval enough?",
    a: "Better retrieval (and prompt engineering) is enough 95% of the time, especially when the required knowledge is explicitly stated in the documents and the task is standard QA. Fine-tuning becomes necessary when: 1) The model needs to adopt a specific tone, format, or structure that is difficult to enforce via prompting. 2) The model needs to learn domain-specific jargon or reasoning patterns not present in its base training. 3) You need to reduce latency/cost by moving from a large generic model to a smaller, fine-tuned model. In RAG, fine-tuning teaches the model *how* to answer, while retrieval provides *what* to answer."
  },
  {
    q: "When does Fine-tuning + RAG make sense together, and what should be fine-tuned?",
    a: "Fine-tuning + RAG makes sense when you need the model to synthesize retrieved information in highly specialized ways (e.g., generating complex legal briefs from retrieved case law, or diagnostic reports from patient records) while ensuring the factual payload is grounded in real-time data. You typically fine-tune the LLM to better follow instructions, structure outputs, and refuse to answer if the retrieved context is insufficient (reducing hallucinations). You can also fine-tune the embedding model (using Contrastive Learning) to better capture domain-specific semantic similarity that off-the-shelf embeddings miss."
  },
  {
    q: "How would you design a RAG system for multimodal documents containing text, tables, images, charts, and scanned PDFs?",
    a: "I would use a specialized multimodal ingestion pipeline (e.g., Unstructured.io or a VLM like GPT-4V/Claude 3) to parse the documents. Text is chunked normally. Tables are extracted as HTML, Markdown, or converted into text summaries to preserve structure. Images and charts are passed to a VLM to generate dense textual descriptions, which are then embedded and indexed. Alternatively, I would use a multimodal embedding model (like CLIP or ColPali) to embed images and text into the same vector space. At retrieval time, the query retrieves the relevant text, table structures, and image summaries, feeding them all to a multimodal LLM to synthesize the final answer."
  },
  {
    q: "How would you detect and recover from poor retrieval, missing context, and hallucinations in production?",
    a: "I would implement Ragas or TruLens style evaluation metrics in production (e.g., Context Precision, Context Recall, Faithfulness, and Answer Relevance). To detect issues on the fly, I'd use an LLM-as-a-judge (or a smaller classifier) to check if the generated answer is grounded in the retrieved context (Faithfulness) and if it actually answers the user's query. If the context is deemed irrelevant before generation, the system can trigger a fallback (e.g., web search, query reformulation, or escalating to a human). If hallucinations are detected post-generation, the system can self-correct or append a disclaimer."
  },
  {
    q: "How would you design RAG for real-time/continuously changing data while keeping the vector index consistent?",
    a: "I would use a streaming architecture (e.g., Kafka or AWS Kinesis) connected to an embedding microservice that continuously processes incoming data changes (inserts, updates, deletes). The vector database must support real-time upserts and deletions (like Pinecone, Milvus, or Weaviate). For updates/deletes, I'd track document metadata (e.g., document ID, chunk ID, timestamp). When a document changes, the system deletes all existing chunks associated with that document ID and re-ingests the new chunks. To ensure consistency without locking the entire DB, I'd use versioning in the metadata and filter out stale versions during retrieval."
  },
  {
    q: "How would you evaluate and continuously improve a production RAG system across retrieval quality, answer quality, latency, and cost?",
    a: "I would establish a golden dataset of diverse queries and expected answers/contexts. For retrieval quality, I'd track metrics like NDCG@k and MRR@k using telemetry logs, combined with implicit user feedback (e.g., clicks on citations). For answer quality, I'd use LLM-as-a-judge for automated tracking of Faithfulness and Answer Relevance, alongside explicit user feedback (thumbs up/down). For latency and cost, I'd use observability tools (like LangSmith, Datadog, or Arize) to track token usage, time-to-first-token (TTFT), and embedding API costs. Continuous improvement involves analyzing poor-performing queries, adding them to the golden dataset, and iteratively tweaking chunking strategies, retrieval hyperparameters, or prompts."
  }
];

export default function InterviewQuestions() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div id="interview-questions" className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-12 mb-8">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex items-center gap-3">
        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
          <MessageCircleQuestion size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Advanced RAG Interview Questions</h2>
          <p className="text-sm text-slate-500">Explore in-depth answers to complex RAG architecture scenarios.</p>
        </div>
      </div>
      
      <div className="divide-y divide-slate-100">
        {questions.map((item, index) => (
          <div key={index} className="transition-all duration-200">
            <button
              onClick={() => toggleQuestion(index)}
              className="w-full px-6 py-4 flex items-start justify-between text-left hover:bg-slate-50 focus:outline-none"
            >
              <span className="font-medium text-slate-800 pr-8">{index + 1}. {item.q}</span>
              <span className="text-slate-400 mt-1 flex-shrink-0">
                {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            </button>
            
            {openIndex === index && (
              <div className="px-6 pb-5 pt-2 text-slate-600 bg-slate-50/50">
                <div className="pl-4 border-l-2 border-indigo-200 leading-relaxed text-sm">
                  {item.a}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
