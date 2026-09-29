# AI System Design

An interactive, visual platform for **designing and learning system architecture**: RAG pipelines, complete software systems, and multi-agent AI systems. Every diagram is live. Toggle requirements and the architecture adapts. Click any component to learn the concept, compare alternative technologies, and pick the one that fits.

## Adaptive Designers

All three designers share the same workflow:

1. **Start from a template** (a use case or industry).
2. **Set the shape**: scale, architecture style or pattern, and capabilities.
3. **Click any component** to read the concept, see "how to decide" tips, and choose between alternative technologies. You can also open a **compare table** (pros, cons, cost, latency, complexity).
4. **Best-fit recommendations**: each option carries a ⭐ badge for your current scale and style. *Auto-adapt* re-picks the stack when you change them, and *Best-fit stack* applies every recommendation in one click.
5. **Advisor**: rule-based warnings about design conflicts, each with a one-click fix.
6. **Live estimates** of latency, cost profile and operational load.
7. **Export to PDF**: a decision record listing each choice, its trade-offs and the alternatives considered.

### 🧠 RAG Adaptive Generator
Design a Retrieval-Augmented Generation pipeline end to end: ingestion, data quality, parsing (text, OCR/vision, structured SQL), chunking, embeddings, vector/graph stores, hybrid search with reranking, routing, caching, guardrails, compression, generation, serving and evaluation.

- **Use-case templates:** Docs Q&A, Support Bot, Enterprise KB, Financial Analyst, Scanned Contracts, Air-gapped.
- **Linear vs Agentic routing:** agentic mode adds a self-correction loop (CRAG, Self-RAG, LLM grader, web fallback) that grades answers and retries.
- **Structured data** is routed through Text-to-SQL instead of being embedded.

### 🏗️ Software System Architect
Design a complete software system: clients (web, mobile), CDN, WAF, API gateway, API contract, auth, services, compute, service mesh, database, cache, search, object storage, queues and workers, real-time, notifications, payments, data warehouse, observability, CI/CD and infrastructure as code.

- **Styles:** Monolith, Microservices, Serverless. **Scales:** Startup, Growth, Hyperscale.
- **Templates:** E-commerce, B2B SaaS, Chat/Social, Media Streaming, Fintech, Serverless MVP.
- **24 component types** with 4–6 alternatives each (e.g. Postgres vs MongoDB vs DynamoDB vs CockroachDB; Kafka vs RabbitMQ vs SQS; Kubernetes vs Cloud Run vs Lambda).

### 🤖 Agent Designer
Design multi-agent AI systems for real industries.

- **10 industries**, each with its own agent roster: Customer Support, Finance (FP&A/MIS), Healthcare, Legal, E-commerce, Software Engineering, Supply Chain, Insurance Claims, IT Ops/SRE, Marketing.
- **6 orchestration patterns:** Single Agent, Sequential, Supervisor, Hierarchical, Handoff/Swarm, Evaluator Loop.
- **Autonomy levels:** Assistive, Supervised, Autonomous (controls human-in-the-loop checkpoints).
- **Alternatives for every layer:** orchestration framework (LangGraph, Claude Agent SDK, OpenAI Agents SDK, CrewAI, Microsoft Agent Framework, Google ADK), planner and worker models, tools/MCP, memory, knowledge/RAG, code sandbox, human approval, guardrails, tracing and evals, durable runtime, and agent-to-agent communication (A2A).
- **Metrics:** LLM calls per task, task latency, cost profile, and a **risk level** that combines autonomy, regulation and missing controls.

> Latency, cost and ops figures are indicative scores for comparing designs, not benchmarks or price quotes.

## Learning Sections

- **Agent Architectures:** reference agentic workflows for finance use cases (MIS, reconciliation, profitability, treasury, forecasting).
- **Concept Flow Diagrams:** step-by-step visual walkthrough of ingestion, retrieval and reranking.
- **Advanced Chunking Strategies:** semantic, structural and late chunking explained.
- **SOTA Models Overview:** foundation models, embedding models and cross-encoders.
- **Tech Stack Matrix:** vector databases, orchestration layers and deployment infrastructure compared.
- **Interview QA:** architecture questions on scaling RAG to production.

## Getting Started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run lint     # run oxlint
```

Open the app, then use the header buttons to switch between **Software Architect**, **Agent Designer** and **Agent Architectures**. The RAG generator is on the main page.

## Project Structure

```
src/
  App.tsx                                  # header navigation and view switching
  components/
    AdaptiveGenerator.tsx                  # RAG Adaptive Generator
    SoftwareSystemArchitect.tsx            # Software System Architect
    AgentOrchestrationArchitect.tsx        # Agent Designer
    AgentArchitectures.tsx                 # reference agent workflows
    ConceptFlow.tsx, AdvancedChunking.tsx, SOTAModels.tsx,
    TechStackMatrix.tsx, InterviewQuestions.tsx
```

Each designer keeps its technology catalogue as a data object at the top of its file. To add an alternative, append an option to the relevant category.

## Tech Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Diagramming:** React Flow (@xyflow/react)
- **Icons:** Lucide React
- **PDF Export:** jsPDF
