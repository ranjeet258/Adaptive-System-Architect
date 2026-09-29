import { useState, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { X, ChevronDown, ChevronUp, ExternalLink, Calculator, Clock, Cpu, CheckCircle, Download, BookOpen, Layers, Sparkles, AlertTriangle, Info, Wand2, Table2 } from 'lucide-react';
import jsPDF from 'jspdf';
import '@xyflow/react/dist/style.css';

type DataType = 'pdf_text' | 'pdf_mixed' | 'csv';
type Scale = 'prototype' | 'enterprise';
type Mode = 'standard' | 'agentic';

interface TechItem {
  id: string;
  name: string;
  description: string;
  url?: string;
  costText: string;
  costValue: number;
  latencyText: string;
  latencyMs: number;
  complexity: 'Low' | 'Medium' | 'High';
}

interface NodeDetails {
  title: string;
  educationalConcept: string;
  features: string[];
  options: TechItem[];
}

// -------------------------------------------------------------
// EXHAUSTIVE Tech Stack with Educational Concepts
// -------------------------------------------------------------
const techDetails: Record<string, NodeDetails> = {
  ingest: {
    title: 'Document Ingestion & Streaming',
    educationalConcept: 'Ingestion extracts data from various sources (databases, web, files). For production, use incremental streaming RAG so you only re-index changed documents rather than rebuilding the entire DB.',
    features: ['Crawls raw files', 'Incremental updates', 'Message queues'],
    options: [
      { id: 's3_kafka', name: 'S3 + Kafka / Redis Streams', description: 'Enterprise standard for streaming document updates dynamically.', url: 'https://kafka.apache.org/', costText: 'High Infra Cost', costValue: 7, latencyText: 'Async', latencyMs: 50, complexity: 'High' },
      { id: 'airbyte', name: 'Airbyte / Fivetran', description: 'Standard ELT connectors for syncing databases and SaaS apps.', url: 'https://airbyte.com/', costText: 'Volume based', costValue: 5, latencyText: 'Batch (Mins/Hrs)', latencyMs: 5000, complexity: 'Medium' },
      { id: 'dagster', name: 'Dagster / Airflow / Temporal', description: 'Data orchestration pipelines for scheduled batch ingestion and retries.', url: 'https://dagster.io/', costText: 'Compute', costValue: 4, latencyText: 'Scheduled', latencyMs: 5000, complexity: 'Medium' },
      { id: 'llamahub', name: 'LlamaHub / LangChain Loaders', description: 'Prototyping loaders (PyPDFLoader, WebBaseLoader).', url: 'https://llamahub.ai/', costText: 'Free', costValue: 1, latencyText: 'Synchronous', latencyMs: 200, complexity: 'Low' },
      { id: 'apache_tika', name: 'Apache Tika', description: 'Battle-tested Java powerhouse for extracting metadata from thousands of file formats.', url: 'https://tika.apache.org/', costText: 'Compute', costValue: 2, latencyText: 'Synchronous', latencyMs: 300, complexity: 'Medium' }
    ]
  },
  data_quality: {
    title: 'Data Quality & Cleaning',
    educationalConcept: 'Garbage in, garbage out. Before chunking, raw text must be deduplicated, cleaned of artifacts, and scanned for PII (Personal Identifiable Information).',
    features: ['Deduplication', 'Normalization', 'PII Redaction'],
    options: [
      { id: 'great_expectations', name: 'Great Expectations / Pandera', description: 'Define strict expectations and schemas for incoming data quality.', url: 'https://greatexpectations.io/', costText: 'Compute', costValue: 3, latencyText: '~500ms', latencyMs: 500, complexity: 'Medium' },
      { id: 'presidio', name: 'Microsoft Presidio (PII)', description: 'Industry standard for redacting sensitive PII before it hits the embedding model.', url: 'https://microsoft.github.io/presidio/', costText: 'Compute', costValue: 4, latencyText: '~300ms', latencyMs: 300, complexity: 'High' },
      { id: 'custom_clean', name: 'Regex / Custom Script', description: 'Basic string replacement and whitespace normalization.', url: 'https://docs.python.org/3/library/re.html', costText: 'Free', costValue: 0, latencyText: '<5ms', latencyMs: 5, complexity: 'Low' }
    ]
  },
  parse_text: {
    title: 'Text & Document Parsing',
    educationalConcept: 'Parsing strips away noise while preserving structural semantics (headers, tables).',
    features: ['Extracts text', 'Preserves document structure'],
    options: [
      { id: 'unstructured', name: 'Unstructured.io / Docling', description: 'Enterprise-grade parsing. Excellent at handling complex tables.', url: 'https://unstructured.io/', costText: '$1.00 / 1K pages', costValue: 4, latencyText: '~1s', latencyMs: 1000, complexity: 'Medium' },
      { id: 'llamaparse', name: 'LlamaParse / Marker', description: 'High fidelity parsing specifically tuned for RAG tabular extraction.', url: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/connector/llama_parse/', costText: 'Freemium', costValue: 3, latencyText: '~2s', latencyMs: 2000, complexity: 'Low' },
      { id: 'pdfplumber', name: 'pdfplumber / PyMuPDF', description: 'Great for exact visual bounding boxes and clean PDFs.', url: 'https://github.com/jsvine/pdfplumber', costText: 'Free', costValue: 0, latencyText: '~100ms', latencyMs: 100, complexity: 'Low' },
      { id: 'docx', name: 'python-docx / Mammoth', description: 'Specialized for Microsoft Word DOCX extraction.', url: 'https://python-docx.readthedocs.io/', costText: 'Free', costValue: 0, latencyText: '<50ms', latencyMs: 50, complexity: 'Low' },
      { id: 'html', name: 'BeautifulSoup / Playwright', description: 'Standard toolset for scraping static and JS-rendered Web pages.', url: 'https://www.crummy.com/software/BeautifulSoup/', costText: 'Free/Compute', costValue: 1, latencyText: '~50-1000ms', latencyMs: 500, complexity: 'Medium' }
    ]
  },
  parse_ocr: {
    title: 'Vision & OCR Pipeline',
    educationalConcept: 'For scans and complex layouts. Sophisticated pipelines first classify if the PDF is text-native; if not, they route to OCR or Vision-language models (VLMs).',
    features: ['Handwriting recognition', 'Chart extraction'],
    options: [
      { id: 'gpt4_vision', name: 'Qwen2.5-VL / GPT-4o Vision', description: 'Frontier Vision-Language Models for unmatched chart and layout reasoning.', url: 'https://platform.openai.com/docs/guides/vision', costText: 'High API Cost', costValue: 8, latencyText: '~3s', latencyMs: 3000, complexity: 'Low' },
      { id: 'gcp_docai', name: 'Google Doc AI / Azure Doc Intel', description: 'Cloud managed enterprise OCR for forms and receipts.', url: 'https://cloud.google.com/document-ai', costText: '$1.50 / 1K pages', costValue: 6, latencyText: '~1s', latencyMs: 1000, complexity: 'Medium' },
      { id: 'paddleocr', name: 'PaddleOCR / EasyOCR / Surya', description: 'High-performance open-source OCR models running locally.', url: 'https://github.com/PaddlePaddle/PaddleOCR', costText: 'GPU Compute', costValue: 3, latencyText: '~300ms', latencyMs: 300, complexity: 'High' },
      { id: 'tesseract', name: 'Tesseract', description: 'The classic engine. Fast, local, but struggles with complex layouts.', url: 'https://github.com/tesseract-ocr/tesseract', costText: 'Free', costValue: 0, latencyText: '~500ms', latencyMs: 500, complexity: 'Low' }
    ]
  },
  parse_csv: {
    title: 'Structured Data Processor',
    educationalConcept: 'Tabular data should NEVER be embedded as text. Parse it into an analytical engine so an Agent can write Text-to-SQL or use DataFrame logic.',
    features: ['Reads tables', 'Executes SQL/Pandas'],
    options: [
      { id: 'duckdb', name: 'DuckDB + Text-to-SQL', description: 'Ultra-fast local analytical SQL queries over CSVs.', url: 'https://duckdb.org/', costText: 'Free', costValue: 0, latencyText: '<10ms', latencyMs: 5, complexity: 'Medium' },
      { id: 'polars', name: 'Polars / Pandas / PyArrow', description: 'DataFrame Agents execute Python code to answer analytical queries.', url: 'https://pola.rs/', costText: 'Free', costValue: 0, latencyText: '<5ms', latencyMs: 2, complexity: 'Low' },
      { id: 'sql', name: 'PostgreSQL / Snowflake / BigQuery', description: 'Directly routing structured questions to enterprise data warehouses.', url: 'https://www.postgresql.org/', costText: 'Enterprise DB', costValue: 6, latencyText: '~100ms', latencyMs: 100, complexity: 'High' }
    ]
  },
  chunking: {
    title: 'Chunking Strategy',
    educationalConcept: 'Breaking documents into semantic boundaries. Advanced architectures use Late Chunking or Parent-Child (embed small chunks for accuracy, retrieve the large parent for context).',
    features: ['Manages token limits', 'Preserves semantics'],
    options: [
      { id: 'semantic', name: 'Semantic / Chonkie', description: 'Splits by topic changes using cosine similarity.', url: 'https://python.langchain.com/v0.1/docs/modules/data_connection/document_transformers/semantic-chunker/', costText: 'Compute/API cost', costValue: 2, latencyText: '~200ms', latencyMs: 200, complexity: 'Medium' },
      { id: 'hierarchical', name: 'Parent-Child / Hierarchical', description: 'Embeds small chunks, but retrieves the larger parent document.', url: 'https://docs.llamaindex.ai/en/stable/examples/retrievers/auto_merging_retriever/', costText: 'Free', costValue: 1, latencyText: '~10ms', latencyMs: 10, complexity: 'Medium' },
      { id: 'recursive', name: 'Recursive / Markdown-aware', description: 'Splits by characters but respects markdown headers and code blocks.', url: 'https://python.langchain.com/docs/modules/data_connection/document_transformers/', costText: 'Free', costValue: 0, latencyText: '<1ms', latencyMs: 1, complexity: 'Low' },
      { id: 'propositional', name: 'Propositional / Agentic', description: 'LLM rewrites complex paragraphs into standalone, factual sentences.', url: 'https://arxiv.org/abs/2312.06648', costText: 'High LLM Cost', costValue: 8, latencyText: '~2s', latencyMs: 2000, complexity: 'High'},
      { id: 'late', name: 'Late Chunking', description: 'Embeds the whole document first, then applies chunk boundaries to preserve global context.', url: 'https://huggingface.co/blog/jina-late-chunking', costText: 'GPU Compute', costValue: 5, latencyText: '~100ms', latencyMs: 100, complexity: 'High'}
    ]
  },
  embed: {
    title: 'Embedding Models',
    educationalConcept: 'Dense retrieval maps text to multi-dimensional vectors. Multilingual models (BGE-M3) map similar concepts in different languages to the same vector space.',
    features: ['Dense representations', 'Multilingual support'],
    options: [
      { id: 'openai_v3', name: 'OpenAI text-embedding-3', description: 'Highly performant, cost-effective API.', url: 'https://platform.openai.com/docs/guides/embeddings', costText: '$0.13 / 1M tokens', costValue: 3, latencyText: '~200ms', latencyMs: 200, complexity: 'Low' },
      { id: 'colbert', name: 'ColBERT (Late Interaction)', description: 'Token-level semantics instead of one compressed vector. Extremely precise.', url: 'https://github.com/stanford-futuredata/ColBERT', costText: 'High (GPU Compute)', costValue: 7, latencyText: '~80ms', latencyMs: 80, complexity: 'High' },
      { id: 'bgem3', name: 'BGE-M3 / multilingual-E5', description: 'Open-source champion for multi-lingual and multi-granularity.', url: 'https://huggingface.co/BAAI/bge-m3', costText: 'Free (Self-hosted)', costValue: 2, latencyText: '~30ms', latencyMs: 30, complexity: 'Medium' },
      { id: 'voyage', name: 'Voyage AI / Cohere Embed', description: 'Domain-tuned commercial models (finance, law).', url: 'https://docs.voyageai.com/', costText: '$0.10 / 1M tokens', costValue: 3, latencyText: '~150ms', latencyMs: 150, complexity: 'Low' },
      { id: 'nomic', name: 'Nomic Embed / Jina', description: 'Leading alternatives for high-context or multimodal embeddings.', url: 'https://docs.nomic.ai/', costText: 'Varies', costValue: 2, latencyText: '~150ms', latencyMs: 150, complexity: 'Medium' }
    ]
  },
  store_local: {
    title: 'Local Vector DB',
    educationalConcept: 'Uses algorithms like HNSW (Hierarchical Navigable Small World) or IVF-PQ to perform Approximate Nearest Neighbor (ANN) search.',
    features: ['In-memory storage', 'HNSW indexing'],
    options: [
      { id: 'chroma', name: 'ChromaDB', description: 'Developer-friendly local vector store.', url: 'https://www.trychroma.com/', costText: 'Free', costValue: 0, latencyText: '<10ms', latencyMs: 5, complexity: 'Low' },
      { id: 'lancedb', name: 'LanceDB', description: 'Serverless, zero-setup vector DB built on Lance (Arrow-compatible).', url: 'https://lancedb.com/', costText: 'Free', costValue: 0, latencyText: '<5ms', latencyMs: 5, complexity: 'Low' },
      { id: 'faiss', name: 'FAISS (Meta)', description: 'Bare-metal C++ library for ultra-fast similarity search.', url: 'https://faiss.ai/', costText: 'Free', costValue: 0, latencyText: '<2ms', latencyMs: 2, complexity: 'Medium' }
    ]
  },
  store_enterprise: {
    title: 'Enterprise Vector DB',
    educationalConcept: 'Provides massive scale and crucial Metadata Filtering (e.g., filter by department=Finance THEN vector search).',
    features: ['Massive scale', 'Metadata filtering', 'RBAC'],
    options: [
      { id: 'pinecone', name: 'Pinecone Serverless', description: 'Managed option. Scales automatically.', url: 'https://www.pinecone.io/', costText: '$0.33 / 100K reads', costValue: 5, latencyText: '~40ms', latencyMs: 40, complexity: 'Low' },
      { id: 'qdrant', name: 'Qdrant / Weaviate', description: 'Offers massive scale, hybrid search, and great metadata filtering.', url: 'https://qdrant.tech/', costText: 'Cluster Hosting ($$)', costValue: 6, latencyText: '~20ms', latencyMs: 20, complexity: 'Medium' },
      { id: 'milvus', name: 'Milvus / Zilliz', description: 'Massively scalable open-source vector DB, great for billions of vectors.', url: 'https://milvus.io/', costText: 'Cluster Hosting ($$)', costValue: 6, latencyText: '~25ms', latencyMs: 25, complexity: 'High' },
      { id: 'pgvector', name: 'pgvector (PostgreSQL)', description: 'Best choice if your data is already in PostgreSQL. ACID compliant.', url: 'https://github.com/pgvector/pgvector', costText: 'RDS Hosting Cost', costValue: 4, latencyText: '~30-50ms', latencyMs: 40, complexity: 'Medium' },
      { id: 'cloud', name: 'Vertex AI / Azure AI Search', description: 'Cloud native managed enterprise search endpoints.', url: 'https://cloud.google.com/vertex-ai', costText: 'Cloud Pricing', costValue: 7, latencyText: '~50ms', latencyMs: 50, complexity: 'Medium' }
    ]
  },
  graphrag: {
    title: 'Knowledge Graph (GraphRAG)',
    educationalConcept: 'Extracts entities and relationships into a network. Solves "Multi-Hop" queries (e.g. "Who founded the company acquired by X?").',
    features: ['Entity extraction', 'Relationship mapping'],
    options: [
      { id: 'neo4j', name: 'Neo4j / FalkorDB', description: 'Industry standard native graph databases.', url: 'https://neo4j.com/', costText: 'DB Hosting ($$)', costValue: 6, latencyText: '~100ms', latencyMs: 100, complexity: 'High' },
      { id: 'ms_graphrag', name: 'Microsoft GraphRAG', description: 'Builds hierarchical graphs of communities to answer global dataset questions.', url: 'https://microsoft.github.io/graphrag/', costText: 'High LLM Extraction Cost', costValue: 8, latencyText: 'Async Gen', latencyMs: 200, complexity: 'High' },
      { id: 'amazon_neptune', name: 'Amazon Neptune / Memgraph', description: 'AWS managed or in-memory high-speed graph databases.', url: 'https://aws.amazon.com/neptune/', costText: 'DB Hosting ($$)', costValue: 7, latencyText: '~20-100ms', latencyMs: 80, complexity: 'Medium' }
    ]
  },
  sparse: {
    title: 'Sparse Index (Keyword)',
    educationalConcept: 'Dense embeddings fail at exact keyword matching (like ID "RX-9000"). Sparse retrieval uses traditional algorithms (BM25, TF-IDF).',
    features: ['Exact keyword matching'],
    options: [
      { id: 'opensearch', name: 'Elasticsearch / OpenSearch', description: 'Undisputed standard for TF-IDF based sparse retrieval.', url: 'https://opensearch.org/', costText: 'Cluster Hosting ($$)', costValue: 6, latencyText: '~20ms', latencyMs: 20, complexity: 'High' },
      { id: 'splade', name: 'SPLADE / uniCOIL', description: 'Learned sparse models that expand queries into a sparse vocabulary.', url: 'https://github.com/naver/splade', costText: 'GPU Compute', costValue: 4, latencyText: '~50ms', latencyMs: 50, complexity: 'High' },
      { id: 'vespa', name: 'Vespa / BM25', description: 'Yahoo\'s massive-scale serving engine for hybrid search.', url: 'https://vespa.ai/', costText: 'Varies', costValue: 5, latencyText: '~15ms', latencyMs: 15, complexity: 'Medium' }
    ]
  },
  fusion: {
    title: 'Hybrid Fusion & Reranking',
    educationalConcept: 'Reciprocal Rank Fusion (RRF) mathematically merges Dense and Sparse lists. A Cross-Encoder Reranker then reads the query and docs together to score precision.',
    features: ['RRF Merging', 'Cross-encoder scoring'],
    options: [
      { id: 'cohere_rerank', name: 'RRF + Cohere / Voyage Rerank', description: 'Scores the top 100 docs against the query directly.', url: 'https://cohere.com/rerank', costText: '$2.00 / 1K queries', costValue: 5, latencyText: '~200ms', latencyMs: 200, complexity: 'Low' },
      { id: 'bge_reranker', name: 'RRF + BGE / Jina Reranker', description: 'Open-source state-of-the-art alternative for reranking.', url: 'https://huggingface.co/BAAI/bge-reranker-v2-m3', costText: 'GPU Compute', costValue: 3, latencyText: '~100ms', latencyMs: 100, complexity: 'Medium' }
    ]
  },
  router: {
    title: 'Query Router & Agentic Flow',
    educationalConcept: 'Adaptive RAG dynamically decides pipeline paths based on intent. "What is RAG?" -> Vector Search. "Compare revenue" -> SQL Agent. "Explain diagram" -> Vision RAG.',
    features: ['Query classification', 'Query rewriting (HyDE)', 'Agentic routing'],
    options: [
      { id: 'langgraph', name: 'LangGraph / LlamaIndex Agents', description: 'Stateful agentic routing with LLM structured outputs and loops.', url: 'https://langchain-ai.github.io/langgraph/', costText: 'LLM Query Cost', costValue: 6, latencyText: '~1s', latencyMs: 1000, complexity: 'High' },
      { id: 'crewai_autogen', name: 'CrewAI / AutoGen', description: 'Frameworks for building specialized agent swarms that converse.', url: 'https://www.crewai.com/', costText: 'High LLM Cost', costValue: 8, latencyText: '~2-5s', latencyMs: 3000, complexity: 'High' },
      { id: 'semantic_router', name: 'Semantic Router (Embeddings)', description: 'Super fast router classifying intent via embeddings in milliseconds.', url: 'https://github.com/aurelio-labs/semantic-router', costText: 'Free', costValue: 0, latencyText: '<20ms', latencyMs: 20, complexity: 'Low' },
      { id: 'zeroshot', name: 'Zero-shot Classifier', description: 'Uses small NLP models to route without LLM latency.', url: 'https://huggingface.co/facebook/bart-large-mnli', costText: 'Compute', costValue: 2, latencyText: '~50ms', latencyMs: 50, complexity: 'Medium' }
    ]
  },
  context_compress: {
    title: 'Context Compression',
    educationalConcept: 'Instead of passing entire chunks to the LLM, compress them by extracting only the relevant sentences to save cost, latency, and reduce noise.',
    features: ['Sentence filtering', 'LLM-based extraction'],
    options: [
      { id: 'llm_compress', name: 'LLM Extractive Compression', description: 'Uses a small LLM to rewrite and summarize the retrieved chunks before the final generation.', url: 'https://python.langchain.com/v0.1/docs/modules/data_connection/retrievers/contextual_compression/', costText: 'LLM Compute', costValue: 4, latencyText: '~1s', latencyMs: 1000, complexity: 'Medium' },
      { id: 'sentence_filter', name: 'LangChain Contextual Compressor', description: 'Filters out irrelevant sentences based on semantic similarity.', url: 'https://python.langchain.com/v0.1/docs/modules/data_connection/retrievers/contextual_compression/', costText: 'Free', costValue: 1, latencyText: '~50ms', latencyMs: 50, complexity: 'Low' }
    ]
  },
  cache: {
    title: 'Semantic Caching Layer',
    educationalConcept: 'Caches embeddings and LLM responses. If a mathematically similar query is asked, it returns the cached answer instantly.',
    features: ['Vector similarity cache', 'Bypasses LLM'],
    options: [
      { id: 'redis', name: 'Redis / PostgreSQL Cache', description: 'Uses Vector Search to find semantically similar previous queries.', url: 'https://redis.io/docs/interact/search-and-query/vector-search/', costText: 'DB Hosting ($$)', costValue: 4, latencyText: '<10ms', latencyMs: 5, complexity: 'Medium' },
      { id: 'gptcache', name: 'GPTCache', description: 'Library specifically built to cache LLM responses locally.', url: 'https://github.com/zilliztech/GPTCache', costText: 'Free', costValue: 0, latencyText: '<5ms', latencyMs: 5, complexity: 'Low' }
    ]
  },
  security: {
    title: 'Security & Guardrails',
    educationalConcept: 'Retrieved content is untrusted data. Input/Output Guards prevent prompt injection and redact sensitive info.',
    features: ['Prompt injection detection', 'Output moderation'],
    options: [
      { id: 'nemo', name: 'NeMo Guardrails / Guardrails AI', description: 'Strict dialog flows and output structural validation.', url: 'https://github.com/NVIDIA/NeMo-Guardrails', costText: 'Compute', costValue: 2, latencyText: '~200ms', latencyMs: 200, complexity: 'High' },
      { id: 'llamaguard', name: 'Llama Guard / Lakera', description: 'Safeguard models for classifying malicious inputs/outputs.', url: 'https://ai.meta.com/research/publications/llama-guard-safeguarding-llms/', costText: 'LLM Compute', costValue: 3, latencyText: '~300ms', latencyMs: 300, complexity: 'Medium' }
    ]
  },
  gen: {
    title: 'LLM Generator (Synthesizer)',
    educationalConcept: 'The LLM synthesizes retrieved context. Fine-tuning (LoRA, PEFT) is usually for format/style, while retrieval brings the facts.',
    features: ['Context synthesis', 'Citation generation'],
    options: [
      { id: 'claude_frontier', name: 'Claude Opus 5.5 / Sonnet 5.5', description: 'Frontier models with strong long-context grounding, citations and tool use. Standard for enterprise RAG and agentic loops.', url: 'https://docs.anthropic.com/en/docs/about-claude/models', costText: 'Frontier API ($$$)', costValue: 8, latencyText: '~1.5s', latencyMs: 1500, complexity: 'Low' },
      { id: 'gpt_gemini', name: 'OpenAI GPT / Google Gemini (latest)', description: 'Other frontier API families; Gemini offers very large context windows for "needle in haystack" workloads.', url: 'https://ai.google.dev/gemini-api/docs/models', costText: 'Frontier API ($$$)', costValue: 7, latencyText: '~1.5-2s', latencyMs: 1800, complexity: 'Low' },
      { id: 'small_fast', name: 'Claude Haiku 4.5 / Small Models', description: 'Fast, cheap models. Great for prototypes, high-volume FAQ bots, and as the router/grader inside agentic loops.', url: 'https://docs.anthropic.com/en/docs/about-claude/models', costText: 'Low API ($)', costValue: 3, latencyText: '~500ms', latencyMs: 500, complexity: 'Low' },
      { id: 'open_weight', name: 'Llama / Qwen / DeepSeek (Open-weight)', description: 'Open-weight models for air-gapped or data-sovereign self-hosting. Pair with a Serving Engine.', url: 'https://huggingface.co/models?pipeline_tag=text-generation', costText: 'GPU Hosting ($$$)', costValue: 9, latencyText: '~800ms', latencyMs: 800, complexity: 'High' },
      { id: 'mistral_mixtral', name: 'Mistral / Cohere Command', description: 'Strong at instruction following, multilinguality and RAG-tuned citation output.', url: 'https://mistral.ai/', costText: 'Mid API ($$)', costValue: 6, latencyText: '~1.5s', latencyMs: 1500, complexity: 'Low' }
    ]
  },
  serving: {
    title: 'Serving & Inference Engine',
    educationalConcept: 'For open-source models, the inference engine applies optimizations like Quantization (AWQ/GGUF), Speculative Decoding, and Batching.',
    features: ['Model Serving', 'Quantization', 'Continuous Batching'],
    options: [
      { id: 'vllm', name: 'vLLM / SGLang', description: 'State-of-the-art high-throughput serving engines using PagedAttention.', url: 'https://vllm.ai/', costText: 'GPU Infra', costValue: 5, latencyText: 'High Throughput', latencyMs: 100, complexity: 'High' },
      { id: 'ollama', name: 'Ollama / llama.cpp', description: 'Easiest way to run quantized (GGUF) models locally on CPU/Mac.', url: 'https://ollama.com/', costText: 'Free', costValue: 0, latencyText: 'Varies', latencyMs: 500, complexity: 'Low' },
      { id: 'tgi', name: 'Hugging Face TGI', description: 'Production-ready toolkit for serving LLMs natively.', url: 'https://github.com/huggingface/text-generation-inference', costText: 'GPU Infra', costValue: 5, latencyText: 'High Throughput', latencyMs: 100, complexity: 'Medium' }
    ]
  },
  eval: {
    title: 'Observability & Eval',
    educationalConcept: 'RAG Triad: Context Relevance, Groundedness, Answer Relevance. Production requires OpenTelemetry tracing.',
    features: ['LLM Traces', 'LLM-as-a-judge Metrics'],
    options: [
      { id: 'langsmith', name: 'LangSmith / Langfuse / Phoenix', description: 'Deep observability platforms for tracing agent execution.', url: 'https://docs.smith.langchain.com/', costText: 'API Cost', costValue: 5, latencyText: 'Async', latencyMs: 0, complexity: 'Medium' },
      { id: 'ragas', name: 'Ragas / DeepEval / TruLens', description: 'Frameworks for automated LLM-as-a-judge metric evaluation.', url: 'https://docs.ragas.io/', costText: 'Compute', costValue: 3, latencyText: 'Async', latencyMs: 0, complexity: 'Medium' },
      { id: 'mlflow', name: 'MLflow / Galileo', description: 'Enterprise platform tracking for models and prompt versions.', url: 'https://mlflow.org/', costText: 'Hosting', costValue: 4, latencyText: 'Async', latencyMs: 0, complexity: 'High' }
    ]
  },
  reflection: {
    title: 'Self-Correction Loop (Agentic)',
    educationalConcept: 'Agentic RAG does not trust the first retrieval. A grader checks if retrieved docs are relevant and if the answer is grounded; on failure it rewrites the query, re-retrieves, or falls back to web search before answering.',
    features: ['Retrieval grading', 'Hallucination check', 'Query rewrite & retry'],
    options: [
      { id: 'crag', name: 'Corrective RAG (CRAG)', description: 'Grades retrieved docs; if relevance is low, rewrites the query and falls back to web search.', url: 'https://arxiv.org/abs/2401.15884', costText: 'LLM Grader Cost', costValue: 4, latencyText: '~600ms', latencyMs: 600, complexity: 'Medium' },
      { id: 'self_rag', name: 'Self-RAG / Reflection', description: 'Model critiques its own draft for groundedness and decides whether to retrieve again.', url: 'https://arxiv.org/abs/2310.11511', costText: 'High LLM Cost', costValue: 6, latencyText: '~1.2s', latencyMs: 1200, complexity: 'High' },
      { id: 'judge_grader', name: 'Small-model Grader (Haiku-class)', description: 'Cheap, fast LLM-as-judge validating relevance and groundedness in a single pass.', url: 'https://docs.anthropic.com/en/docs/about-claude/models', costText: 'Low LLM Cost', costValue: 2, latencyText: '~300ms', latencyMs: 300, complexity: 'Low' },
      { id: 'web_fallback', name: 'Web Search Fallback (Tavily / Exa)', description: 'When internal knowledge is insufficient, the agent searches the live web.', url: 'https://tavily.com/', costText: 'Per search', costValue: 3, latencyText: '~800ms', latencyMs: 800, complexity: 'Low' }
    ]
  },
  user_query: {
    title: 'User Query & Intent',
    educationalConcept: 'The entry point of the Inference pipeline. Advanced systems capture not just the text, but the user context, history, and implicit intent.',
    features: ['Query Capture', 'Chat History', 'Context Injection'],
    options: [
      { id: 'ui', name: 'Frontend Interface', description: 'Standard chat UI or API endpoint receiving the user request.', url: '', costText: 'Free', costValue: 0, latencyText: 'Realtime', latencyMs: 10, complexity: 'Low' }
    ]
  }
};

// -------------------------------------------------------------
// Adaptive recommendations: best-fit option per scale, with agentic overrides
// -------------------------------------------------------------
const RECOMMENDED: Record<string, Record<Scale, string>> = {
  ingest: { prototype: 'llamahub', enterprise: 's3_kafka' },
  data_quality: { prototype: 'custom_clean', enterprise: 'presidio' },
  parse_text: { prototype: 'pdfplumber', enterprise: 'unstructured' },
  parse_ocr: { prototype: 'paddleocr', enterprise: 'gcp_docai' },
  parse_csv: { prototype: 'duckdb', enterprise: 'sql' },
  chunking: { prototype: 'recursive', enterprise: 'hierarchical' },
  embed: { prototype: 'bgem3', enterprise: 'openai_v3' },
  store_local: { prototype: 'chroma', enterprise: 'lancedb' },
  store_enterprise: { prototype: 'pgvector', enterprise: 'qdrant' },
  graphrag: { prototype: 'neo4j', enterprise: 'ms_graphrag' },
  sparse: { prototype: 'opensearch', enterprise: 'opensearch' },
  fusion: { prototype: 'bge_reranker', enterprise: 'cohere_rerank' },
  router: { prototype: 'semantic_router', enterprise: 'semantic_router' },
  reflection: { prototype: 'judge_grader', enterprise: 'crag' },
  context_compress: { prototype: 'sentence_filter', enterprise: 'sentence_filter' },
  cache: { prototype: 'gptcache', enterprise: 'redis' },
  security: { prototype: 'llamaguard', enterprise: 'nemo' },
  gen: { prototype: 'small_fast', enterprise: 'claude_frontier' },
  serving: { prototype: 'ollama', enterprise: 'vllm' },
  eval: { prototype: 'ragas', enterprise: 'langsmith' },
  user_query: { prototype: 'ui', enterprise: 'ui' },
};

const recommendedFor = (cat: string, scale: Scale, mode: Mode) =>
  cat === 'router' && mode === 'agentic' ? 'langgraph' : RECOMMENDED[cat]?.[scale] ?? techDetails[cat].options[0].id;

const pickRecommended = (scale: Scale, mode: Mode) => {
  const picks: Record<string, string> = {};
  Object.keys(techDetails).forEach(cat => { picks[cat] = recommendedFor(cat, scale, mode); });
  return picks;
};

type Toggles = { dataQuality: boolean; graph: boolean; cache: boolean; security: boolean; compression: boolean; serving: boolean; eval: boolean };

type Preset = { id: string; name: string; emoji: string; dataTypes: DataType[]; scale: Scale; mode: Mode; toggles: Toggles; overrides?: Record<string, string> };

const PRESETS: Preset[] = [
  { id: 'docs_qa', name: 'Docs Q&A', emoji: '📄', dataTypes: ['pdf_text'], scale: 'prototype', mode: 'standard', toggles: { dataQuality: false, graph: false, cache: false, security: false, compression: false, serving: false, eval: true } },
  { id: 'support', name: 'Support Bot', emoji: '🎧', dataTypes: ['pdf_text'], scale: 'enterprise', mode: 'standard', toggles: { dataQuality: true, graph: false, cache: true, security: true, compression: false, serving: false, eval: true } },
  { id: 'knowledge', name: 'Enterprise KB', emoji: '🏢', dataTypes: ['pdf_text', 'pdf_mixed'], scale: 'enterprise', mode: 'agentic', toggles: { dataQuality: true, graph: true, cache: true, security: true, compression: true, serving: false, eval: true } },
  { id: 'analyst', name: 'Financial Analyst', emoji: '📈', dataTypes: ['pdf_text', 'csv'], scale: 'enterprise', mode: 'agentic', toggles: { dataQuality: true, graph: false, cache: false, security: true, compression: false, serving: false, eval: true } },
  { id: 'contracts', name: 'Scanned Contracts', emoji: '🖨️', dataTypes: ['pdf_mixed'], scale: 'enterprise', mode: 'standard', toggles: { dataQuality: true, graph: true, cache: false, security: true, compression: false, serving: false, eval: true } },
  { id: 'airgap', name: 'Air-gapped', emoji: '🔒', dataTypes: ['pdf_text', 'pdf_mixed'], scale: 'enterprise', mode: 'agentic', toggles: { dataQuality: true, graph: false, cache: true, security: true, compression: false, serving: true, eval: true }, overrides: { gen: 'open_weight', embed: 'bgem3', parse_ocr: 'paddleocr', store_enterprise: 'qdrant', fusion: 'bge_reranker', eval: 'ragas' } },
];

interface Advice { level: 'warn' | 'info'; text: string; fix?: { label: string; apply: () => void } }

export default function AdaptiveGenerator() {
  const [dataTypes, setDataTypes] = useState<Set<DataType>>(new Set(['pdf_text']));
  const [scale, setScale] = useState<Scale>('prototype');
  const [mode, setMode] = useState<Mode>('standard');
  const [useDataQuality, setUseDataQuality] = useState(false);
  const [useGraph, setUseGraph] = useState(false);
  const [useCache, setUseCache] = useState(false);
  const [useSecurity, setUseSecurity] = useState(false);
  const [useCompression, setUseCompression] = useState(false);
  const [useServing, setUseServing] = useState(false);
  const [useEval, setUseEval] = useState(true);

  const [selectedTech, setSelectedTech] = useState<Record<string, string>>(() => pickRecommended('prototype', 'standard'));
  const [autoAdapt, setAutoAdapt] = useState(true);

  const [selectedNodeCategory, setSelectedNodeCategory] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  // When auto-adapt is on, switching scale or router mode re-picks the recommended stack
  const applyShape = (nextScale: Scale, nextMode: Mode) => {
    setScale(nextScale);
    setMode(nextMode);
    if (autoAdapt) setSelectedTech(pickRecommended(nextScale, nextMode));
  };

  const applyPreset = (p: Preset) => {
    setDataTypes(new Set(p.dataTypes));
    setScale(p.scale);
    setMode(p.mode);
    setUseDataQuality(p.toggles.dataQuality);
    setUseGraph(p.toggles.graph);
    setUseCache(p.toggles.cache);
    setUseSecurity(p.toggles.security);
    setUseCompression(p.toggles.compression);
    setUseServing(p.toggles.serving);
    setUseEval(p.toggles.eval);
    setSelectedTech({ ...pickRecommended(p.scale, p.mode), ...p.overrides });
  };

  const toggleDataType = (type: DataType) => {
    setDataTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      if (next.size === 0) next.add('pdf_text');
      return next;
    });
  };

  const selectTechForNode = (category: string, techId: string) => {
    setSelectedTech(prev => ({ ...prev, [category]: techId }));
  };

  const toggleExpanded = (name: string) => {
    setExpandedItem(prev => prev === name ? null : name);
  };

  // Build the DAG and calculate metrics
  const { nodes, edges, metrics, activeCategories } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let edgeId = 0;

    const activeCats = new Set<string>();

    const addEdge = (source: string, target: string, label?: string) => {
      newEdges.push({ id: `e${edgeId++}`, source, target, label, animated: true, type: 'smoothstep' });
    };

    const addNode = (id: string, x: number, y: number, label: string, className: string, category: string) => {
      activeCats.add(category);
      const activeTechId = selectedTech[category];
      const activeTechObj = techDetails[category].options.find(o => o.id === activeTechId) || techDetails[category].options[0];

      newNodes.push({
        id, position: { x, y },
        data: { label, category, activeTechName: activeTechObj.name },
        className: `${className} cursor-pointer hover:ring-4 hover:ring-indigo-300 transition-all shadow-sm flex flex-col items-center justify-center`,
      });
    };

    let startX = 50;

    // 1. Data Ingestion
    const ingestId = 'ingest';
    addNode(ingestId, startX, 300, scale === 'enterprise' ? 'Streaming Ingest' : 'Local Ingest', 'bg-slate-100 border-2 border-slate-300 font-bold p-3 rounded w-40 text-center', 'ingest');

    // 1.5 Data Quality
    let nextX = startX + 220;
    let postIngestId = ingestId;
    if (useDataQuality) {
      const dqId = 'data_quality';
      addNode(dqId, nextX, 300, 'Data Quality', 'bg-cyan-50 border-2 border-cyan-400 p-2 rounded w-36 text-sm text-center', 'data_quality');
      addEdge(postIngestId, dqId);
      postIngestId = dqId;
      nextX += 200;
    }

    // 2. Parsing
    const textParsers: string[] = [];
    let parserY = 150;
    const parseX = nextX;

    if (dataTypes.has('pdf_text')) {
      const id = 'parse_text';
      textParsers.push(id);
      addNode(id, parseX, parserY, 'Text Parser', 'bg-indigo-50 border-2 border-indigo-400 p-2 rounded w-36 text-sm text-center', 'parse_text');
      addEdge(postIngestId, id);
      parserY += 100;
    }

    if (dataTypes.has('pdf_mixed')) {
      const id = 'parse_ocr';
      textParsers.push(id);
      addNode(id, parseX, parserY, 'Vision & OCR', 'bg-pink-50 border-2 border-pink-400 p-2 rounded w-36 text-sm text-center', 'parse_ocr');
      addEdge(postIngestId, id);
      parserY += 100;
    }

    // Structured data is never chunked or embedded: it is queried at runtime via Text-to-SQL
    const hasStructured = dataTypes.has('csv');
    if (hasStructured) {
      addNode('parse_csv', parseX, Math.max(parserY, 350), 'Structured Data (SQL)', 'bg-emerald-50 border-2 border-emerald-400 p-2 rounded w-36 text-sm text-center', 'parse_csv');
      addEdge(postIngestId, 'parse_csv');
    }

    const hasUnstructured = textParsers.length > 0;
    let retrieveOutputId: string | null = null;
    nextX = parseX + 220;

    if (hasUnstructured) {
      // 3. Chunking
      const chunkId = 'chunking';
      addNode(chunkId, nextX, 250, 'Chunking Strategy', 'bg-amber-50 border-2 border-amber-400 p-2 rounded w-36 text-sm text-center', 'chunking');
      textParsers.forEach(p => addEdge(p, chunkId));

      // 4. Embedding
      nextX += 220;
      const embedId = 'embed';
      addNode(embedId, nextX, 250, 'Embedding Models', 'bg-indigo-100 border-2 border-indigo-500 p-3 rounded w-40 font-bold text-center', 'embed');
      addEdge(chunkId, embedId);

      // GraphRAG Addon
      if (useGraph) {
        const graphId = 'graphrag';
        addNode(graphId, nextX, 50, 'Knowledge Graph', 'bg-purple-100 border-2 border-purple-500 p-3 rounded w-40 font-bold text-center shadow-[0_0_15px_rgba(168,85,247,0.3)]', 'graphrag');
        addEdge(chunkId, graphId, 'Extract entities');
      }

      // 5. Storage
      nextX += 240;
      const storeY = scale === 'enterprise' ? 180 : 250;
      const storeId = 'store';
      addNode(
        storeId, nextX, storeY,
        scale === 'enterprise' ? 'Enterprise Vector DB' : 'Local Vector DB',
        'bg-emerald-100 border-2 border-emerald-500 p-3 rounded w-44 font-bold text-center',
        scale === 'enterprise' ? 'store_enterprise' : 'store_local'
      );
      addEdge(embedId, storeId);
      retrieveOutputId = storeId;

      if (scale === 'enterprise') {
        const sparseId = 'sparse';
        addNode(sparseId, nextX, storeY + 120, 'Sparse Index', 'bg-emerald-50 border-2 border-emerald-400 p-2 rounded w-44 text-sm text-center', 'sparse');
        addEdge(chunkId, sparseId, 'Index terms');

        nextX += 240;
        const fusionId = 'fusion';
        addNode(fusionId, nextX, 250, 'Hybrid Fusion + Rerank', 'bg-orange-100 border-2 border-orange-500 p-3 rounded w-44 font-bold text-center', 'fusion');
        addEdge(storeId, fusionId);
        addEdge(sparseId, fusionId);
        retrieveOutputId = fusionId;
      }
    }

    // 6. Router & Logic
    nextX += 250;

    const queryId = 'user_query';
    addNode(queryId, nextX, 520, '👤 User Query', 'bg-fuchsia-100 border-2 border-fuchsia-500 p-3 rounded w-44 font-bold text-center text-fuchsia-900', 'user_query');

    const routerId = 'router';
    addNode(routerId, nextX, 250, mode === 'agentic' ? 'Adaptive Agent Router' : 'Semantic Router', 'bg-blue-100 border-2 border-blue-500 p-3 rounded w-44 font-bold text-center', 'router');

    addEdge(queryId, routerId, 'Ask');
    if (retrieveOutputId) addEdge(retrieveOutputId, routerId, 'Retrieve');
    if (hasUnstructured && useGraph) addEdge('graphrag', routerId, 'Query Graph');
    if (hasStructured) addEdge('parse_csv', routerId, 'Text-to-SQL');

    let preGenId = routerId;

    if (useCache) {
      const cacheId = 'cache';
      addNode(cacheId, nextX, 80, 'Semantic Cache', 'bg-yellow-100 border-2 border-yellow-500 p-2 rounded w-40 text-sm text-center', 'cache');
      addEdge(routerId, cacheId, 'Check cache');
    }

    if (useSecurity) {
      const secId = 'security';
      addNode(secId, nextX, 370, 'Security Guardrails', 'bg-red-100 border-2 border-red-500 p-2 rounded w-40 text-sm text-center', 'security');
      addEdge(routerId, secId, 'Validate');
      preGenId = secId;
    }

    if (useCompression) {
      nextX += 220;
      const compId = 'context_compress';
      addNode(compId, nextX, 250, 'Context Compression', 'bg-slate-200 border-2 border-slate-400 p-2 rounded w-40 text-sm text-center', 'context_compress');
      addEdge(preGenId, compId);
      preGenId = compId;
    }

    // 7. Generation
    nextX += 220;
    const genId = 'gen';
    addNode(genId, nextX, 250, 'LLM Generator', 'bg-slate-800 border-2 border-slate-900 text-white p-3 rounded w-44 font-bold text-center', 'gen');
    addEdge(preGenId, genId);

    let postGenId = genId;

    // Agentic mode: grade the answer and loop back to the router on failure
    if (mode === 'agentic') {
      const reflectId = 'reflection';
      addNode(reflectId, nextX, 430, 'Self-Correction Loop', 'bg-violet-100 border-2 border-violet-500 p-2 rounded w-44 text-sm text-center font-bold', 'reflection');
      addEdge(genId, reflectId, 'Grade answer');
      newEdges.push({ id: `e${edgeId++}`, source: reflectId, target: routerId, label: 'Rewrite & retry', type: 'smoothstep', animated: true, style: { stroke: '#8b5cf6', strokeDasharray: '6 4' } });
      postGenId = reflectId;
    }

    // Self-hosted models need an inference engine underneath the generator
    if (useServing) {
      const serveId = 'serving';
      addNode(serveId, nextX, 60, 'Serving Engine', 'bg-indigo-200 border-2 border-indigo-600 p-2 rounded w-40 text-sm text-center font-bold', 'serving');
      addEdge(serveId, genId, 'Hosts model');
    }

    if (useEval) {
      const evalId = 'eval';
      addNode(evalId, nextX + 240, 250, 'Observability & Eval', 'bg-teal-100 border-2 border-teal-500 p-2 rounded w-44 text-sm text-center', 'eval');
      addEdge(postGenId, evalId, 'Log Trace');
    }

    newNodes.forEach(n => {
      n.data.label = (
        <>
          <span className="block leading-tight mb-1">{n.data.label as string}</span>
          <span className="bg-white/70 px-2 py-0.5 rounded text-[10px] font-mono text-slate-800 block w-full truncate border border-black/10">
            {n.data.activeTechName as string}
          </span>
        </>
      );
    });

    let totalLatency = 0;
    let totalCostVal = 0;
    // Query-time components only; ingestion-side steps (parsing, chunking, data quality) run offline
    const executionCategories = ['embed', 'store_local', 'store_enterprise', 'sparse', 'fusion', 'router', 'cache', 'security', 'gen', 'graphrag', 'context_compress', 'parse_csv', 'reflection'];

    activeCats.forEach(cat => {
      const techId = selectedTech[cat];
      const tech = techDetails[cat].options.find(o => o.id === techId) || techDetails[cat].options[0];
      totalCostVal += tech.costValue;
      if (executionCategories.includes(cat)) {
        totalLatency += tech.latencyMs;
      }
    });

    return {
      nodes: newNodes,
      edges: newEdges,
      metrics: { latency: totalLatency, costScore: totalCostVal, numNodes: activeCats.size },
      activeCategories: activeCats
    };
  }, [dataTypes, scale, mode, useDataQuality, useCache, useSecurity, useEval, useGraph, useCompression, useServing, selectedTech]);

  // Pipeline advisor: rules that react to the current RAG design
  const advice: Advice[] = (() => {
    const list: Advice[] = [];
    const t = (c: string) => selectedTech[c];
    const selfHostedGen = t('gen') === 'open_weight';
    if (dataTypes.has('csv') && t('parse_csv') !== 'sql' && scale === 'enterprise') list.push({ level: 'info', text: 'Enterprise structured data usually lives in a warehouse; route Text-to-SQL there rather than to local CSV engines.', fix: { label: 'Use Warehouse', apply: () => selectTechForNode('parse_csv', 'sql') } });
    if (dataTypes.has('csv') && mode === 'standard') list.push({ level: 'info', text: 'Mixing SQL and document questions benefits from an agentic router that can pick the right tool per query.', fix: { label: 'Go Agentic', apply: () => applyShape(scale, 'agentic') } });
    if (useServing && !selfHostedGen) list.push({ level: 'warn', text: 'A serving engine is only needed for self-hosted models, but the generator is an API model.', fix: { label: 'Use open-weight LLM', apply: () => selectTechForNode('gen', 'open_weight') } });
    if (selfHostedGen && !useServing) list.push({ level: 'warn', text: 'Open-weight models need an inference engine (vLLM, TGI, Ollama) to run.', fix: { label: 'Add Serving', apply: () => setUseServing(true) } });
    if (mode === 'agentic' && t('router') === 'semantic_router') list.push({ level: 'info', text: 'Agentic mode with an embedding-only router cannot plan multi-step tool calls. Consider a stateful agent framework.', fix: { label: 'Use LangGraph', apply: () => selectTechForNode('router', 'langgraph') } });
    if (mode === 'standard' && ['langgraph', 'crewai_autogen'].includes(t('router'))) list.push({ level: 'info', text: 'An agent framework on a linear pipeline adds ~1s of LLM routing latency for little benefit.', fix: { label: 'Use Semantic Router', apply: () => selectTechForNode('router', 'semantic_router') } });
    if (scale === 'enterprise' && !useSecurity) list.push({ level: 'warn', text: 'Retrieved documents are untrusted input: enterprise RAG needs prompt-injection and PII guardrails.', fix: { label: 'Add Guardrails', apply: () => setUseSecurity(true) } });
    if (scale === 'enterprise' && !useEval) list.push({ level: 'warn', text: 'Without tracing and RAG-triad evals you cannot detect retrieval regressions or hallucinations.', fix: { label: 'Add Eval', apply: () => setUseEval(true) } });
    if (scale === 'enterprise' && !useDataQuality) list.push({ level: 'info', text: 'Deduplicate and redact PII before embedding — deleting leaked PII from a vector index later is painful.', fix: { label: 'Add Data Quality', apply: () => setUseDataQuality(true) } });
    if (useGraph && !dataTypes.has('pdf_text') && !dataTypes.has('pdf_mixed')) list.push({ level: 'info', text: 'GraphRAG needs unstructured text to extract entities from; it is hidden for SQL-only data.' });
    if (useGraph && t('graphrag') === 'ms_graphrag' && scale === 'prototype') list.push({ level: 'warn', text: 'Microsoft GraphRAG indexing is LLM-heavy and expensive for a prototype.', fix: { label: 'Use Neo4j', apply: () => selectTechForNode('graphrag', 'neo4j') } });
    if (t('chunking') === 'propositional' && scale === 'enterprise') list.push({ level: 'info', text: 'Propositional chunking calls an LLM per paragraph — indexing cost grows linearly with corpus size.' });
    if (metrics.latency > 3000) list.push({ level: 'warn', text: `Estimated latency is ~${(metrics.latency / 1000).toFixed(1)}s. Stream tokens to the UI and consider a semantic cache or a faster router.`, ...(useCache ? {} : { fix: { label: 'Add Cache', apply: () => setUseCache(true) } }) });
    if (list.length === 0) list.push({ level: 'info', text: 'No conflicts detected — the pipeline is consistent with its scale and routing mode.' });
    return list;
  })();

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    if (node.data?.category) {
      setSelectedNodeCategory(node.data.category as string);
      setExpandedItem(null);
    }
  }, []);

  const handleExport = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setTextColor(63, 81, 181);
    doc.text('RAG Architecture Blueprint', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Scale: ${scale} | Routing: ${mode} | Data: ${Array.from(dataTypes).join(', ')}`, 20, yPos);
    yPos += 13;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Pipeline Analytics', 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`- Estimated Query Latency: ~${metrics.latency}ms`, 20, yPos);
    yPos += 6;
    doc.text(`- Cost Profile Score: ${metrics.costScore} (${metrics.costScore < 20 ? 'Low/Prototype' : metrics.costScore < 40 ? 'Medium/Production' : 'Enterprise Scale'})`, 20, yPos);
    yPos += 6;
    doc.text(`- Active Pipeline Nodes: ${metrics.numNodes}`, 20, yPos);
    yPos += 15;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Architecture Stack Details', 20, yPos);
    yPos += 10;

    const sortedCats = Array.from(activeCategories);

    sortedCats.forEach(cat => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      const techId = selectedTech[cat];
      const details = techDetails[cat];
      const tech = details.options.find(o => o.id === techId) || details.options[0];

      doc.setFontSize(12);
      doc.setTextColor(40, 40, 150);
      doc.text(`[Step] ${details.title}`, 20, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`Selected Technology: ${tech.name}`, 20, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      const descLines = doc.splitTextToSize(`- Description: ${tech.description}`, 170);
      doc.text(descLines, 20, yPos);
      yPos += descLines.length * 5;

      doc.text(`- Latency Impact: ${tech.latencyText}`, 20, yPos);
      yPos += 5;
      doc.text(`- Cost Impact: ${tech.costText}`, 20, yPos);
      yPos += 5;
      doc.text(`- Complexity: ${tech.complexity}`, 20, yPos);
      yPos += 5;
      if (tech.url) {
        doc.setTextColor(0, 102, 204);
        doc.text(`- Documentation: ${tech.url}`, 20, yPos);
        doc.setTextColor(60, 60, 60);
        yPos += 5;
      }
      const alternatives = details.options.filter(o => o.id !== tech.id).map(o => o.name);
      if (alternatives.length) {
        const altLines = doc.splitTextToSize(`- Alternatives considered: ${alternatives.join('; ')}`, 170);
        doc.text(altLines, 20, yPos);
        yPos += altLines.length * 5;
      }

      yPos += 6;
    });

    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Advisor Notes', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    advice.forEach(a => {
      if (yPos > 275) { doc.addPage(); yPos = 20; }
      const lines = doc.splitTextToSize(`${a.level === 'warn' ? '[!]' : '[i]'} ${a.text}`, 170);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 5 + 2;
    });

    doc.save('rag-architecture-blueprint.pdf');
  };

  const TechItemCard = ({ item, isSelected, category }: { item: TechItem, isSelected: boolean, category: string }) => {
    const isExpanded = expandedItem === item.id;
    const isRecommended = recommendedFor(category, scale, mode) === item.id;
    return (
      <div className={`border rounded-lg p-3 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
        <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleExpanded(item.id)}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
              <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                {item.name}
              </span>
              {isRecommended && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200 font-bold">
                  <Sparkles className="w-3 h-3" /> Best fit
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                <Clock className="w-3 h-3" /> {item.latencyText}
              </span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100">
                <Calculator className="w-3 h-3" /> {item.costText}
              </span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded border border-orange-100">
                <Cpu className="w-3 h-3" /> Complexity: {item.complexity}
              </span>
            </div>
          </div>
          <div className="mt-1">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs leading-relaxed text-slate-600 mb-3">{item.description}</p>

            <div className="flex items-center justify-between">
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Documentation
                </a>
              ) : <span className="text-xs text-slate-400 italic">No link available</span>}

              {!isSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); selectTechForNode(category, item.id); }}
                  className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Select
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col xl:flex-row bg-slate-50 overflow-hidden">
      {/* Controls Panel */}
      <div className="w-full xl:w-[24rem] h-full shrink-0 flex flex-col gap-2 p-3 bg-white border-r border-slate-200 z-20 shadow-lg overflow-y-auto custom-scrollbar">

        {/* Architecture Dashboard Aggregator */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-sm shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Pipeline Analytics</h4>
            <button onClick={handleExport} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm">
              <Download className="w-3 h-3"/> EXPORT
            </button>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 flex items-center gap-2"><Clock className="w-3 h-3 text-slate-400"/> Query Latency</span>
            <span className="font-mono text-xs font-bold text-slate-900">{metrics.latency} ms</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 flex items-center gap-2"><Calculator className="w-3 h-3 text-slate-400"/> Cost Profile</span>
            <span className="font-mono text-xs font-bold text-slate-900">{metrics.costScore < 20 ? 'Low ($)' : metrics.costScore < 40 ? 'Medium ($$)' : 'Enterprise ($$$)'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 flex items-center gap-2"><Layers className="w-3 h-3 text-slate-400"/> Pipeline Nodes</span>
            <span className="font-mono text-xs font-bold text-slate-900">{metrics.numNodes}</span>
          </div>
        </div>

        <hr className="border-slate-100 my-0.5" />

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">0</span>
            Start From a Use Case
          </h4>
          <div className="grid grid-cols-3 gap-1">
            {PRESETS.map(p => (
              <button key={p.id} onClick={() => applyPreset(p)} className="text-[11px] font-semibold py-1.5 px-1 rounded border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                <span className="block text-base leading-none mb-0.5">{p.emoji}</span>{p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">1</span>
            Data & Modality
          </h4>
          <div className="flex flex-col gap-1">
            {[
              { id: 'pdf_text', label: 'Clean Documents (PDF/TXT)' },
              { id: 'pdf_mixed', label: 'Complex Scans & Images' },
              { id: 'csv', label: 'Structured Data (SQL/CSV)' },
            ].map(type => (
              <label key={type.id} className="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm">
                <input
                  type="checkbox"
                  checked={dataTypes.has(type.id as DataType)}
                  onChange={() => toggleDataType(type.id as DataType)}
                  className="accent-indigo-600 w-3 h-3"
                />
                <span className="font-medium text-slate-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">2</span>
            System Architecture
          </h4>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
              <button
                onClick={() => applyShape('prototype', mode)}
                className={`flex-1 py-1 text-[11px] font-bold rounded transition-colors ${scale === 'prototype' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Prototype
              </button>
              <button
                onClick={() => applyShape('enterprise', mode)}
                className={`flex-1 py-1 text-[11px] font-bold rounded transition-colors ${scale === 'enterprise' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Enterprise
              </button>
            </div>
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
              <button
                onClick={() => applyShape(scale, 'standard')}
                className={`flex-1 py-1 text-[11px] font-bold rounded transition-colors ${mode === 'standard' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Linear Router
              </button>
              <button
                onClick={() => applyShape(scale, 'agentic')}
                className={`flex-1 py-1 text-[11px] font-bold rounded transition-colors ${mode === 'agentic' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Agentic Router
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer" title="Re-pick recommended technologies whenever scale or routing mode changes">
                <input type="checkbox" checked={autoAdapt} onChange={() => setAutoAdapt(!autoAdapt)} className="accent-indigo-600 w-3 h-3" />
                Auto-adapt tech on change
              </label>
              <button onClick={() => setSelectedTech(pickRecommended(scale, mode))} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded hover:bg-amber-200 transition-colors">
                <Wand2 className="w-3 h-3" /> Best-fit stack
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">3</span>
            Advanced Pipeline Modules
          </h4>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm">
              <input type="checkbox" checked={useDataQuality} onChange={() => setUseDataQuality(!useDataQuality)} className="accent-indigo-600 w-3 h-3" />
              <span className="font-medium text-slate-700">Data Quality Pipeline</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm">
              <input type="checkbox" checked={useGraph} onChange={() => setUseGraph(!useGraph)} className="accent-indigo-600 w-3 h-3" />
              <span className="font-medium text-slate-700">GraphRAG (Knowledge Graph)</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm">
              <input type="checkbox" checked={useCompression} onChange={() => setUseCompression(!useCompression)} className="accent-indigo-600 w-3 h-3" />
              <span className="font-medium text-slate-700">Context Compression</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm">
              <input type="checkbox" checked={useCache} onChange={() => setUseCache(!useCache)} className="accent-indigo-600 w-3 h-3" />
              <span className="font-medium text-slate-700">Semantic Caching</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm">
              <input type="checkbox" checked={useSecurity} onChange={() => setUseSecurity(!useSecurity)} className="accent-indigo-600 w-3 h-3" />
              <span className="font-medium text-slate-700">Security Guardrails (PII)</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm">
              <input type="checkbox" checked={useServing} onChange={() => setUseServing(!useServing)} className="accent-indigo-600 w-3 h-3" />
              <span className="font-medium text-slate-700">Dedicated Serving Engine</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm">
              <input type="checkbox" checked={useEval} onChange={() => setUseEval(!useEval)} className="accent-indigo-600 w-3 h-3" />
              <span className="font-medium text-slate-700">Observability & Eval</span>
            </label>
          </div>
        </div>

        <div className="shrink-0 pb-2">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">4</span>
            Pipeline Advisor
          </h4>
          <div className="flex flex-col gap-1.5">
            {advice.map((a, i) => (
              <div key={i} className={`text-[11px] p-2 rounded border flex gap-2 ${a.level === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-sky-50 border-sky-200 text-sky-900'}`}>
                {a.level === 'warn' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="leading-snug">{a.text}</p>
                  {a.fix && (
                    <button onClick={a.fix.apply} className="mt-1 text-[10px] font-bold px-2 py-0.5 bg-white border border-current rounded hover:bg-slate-50">
                      {a.fix.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* DAG Display */}
      <div className="flex-1 h-full bg-slate-50 relative">
        <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur px-5 py-3 text-sm font-bold border border-slate-200 rounded-xl text-indigo-900 shadow-lg flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          Interactive RAG Blueprint
        </div>

        <ReactFlow
          key={`${scale}-${mode}-${Array.from(dataTypes).join('')}`}
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {/* Dynamic Tech Configurator Modal */}
        {selectedNodeCategory && techDetails[selectedNodeCategory] && (
          <div className={`absolute top-4 right-4 z-20 ${compareMode ? 'w-[40rem]' : 'w-[24rem]'} max-w-[95%] max-h-[95%] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl p-5 flex flex-col transform transition-all custom-scrollbar`}>
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-2 border-b border-slate-100 z-10">
              <h3 className="font-bold text-lg text-slate-900 leading-tight pr-4">
                Configure: {techDetails[selectedNodeCategory].title}
              </h3>
              <div className="flex gap-1">
                <button onClick={() => setCompareMode(!compareMode)} title="Compare alternatives" className={`rounded p-1 transition-colors ${compareMode ? 'bg-indigo-600 text-white' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'}`}>
                  <Table2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedNodeCategory(null)}
                  className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* EDUCATIONAL CONCEPT CARD FOR STUDENTS */}
            <div className="mb-5 bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <BookOpen className="w-4 h-4"/> Concept Explained
              </h4>
              <p className="text-sm text-indigo-900 leading-relaxed italic">
                "{techDetails[selectedNodeCategory].educationalConcept}"
              </p>
            </div>

            <div className="mb-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Node Capabilities</h4>
              <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                {techDetails[selectedNodeCategory].features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">
                {compareMode ? 'Compare Alternatives' : 'Select Technology'} <span className="text-slate-400 normal-case font-normal">— best fit for {scale} / {mode}</span>
              </h4>
              {compareMode ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-left">
                        <th className="p-2">Option</th><th className="p-2">What it does</th><th className="p-2">Latency</th><th className="p-2">Cost</th><th className="p-2">Ops</th><th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {techDetails[selectedNodeCategory].options.map(o => {
                        const isSel = selectedTech[selectedNodeCategory] === o.id;
                        return (
                          <tr key={o.id} className={`border-b border-slate-100 align-top ${isSel ? 'bg-indigo-50' : ''}`}>
                            <td className="p-2 font-semibold text-slate-800">
                              {o.name}
                              {recommendedFor(selectedNodeCategory, scale, mode) === o.id && <Sparkles className="inline w-3 h-3 ml-1 text-amber-500" />}
                            </td>
                            <td className="p-2 text-slate-600">{o.description}</td>
                            <td className="p-2 whitespace-nowrap">{o.latencyText}</td>
                            <td className="p-2 whitespace-nowrap">{o.costText}</td>
                            <td className="p-2">{o.complexity}</td>
                            <td className="p-2">
                              {isSel ? <CheckCircle className="w-4 h-4 text-indigo-600" /> : (
                                <button onClick={() => selectTechForNode(selectedNodeCategory, o.id)} className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-semibold hover:bg-indigo-700">Use</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {techDetails[selectedNodeCategory].options.map((opt) => (
                    <TechItemCard
                      key={opt.id}
                      item={opt}
                      isSelected={selectedTech[selectedNodeCategory] === opt.id}
                      category={selectedNodeCategory}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
