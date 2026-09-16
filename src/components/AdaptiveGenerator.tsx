import { useState, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { X, ChevronDown, ChevronUp, ExternalLink, Calculator, Clock, Cpu, CheckCircle, Download, BookOpen, Layers } from 'lucide-react';
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
      { id: 'langgraph', name: 'LangGraph / LlamaIndex Agents', description: 'Stateful agentic routing with LLM structured outputs and loops.', url: 'https://python.langchain.com/v0.1/docs/langgraph/', costText: 'LLM Query Cost', costValue: 6, latencyText: '~1s', latencyMs: 1000, complexity: 'High' },
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
      { id: 'gpt4o', name: 'GPT-4o / Claude 3.5 Sonnet', description: 'Frontier models. Standard for enterprise RAG.', url: 'https://platform.openai.com/docs/models/gpt-4o', costText: '~$4.00 / 1M Input', costValue: 8, latencyText: '~1.5s', latencyMs: 1500, complexity: 'Low' },
      { id: 'llama3_70b', name: 'Llama 3.1 70B / Qwen', description: 'Open-weight champions. Excellent for secure self-hosting.', url: 'https://llama.meta.com/', costText: 'GPU Hosting ($$$)', costValue: 9, latencyText: '~800ms', latencyMs: 800, complexity: 'High' },
      { id: 'gemini15', name: 'Gemini 1.5 Pro', description: 'Massive 2M token context for "needle in haystack".', url: 'https://deepmind.google/technologies/gemini/pro/', costText: '$3.50 / 1M Input', costValue: 7, latencyText: '~2.0s', latencyMs: 2000, complexity: 'Low' },
      { id: 'mistral_mixtral', name: 'Mistral Large / Command R+', description: 'Excellent at instruction following, multilinguality, and tool use.', url: 'https://mistral.ai/', costText: '$3.00 / 1M Input', costValue: 6, latencyText: '~1.5s', latencyMs: 1500, complexity: 'Low' }
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
  user_query: {
    title: 'User Query & Intent',
    educationalConcept: 'The entry point of the Inference pipeline. Advanced systems capture not just the text, but the user context, history, and implicit intent.',
    features: ['Query Capture', 'Chat History', 'Context Injection'],
    options: [
      { id: 'ui', name: 'Frontend Interface', description: 'Standard chat UI or API endpoint receiving the user request.', url: '', costText: 'Free', costValue: 0, latencyText: 'Realtime', latencyMs: 10, complexity: 'Low' }
    ]
  }
};

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
  
  const [selectedTech, setSelectedTech] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.keys(techDetails).forEach(k => {
      initial[k] = techDetails[k].options[0].id;
    });
    return initial;
  });

  const [selectedNodeCategory, setSelectedNodeCategory] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
    const parsers: string[] = [];
    let parserY = 150;
    const parseX = nextX;
    
    if (dataTypes.has('pdf_text')) {
      const id = 'parse_text';
      parsers.push(id);
      addNode(id, parseX, parserY, 'Text Parser', 'bg-indigo-50 border-2 border-indigo-400 p-2 rounded w-36 text-sm text-center', 'parse_text');
      addEdge(postIngestId, id);
      parserY += 100;
    }
    
    if (dataTypes.has('pdf_mixed')) {
      const id = 'parse_ocr';
      parsers.push(id);
      addNode(id, parseX, parserY, 'Vision & OCR', 'bg-pink-50 border-2 border-pink-400 p-2 rounded w-36 text-sm text-center', 'parse_ocr');
      addEdge(postIngestId, id);
      parserY += 100;
    }
    
    if (dataTypes.has('csv')) {
      const id = 'parse_csv';
      parsers.push(id);
      addNode(id, parseX, parserY, 'Structured Data', 'bg-emerald-50 border-2 border-emerald-400 p-2 rounded w-36 text-sm text-center', 'parse_csv');
      addEdge(postIngestId, id);
    }

    // 3. Chunking
    nextX = parseX + 220;
    const chunkId = 'chunking';
    addNode(chunkId, nextX, 250, 'Chunking Strategy', 'bg-amber-50 border-2 border-amber-400 p-2 rounded w-36 text-sm text-center', 'chunking');
    parsers.forEach(p => addEdge(p, chunkId));

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

    let retrieveOutputId = storeId;

    if (scale === 'enterprise') {
      const sparseId = 'sparse';
      addNode(sparseId, nextX, storeY + 120, 'Sparse Index', 'bg-emerald-50 border-2 border-emerald-400 p-2 rounded w-44 text-sm text-center', 'sparse');
      addEdge(embedId, sparseId);
      
      nextX += 240;
      const fusionId = 'fusion';
      addNode(fusionId, nextX, 250, 'Hybrid Fusion + Rerank', 'bg-orange-100 border-2 border-orange-500 p-3 rounded w-44 font-bold text-center', 'fusion');
      addEdge(storeId, fusionId);
      addEdge(sparseId, fusionId);
      retrieveOutputId = fusionId;
    }
    
    // 6. Router & Logic
    nextX += 250;
    
    // Add User Query Node connecting to Router
    const queryId = 'user_query';
    addNode(queryId, nextX, 420, '👤 User Query', 'bg-fuchsia-100 border-2 border-fuchsia-500 p-3 rounded w-44 font-bold text-center text-fuchsia-900', 'user_query');

    const routerId = 'router';
    addNode(routerId, nextX, 250, mode === 'agentic' ? 'Adaptive Agent Router' : 'Semantic Router', 'bg-blue-100 border-2 border-blue-500 p-3 rounded w-44 font-bold text-center', 'router');
    
    addEdge(queryId, routerId, 'Ask');
    addEdge(retrieveOutputId, routerId, 'Retrieve');
    if (useGraph) addEdge('graphrag', routerId, 'Query Graph');

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

    if (useServing) {
      nextX += 220;
      const serveId = 'serving';
      addNode(serveId, nextX, 250, 'Serving Engine', 'bg-indigo-200 border-2 border-indigo-600 p-2 rounded w-40 text-sm text-center font-bold', 'serving');
      addEdge(postGenId, serveId);
      postGenId = serveId;
    }

    if (useEval) {
      const evalId = 'eval';
      addNode(evalId, nextX, 100, 'Observability & Eval', 'bg-teal-100 border-2 border-teal-500 p-2 rounded w-44 text-sm text-center', 'eval');
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
    const executionCategories = ['embed', 'store_local', 'store_enterprise', 'sparse', 'fusion', 'router', 'cache', 'security', 'gen', 'graphrag', 'data_quality', 'context_compress', 'serving'];
    
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

  const onNodeClick = useCallback((_: any, node: Node) => {
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
    doc.text('My Advanced Agentic RAG Blueprint', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated via Agentic RAG Explainer', 20, yPos);
    yPos += 15;
    
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
      
      yPos += 6;
    });

    doc.save('rag-architecture-blueprint.pdf');
  };

  const TechItemCard = ({ item, isSelected, category }: { item: TechItem, isSelected: boolean, category: string }) => {
    const isExpanded = expandedItem === item.id;
    return (
      <div className={`border rounded-lg p-3 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
        <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleExpanded(item.id)}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
              <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                {item.name}
              </span>
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
                onClick={() => setScale('prototype')}
                className={`flex-1 py-1 text-[11px] font-bold rounded transition-colors ${scale === 'prototype' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Prototype
              </button>
              <button 
                onClick={() => setScale('enterprise')}
                className={`flex-1 py-1 text-[11px] font-bold rounded transition-colors ${scale === 'enterprise' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Enterprise
              </button>
            </div>
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
              <button 
                onClick={() => setMode('standard')}
                className={`flex-1 py-1 text-[11px] font-bold rounded transition-colors ${mode === 'standard' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Linear Router
              </button>
              <button 
                onClick={() => setMode('agentic')}
                className={`flex-1 py-1 text-[11px] font-bold rounded transition-colors ${mode === 'agentic' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Agentic Router
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 pb-2">
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
          <div className="absolute top-4 right-4 z-20 w-[24rem] max-h-[95%] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl p-5 flex flex-col transform transition-all custom-scrollbar">
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-2 border-b border-slate-100 z-10">
              <h3 className="font-bold text-lg text-slate-900 leading-tight pr-4">
                Configure: {techDetails[selectedNodeCategory].title}
              </h3>
              <button 
                onClick={() => setSelectedNodeCategory(null)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
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
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">Select Technology</h4>
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
