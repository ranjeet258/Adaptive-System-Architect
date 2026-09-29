import { useState, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { X, ChevronDown, ChevronUp, ExternalLink, Calculator, Clock, Cpu, CheckCircle, Download, BookOpen, Layers, Sparkles, AlertTriangle, Info, Wand2, Table2, ShieldAlert, Bot } from 'lucide-react';
import jsPDF from 'jspdf';
import '@xyflow/react/dist/style.css';

type Scale = 'prototype' | 'production';
type Pattern = 'single' | 'sequential' | 'supervisor' | 'hierarchical' | 'handoff' | 'critic';
type Autonomy = 'assistive' | 'supervised' | 'autonomous';
type Complexity = 'Low' | 'Medium' | 'High';
type Resource = 'tools' | 'knowledge' | 'memory' | 'sandbox';
type ModuleKey = 'guardrails' | 'memory' | 'knowledge' | 'tools' | 'sandbox' | 'observability' | 'runtime' | 'comms';

interface TechOption {
  id: string;
  name: string;
  description: string;
  pros: string;
  cons: string;
  url?: string;
  costText: string;
  costValue: number;
  latencyText: string;
  latencyMs: number;
  complexity: Complexity;
}

interface Category {
  title: string;
  concept: string;
  decisionTips: string[];
  options: TechOption[];
}

// -------------------------------------------------------------
// Tech catalogue for agent systems, with alternatives
// -------------------------------------------------------------
const catalog: Record<string, Category> = {
  trigger: {
    title: 'Trigger / Entry Point',
    concept: 'What starts the agent run. Conversational agents start from a chat; back-office agents are usually event-driven (a new ticket, claim or alert) or scheduled (month-end close).',
    decisionTips: ['Event-driven agents need idempotency — the same event may arrive twice.', 'Scheduled agents should checkpoint so a crash does not redo completed steps.'],
    options: [
      { id: 'chat', name: 'Chat UI / Copilot Sidebar', description: 'User converses with the agent in a web app, Slack or Teams.', pros: 'Natural UX, user can clarify', cons: 'Latency is user-visible', costText: 'Free', costValue: 0, latencyText: 'Realtime', latencyMs: 0, complexity: 'Low' },
      { id: 'event', name: 'Webhook / Event Stream', description: 'Business events (ticket created, claim filed, alert fired) via webhooks, Kafka or EventBridge.', pros: 'Fully automated back-office flows', cons: 'Needs idempotency and dead-letter handling', url: 'https://kafka.apache.org/', costText: '$', costValue: 2, latencyText: 'Async', latencyMs: 0, complexity: 'Medium' },
      { id: 'schedule', name: 'Scheduler (Cron / Airflow)', description: 'Periodic runs such as daily reports or month-end reconciliation.', pros: 'Predictable load', cons: 'Not real-time', url: 'https://airflow.apache.org/', costText: 'Free', costValue: 1, latencyText: 'Batch', latencyMs: 0, complexity: 'Low' },
      { id: 'email', name: 'Email / Document Inbox', description: 'Agent processes incoming emails and attachments (claims, invoices, contracts).', pros: 'Fits existing workflows', cons: 'Unstructured, messy inputs', costText: '$', costValue: 1, latencyText: 'Async', latencyMs: 0, complexity: 'Medium' },
    ],
  },
  orchestrator: {
    title: 'Orchestration Framework',
    concept: 'The framework that runs the agent loop: calling the model, executing tools, passing state between agents, and deciding what runs next. Graph-based frameworks give deterministic control; role-based ones are faster to prototype.',
    decisionTips: ['Regulated or long-running flows → explicit graph/state machine you can audit.', 'Handoff-style customer service → frameworks with first-class handoffs.', 'Start with one agent; add more only when a single agent demonstrably fails.'],
    options: [
      { id: 'langgraph', name: 'LangGraph', description: 'Stateful graph of nodes and edges with checkpoints, interrupts for human approval, and streaming.', pros: 'Deterministic control, checkpoints, HITL built-in', cons: 'More boilerplate, learning curve', url: 'https://langchain-ai.github.io/langgraph/', costText: 'OSS / Platform $$', costValue: 3, latencyText: 'Low overhead', latencyMs: 20, complexity: 'High' },
      { id: 'claude_sdk', name: 'Claude Agent SDK', description: 'The agent harness behind Claude Code: tool use, subagents, MCP, context management and permissions.', pros: 'Strong tool use, MCP-native, subagents', cons: 'Optimized for Claude models', url: 'https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk', costText: 'OSS (model $)', costValue: 2, latencyText: 'Low overhead', latencyMs: 10, complexity: 'Medium' },
      { id: 'openai_agents', name: 'OpenAI Agents SDK', description: 'Lightweight primitives: agents, handoffs, guardrails and tracing.', pros: 'Handoffs are first-class, simple API', cons: 'Less control over complex graphs', url: 'https://openai.github.io/openai-agents-python/', costText: 'OSS (model $)', costValue: 2, latencyText: 'Low overhead', latencyMs: 10, complexity: 'Low' },
      { id: 'crewai', name: 'CrewAI', description: 'Role-based crews of agents with tasks and processes (sequential / hierarchical).', pros: 'Fastest to prototype role-based teams', cons: 'Less deterministic, harder to debug', url: 'https://www.crewai.com/', costText: 'OSS / Enterprise $$', costValue: 2, latencyText: 'Medium overhead', latencyMs: 50, complexity: 'Low' },
      { id: 'ms_agent', name: 'Microsoft Agent Framework (AutoGen / Semantic Kernel)', description: 'Conversational multi-agent patterns plus enterprise .NET/Python integration.', pros: 'Group-chat patterns, Azure integration', cons: 'Chatty agents can burn tokens', url: 'https://github.com/microsoft/agent-framework', costText: 'OSS', costValue: 2, latencyText: 'Medium overhead', latencyMs: 50, complexity: 'Medium' },
      { id: 'google_adk', name: 'Google ADK', description: 'Agent Development Kit with workflow agents (sequential, parallel, loop) and A2A support.', pros: 'Workflow agents, A2A, Vertex deploy', cons: 'Younger ecosystem', url: 'https://google.github.io/adk-docs/', costText: 'OSS', costValue: 2, latencyText: 'Low overhead', latencyMs: 20, complexity: 'Medium' },
      { id: 'custom', name: 'Custom Code (plain while-loop)', description: 'Hand-written loop around the model API with your own tool dispatch.', pros: 'Full control, no abstractions', cons: 'You rebuild retries, state, tracing', costText: 'Free (eng time)', costValue: 1, latencyText: 'Minimal', latencyMs: 0, complexity: 'Medium' },
    ],
  },
  planner_llm: {
    title: 'Planner / Orchestrator Model',
    concept: 'The model that plans, delegates and synthesizes. It needs the strongest reasoning and tool-use ability, but is called less often than worker models.',
    decisionTips: ['Spend on the planner, save on workers.', 'Regulated data or air-gapped sites may require self-hosted open-weight models.'],
    options: [
      { id: 'opus', name: 'Claude Opus 5.5', description: 'Top-tier reasoning and long-horizon agentic work.', pros: 'Best planning and tool use', cons: 'Highest cost per call', url: 'https://docs.anthropic.com/en/docs/about-claude/models', costText: 'Frontier $$$', costValue: 9, latencyText: '~2.5s / call', latencyMs: 2500, complexity: 'Low' },
      { id: 'sonnet', name: 'Claude Sonnet 5.5', description: 'Strong reasoning at a balanced price and speed.', pros: 'Great quality / cost balance', cons: 'Slightly weaker on hardest plans', url: 'https://docs.anthropic.com/en/docs/about-claude/models', costText: 'Mid $$', costValue: 6, latencyText: '~1.5s / call', latencyMs: 1500, complexity: 'Low' },
      { id: 'gpt_gemini', name: 'OpenAI GPT / Google Gemini (latest)', description: 'Other frontier model families.', pros: 'Multi-vendor redundancy', cons: 'Prompt behaviour differs per vendor', url: 'https://ai.google.dev/gemini-api/docs/models', costText: 'Frontier $$$', costValue: 7, latencyText: '~1.5-2s / call', latencyMs: 1800, complexity: 'Low' },
      { id: 'open_large', name: 'Open-weight Large (Llama / Qwen / DeepSeek)', description: 'Self-hosted models via vLLM or SGLang.', pros: 'Data never leaves your network', cons: 'GPU ops, weaker agentic reliability', url: 'https://docs.vllm.ai/', costText: 'GPU $$$', costValue: 7, latencyText: '~1.2s / call', latencyMs: 1200, complexity: 'High' },
    ],
  },
  worker_llm: {
    title: 'Worker Agent Model',
    concept: 'Specialist agents run narrow, well-scoped tasks (extract, classify, draft). Smaller, faster models usually suffice and cut cost dramatically since workers make most of the calls.',
    decisionTips: ['Evaluate workers on your own task set before downsizing.', 'Use structured outputs (JSON schema) so the orchestrator can parse results.'],
    options: [
      { id: 'haiku', name: 'Claude Haiku 4.5', description: 'Fast, low-cost model with solid tool use.', pros: 'Cheap and fast for high volume', cons: 'Less depth on complex reasoning', url: 'https://docs.anthropic.com/en/docs/about-claude/models', costText: 'Low $', costValue: 2, latencyText: '~600ms / call', latencyMs: 600, complexity: 'Low' },
      { id: 'sonnet_w', name: 'Claude Sonnet 5.5', description: 'Use when workers need real reasoning (legal analysis, code).', pros: 'High quality workers', cons: 'Higher cost at volume', url: 'https://docs.anthropic.com/en/docs/about-claude/models', costText: 'Mid $$', costValue: 6, latencyText: '~1.5s / call', latencyMs: 1500, complexity: 'Low' },
      { id: 'flash', name: 'GPT mini / Gemini Flash (latest)', description: 'Other vendors\' small, fast tiers.', pros: 'Low cost, multi-vendor', cons: 'Tool-use quality varies', url: 'https://ai.google.dev/gemini-api/docs/models', costText: 'Low $', costValue: 2, latencyText: '~500ms / call', latencyMs: 500, complexity: 'Low' },
      { id: 'open_small', name: 'Open-weight Small (fine-tuned)', description: 'Small self-hosted models fine-tuned for one task.', pros: 'Cheapest at scale, private', cons: 'Needs training data and MLOps', url: 'https://huggingface.co/models', costText: 'GPU $$', costValue: 3, latencyText: '~400ms / call', latencyMs: 400, complexity: 'High' },
    ],
  },
  comms: {
    title: 'Agent Communication',
    concept: 'How agents exchange work. In-process frameworks share a state object; distributed agents talk over protocols like A2A (agent-to-agent) or message queues. MCP connects agents to tools, not to each other.',
    decisionTips: ['Same codebase → shared state is simplest.', 'Agents owned by different teams or vendors → A2A protocol.', 'Long-running async steps → queue between agents.'],
    options: [
      { id: 'shared_state', name: 'Shared State / Blackboard', description: 'Agents read and write a typed state object managed by the orchestrator.', pros: 'Simple, easy to checkpoint', cons: 'Single process / service', costText: 'Free', costValue: 0, latencyText: '~0ms', latencyMs: 0, complexity: 'Low' },
      { id: 'a2a', name: 'A2A Protocol', description: 'Open agent-to-agent protocol: agents publish Agent Cards and exchange tasks over HTTP.', pros: 'Cross-team / cross-vendor agents', cons: 'Network hops, newer standard', url: 'https://a2a-protocol.org/', costText: 'Free', costValue: 1, latencyText: '~50ms / hop', latencyMs: 50, complexity: 'Medium' },
      { id: 'queue_comms', name: 'Message Queue (Kafka / SQS)', description: 'Agents as independent services consuming task messages.', pros: 'Scalable, decoupled, retryable', cons: 'Harder to trace end-to-end', url: 'https://aws.amazon.com/sqs/', costText: '$$', costValue: 3, latencyText: '~20ms / hop', latencyMs: 20, complexity: 'High' },
    ],
  },
  tools: {
    title: 'Tools & Integrations',
    concept: 'Tools let agents act: query CRMs, file tickets, call APIs. The Model Context Protocol (MCP) standardizes how tools are exposed so any agent can use any MCP server. Scope each agent to only the tools it needs (least privilege).',
    decisionTips: ['Give each agent the fewest tools possible — accuracy drops as tool count grows.', 'Write-actions (refunds, payments) should require approval.', 'Prefer read-only tools for exploratory agents.'],
    options: [
      { id: 'mcp', name: 'MCP Servers', description: 'Model Context Protocol servers for GitHub, Slack, databases, SaaS apps and your internal APIs.', pros: 'Open standard, reusable across agents', cons: 'Auth and server governance needed', url: 'https://modelcontextprotocol.io/', costText: 'Free / hosting', costValue: 2, latencyText: '~200ms / call', latencyMs: 200, complexity: 'Medium' },
      { id: 'native_fc', name: 'Native Function Calling', description: 'Tools defined as JSON schemas directly in the agent code.', pros: 'Simplest, no extra infra', cons: 'Not reusable across agents/apps', costText: 'Free', costValue: 0, latencyText: '~150ms / call', latencyMs: 150, complexity: 'Low' },
      { id: 'composio', name: 'Composio / Arcade (Managed Toolkits)', description: 'Hosted catalogue of pre-built integrations with managed OAuth.', pros: 'Hundreds of integrations, auth handled', cons: 'Third-party dependency', url: 'https://composio.dev/', costText: 'Per call $$', costValue: 3, latencyText: '~300ms / call', latencyMs: 300, complexity: 'Low' },
      { id: 'computer_use', name: 'Browser / Computer Use', description: 'Agent operates UIs directly when no API exists (legacy portals).', pros: 'Works with any UI', cons: 'Slow, brittle, needs sandboxing', url: 'https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool', costText: 'High compute $$$', costValue: 5, latencyText: '~5s / action', latencyMs: 1500, complexity: 'High' },
    ],
  },
  memory: {
    title: 'Agent Memory',
    concept: 'Short-term memory is the conversation/thread state (checkpoints). Long-term memory stores facts and preferences across sessions — episodic (what happened) and semantic (what is true about the user).',
    decisionTips: ['Checkpoint every step so runs can resume after failures.', 'Long-term memory needs retention and deletion policies (GDPR).'],
    options: [
      { id: 'checkpointer', name: 'Postgres / Redis Checkpointer', description: 'Persist thread state per step for resume and time-travel debugging.', pros: 'Simple, reliable, resumable', cons: 'Short-term only', url: 'https://langchain-ai.github.io/langgraph/concepts/persistence/', costText: '$', costValue: 2, latencyText: '~5ms', latencyMs: 5, complexity: 'Low' },
      { id: 'mem0', name: 'Mem0 / Zep', description: 'Managed long-term memory layers extracting facts from conversations.', pros: 'Personalization across sessions', cons: 'Extra LLM calls to extract memories', url: 'https://mem0.ai/', costText: '$$', costValue: 3, latencyText: '~100ms', latencyMs: 100, complexity: 'Medium' },
      { id: 'letta', name: 'Letta (MemGPT)', description: 'Agents that self-manage tiered memory (core, archival, recall).', pros: 'Agent edits its own memory', cons: 'Opinionated runtime', url: 'https://www.letta.com/', costText: 'OSS / Cloud $$', costValue: 3, latencyText: '~150ms', latencyMs: 150, complexity: 'High' },
      { id: 'vector_mem', name: 'Vector Store Memory', description: 'Store past interactions as embeddings and retrieve relevant ones.', pros: 'Flexible, reuse existing vector DB', cons: 'Retrieval noise, no fact updates', url: 'https://github.com/pgvector/pgvector', costText: '$', costValue: 2, latencyText: '~40ms', latencyMs: 40, complexity: 'Medium' },
    ],
  },
  knowledge: {
    title: 'Knowledge (Agentic RAG)',
    concept: 'Agents ground answers in company knowledge through retrieval tools: policies, manuals, contracts, past tickets. See the RAG designer for the full ingestion pipeline.',
    decisionTips: ['Expose retrieval as a tool so the agent decides when to search.', 'Enforce document-level permissions at retrieval time.'],
    options: [
      { id: 'vector_rag', name: 'Vector RAG (pgvector / Qdrant)', description: 'Hybrid dense + keyword search with reranking over chunked documents.', pros: 'Well understood, flexible', cons: 'You own the ingestion pipeline', url: 'https://qdrant.tech/', costText: '$$', costValue: 3, latencyText: '~150ms', latencyMs: 150, complexity: 'Medium' },
      { id: 'graph_rag', name: 'GraphRAG / Knowledge Graph', description: 'Entity-relationship graph for multi-hop questions (suppliers, patients, contracts).', pros: 'Multi-hop reasoning', cons: 'Expensive to build and maintain', url: 'https://microsoft.github.io/graphrag/', costText: '$$$', costValue: 6, latencyText: '~300ms', latencyMs: 300, complexity: 'High' },
      { id: 'ent_search', name: 'Enterprise Search (Glean / Azure AI Search / Vertex)', description: 'Managed search across SaaS sources with permission sync.', pros: 'Permissions and connectors handled', cons: 'License cost, less control', url: 'https://learn.microsoft.com/azure/search/', costText: '$$$', costValue: 6, latencyText: '~250ms', latencyMs: 250, complexity: 'Low' },
      { id: 'file_search', name: 'Hosted File Search (Model Provider)', description: 'Upload files to a provider-hosted retrieval tool.', pros: 'Zero infra', cons: 'Limited tuning, vendor lock-in', costText: '$', costValue: 2, latencyText: '~300ms', latencyMs: 300, complexity: 'Low' },
    ],
  },
  sandbox: {
    title: 'Code Execution Sandbox',
    concept: 'Agents that write and run code (data analysis, software engineering) must execute it in an isolated sandbox: no network by default, resource limits, and ephemeral file systems.',
    decisionTips: ['Never run model-generated code on the host.', 'Disable outbound network unless explicitly required.'],
    options: [
      { id: 'e2b', name: 'E2B', description: 'Firecracker micro-VM sandboxes built for AI agents.', pros: 'Fast start, secure isolation', cons: 'Per-second billing', url: 'https://e2b.dev/', costText: '$$', costValue: 3, latencyText: '~200ms start', latencyMs: 200, complexity: 'Low' },
      { id: 'modal', name: 'Modal / Daytona', description: 'Serverless containers and dev environments for agent workloads, incl. GPUs.', pros: 'Scales, GPU support', cons: 'Cold starts for large images', url: 'https://modal.com/', costText: '$$', costValue: 3, latencyText: '~500ms start', latencyMs: 500, complexity: 'Medium' },
      { id: 'docker_gvisor', name: 'Self-hosted Docker + gVisor / Firecracker', description: 'Your own hardened container sandbox.', pros: 'Data stays on-prem', cons: 'Security hardening is on you', url: 'https://gvisor.dev/', costText: 'Infra $', costValue: 2, latencyText: '~1s start', latencyMs: 1000, complexity: 'High' },
      { id: 'code_interp', name: 'Provider Code Execution Tool', description: 'Model provider\'s hosted code execution tool.', pros: 'Zero setup', cons: 'Limited libraries and data access', url: 'https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/code-execution-tool', costText: '$', costValue: 2, latencyText: '~300ms', latencyMs: 300, complexity: 'Low' },
    ],
  },
  hitl: {
    title: 'Human-in-the-Loop',
    concept: 'Human checkpoints for high-risk actions: payments, medical or legal outputs, production changes. The run pauses, persists its state, and resumes after approval — possibly days later.',
    decisionTips: ['Approve actions, not every token: gate irreversible or regulated steps.', 'Show the reviewer the evidence the agent used.', 'Log every approval for audit.'],
    options: [
      { id: 'slack_approval', name: 'Slack / Teams Approvals', description: 'Interactive approve/reject messages in chat.', pros: 'Meets reviewers where they work', cons: 'Weak for long evidence review', url: 'https://api.slack.com/interactivity', costText: 'Free', costValue: 1, latencyText: 'Human time', latencyMs: 0, complexity: 'Low' },
      { id: 'review_ui', name: 'Custom Review Console', description: 'Dedicated UI showing agent reasoning, sources and proposed action.', pros: 'Rich evidence, audit trail', cons: 'Engineering effort', costText: 'Eng time', costValue: 3, latencyText: 'Human time', latencyMs: 0, complexity: 'Medium' },
      { id: 'interrupts', name: 'Framework Interrupts (LangGraph / Temporal signals)', description: 'Pause the graph at a node and resume with human input.', pros: 'Native pause/resume with state', cons: 'Needs a UI on top', url: 'https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/', costText: 'Free', costValue: 1, latencyText: 'Human time', latencyMs: 0, complexity: 'Medium' },
      { id: 'bpm', name: 'Existing Workflow Tool (ServiceNow / Jira)', description: 'Route approvals as tasks into the ticketing system the org already uses.', pros: 'Fits existing governance', cons: 'Slower, integration work', url: 'https://www.servicenow.com/', costText: 'License $$', costValue: 3, latencyText: 'Human time', latencyMs: 0, complexity: 'Medium' },
    ],
  },
  guardrails: {
    title: 'Guardrails & Policy',
    concept: 'Input guards stop prompt injection (including from retrieved documents and tool outputs); output guards check PII, toxicity and policy; action guards restrict which tools an agent may call with which arguments.',
    decisionTips: ['Treat tool outputs and documents as untrusted input.', 'Enforce tool permissions outside the model (policy engine), not by prompt.'],
    options: [
      { id: 'nemo', name: 'NeMo Guardrails / Guardrails AI', description: 'Programmable rails and output validators.', pros: 'Flexible, open-source', cons: 'Rules need maintenance', url: 'https://github.com/NVIDIA/NeMo-Guardrails', costText: 'Compute', costValue: 2, latencyText: '~150ms', latencyMs: 150, complexity: 'Medium' },
      { id: 'llamaguard', name: 'Llama Guard / Prompt-injection Classifiers', description: 'Safety classifier models on inputs and outputs.', pros: 'Good coverage, self-hostable', cons: 'Extra model calls', url: 'https://huggingface.co/meta-llama', costText: 'Compute $', costValue: 3, latencyText: '~200ms', latencyMs: 200, complexity: 'Medium' },
      { id: 'lakera', name: 'Lakera / Managed AI Firewall', description: 'Hosted prompt-injection and data-leak detection.', pros: 'Zero ops, updated threat intel', cons: 'Data leaves your boundary', url: 'https://www.lakera.ai/', costText: 'Per call $$', costValue: 3, latencyText: '~50ms', latencyMs: 50, complexity: 'Low' },
      { id: 'opa', name: 'Policy Engine (OPA / Cedar) for Tool Access', description: 'Deterministic allow/deny for tool calls by agent, user and arguments.', pros: 'Auditable, deterministic', cons: 'Does not catch content issues', url: 'https://www.openpolicyagent.org/', costText: 'Free', costValue: 1, latencyText: '~5ms', latencyMs: 5, complexity: 'Medium' },
    ],
  },
  observability: {
    title: 'Tracing & Evaluation',
    concept: 'Agents are non-deterministic, so every run must be traced: each model call, tool call, handoff and cost. Offline evals (golden task sets) catch regressions; online evals score live traffic.',
    decisionTips: ['Build a golden set of 50–100 real tasks before scaling.', 'Track task success rate, cost per task and steps per task.'],
    options: [
      { id: 'langfuse', name: 'Langfuse', description: 'Open-source tracing, prompt management and evals.', pros: 'OSS, self-hostable', cons: 'You host it for data residency', url: 'https://langfuse.com/', costText: 'OSS / Cloud $', costValue: 2, latencyText: 'Async', latencyMs: 0, complexity: 'Low' },
      { id: 'langsmith', name: 'LangSmith', description: 'Tracing and evaluation, tightly integrated with LangGraph.', pros: 'Best LangGraph integration', cons: 'Per-trace pricing', url: 'https://docs.smith.langchain.com/', costText: '$$', costValue: 3, latencyText: 'Async', latencyMs: 0, complexity: 'Low' },
      { id: 'phoenix', name: 'Arize Phoenix / Braintrust', description: 'Eval-first platforms with experiment tracking.', pros: 'Strong eval workflows', cons: 'Another platform to adopt', url: 'https://phoenix.arize.com/', costText: 'OSS / $$', costValue: 3, latencyText: 'Async', latencyMs: 0, complexity: 'Medium' },
      { id: 'otel', name: 'OpenTelemetry GenAI + Existing APM', description: 'Emit GenAI semantic-convention spans into Datadog / Grafana.', pros: 'One pane with the rest of the system', cons: 'Weaker eval tooling', url: 'https://opentelemetry.io/docs/specs/semconv/gen-ai/', costText: 'Existing APM $', costValue: 2, latencyText: 'Async', latencyMs: 0, complexity: 'Medium' },
    ],
  },
  runtime: {
    title: 'Durable Runtime & Deployment',
    concept: 'Production agents run for minutes to days, wait on humans and call flaky APIs. A durable runtime persists progress so crashes, deploys and timeouts do not lose work or repeat side effects.',
    decisionTips: ['Anything with human approval or >1 min duration needs durable execution.', 'Make tool side effects idempotent.'],
    options: [
      { id: 'temporal', name: 'Temporal', description: 'Durable execution: workflows survive crashes and resume exactly where they left off.', pros: 'Battle-tested reliability, retries', cons: 'New programming model', url: 'https://temporal.io/', costText: 'OSS / Cloud $$', costValue: 4, latencyText: '~10ms / step', latencyMs: 10, complexity: 'High' },
      { id: 'lg_platform', name: 'LangGraph Platform', description: 'Managed deployment for LangGraph with persistence, cron and task queues.', pros: 'Zero-config for LangGraph', cons: 'Tied to LangGraph', url: 'https://langchain-ai.github.io/langgraph/concepts/langgraph_platform/', costText: '$$', costValue: 3, latencyText: '~10ms / step', latencyMs: 10, complexity: 'Low' },
      { id: 'agentcore', name: 'Cloud Agent Runtimes (Bedrock AgentCore / Vertex Agent Engine)', description: 'Managed hyperscaler runtimes with identity, memory and gateway services.', pros: 'Enterprise IAM, managed scaling', cons: 'Cloud lock-in', url: 'https://aws.amazon.com/bedrock/agentcore/', costText: '$$$', costValue: 5, latencyText: '~20ms / step', latencyMs: 20, complexity: 'Medium' },
      { id: 'inngest', name: 'Inngest / Restate', description: 'Lightweight durable functions with step-level retries.', pros: 'Simple DX, serverless-friendly', cons: 'Smaller ecosystem', url: 'https://www.inngest.com/', costText: '$ → $$', costValue: 2, latencyText: '~10ms / step', latencyMs: 10, complexity: 'Low' },
      { id: 'plain_api', name: 'Plain API Server (FastAPI / Node)', description: 'Agent runs inside a request handler.', pros: 'Simplest to ship', cons: 'Runs die on timeout or deploy', costText: '$', costValue: 1, latencyText: '0ms', latencyMs: 0, complexity: 'Low' },
    ],
  },
  output: {
    title: 'Output & Actions',
    concept: 'Where results land: a chat reply, a record written to a system of record, a generated report, or an executed action. Always keep an audit log of what the agent did and why.',
    decisionTips: ['Write to systems of record through their APIs with idempotency keys.', 'Keep the agent\'s reasoning and sources alongside the output for audit.'],
    options: [
      { id: 'reply', name: 'Chat Reply + Citations', description: 'Answer returned to the user with sources.', pros: 'Transparent', cons: 'No automated action', costText: 'Free', costValue: 0, latencyText: '—', latencyMs: 0, complexity: 'Low' },
      { id: 'system_write', name: 'System-of-Record Update', description: 'Agent writes to CRM, ERP, EHR or ticketing via API.', pros: 'Real automation', cons: 'Needs strict permissions & audit', costText: 'Free', costValue: 1, latencyText: '—', latencyMs: 0, complexity: 'Medium' },
      { id: 'report', name: 'Generated Report / Document', description: 'PDF, spreadsheet or memo generated for review.', pros: 'Easy human review', cons: 'Format drift over time', costText: 'Free', costValue: 1, latencyText: '—', latencyMs: 0, complexity: 'Low' },
    ],
  },
};

// -------------------------------------------------------------
// Industry blueprints: which agents exist and what they need
// -------------------------------------------------------------
interface AgentDef { name: string; role: string; uses: Resource[]; toolsExample: string }
interface Industry {
  id: string;
  name: string;
  emoji: string;
  regulated: boolean;
  pattern: Pattern;
  autonomy: Autonomy;
  trigger: string;
  output: string;
  modules: ModuleKey[];
  agents: AgentDef[];
  summary: string;
}

const INDUSTRIES: Industry[] = [
  {
    id: 'support', name: 'Customer Support', emoji: '🎧', regulated: false, pattern: 'handoff', autonomy: 'supervised', trigger: 'chat', output: 'reply',
    modules: ['guardrails', 'memory', 'knowledge', 'tools', 'observability'],
    summary: 'A triage agent classifies the request and hands off to specialists. Refunds above a threshold need human approval.',
    agents: [
      { name: 'Triage Agent', role: 'Classifies intent and sentiment, routes to the right specialist.', uses: ['memory'], toolsExample: 'Customer profile lookup' },
      { name: 'Knowledge Agent', role: 'Answers how-to and policy questions from help-center docs.', uses: ['knowledge'], toolsExample: 'Help-center search' },
      { name: 'Billing Agent', role: 'Handles invoices, refunds and plan changes.', uses: ['tools'], toolsExample: 'Stripe, billing DB' },
      { name: 'Escalation Agent', role: 'Summarizes the case and opens a ticket for a human agent.', uses: ['tools', 'memory'], toolsExample: 'Zendesk / Jira' },
    ],
  },
  {
    id: 'finance', name: 'Finance (FP&A / MIS)', emoji: '💹', regulated: true, pattern: 'sequential', autonomy: 'assistive', trigger: 'schedule', output: 'report',
    modules: ['guardrails', 'tools', 'sandbox', 'knowledge', 'observability', 'runtime'],
    summary: 'A scheduled month-end pipeline: pull data, validate, analyze variances, explain drivers and draft commentary for a finance reviewer.',
    agents: [
      { name: 'Data Agent', role: 'Pulls actuals and plan from the ERP and warehouse via Text-to-SQL.', uses: ['tools'], toolsExample: 'Snowflake, SAP' },
      { name: 'Validation Agent', role: 'Runs reconciliation and completeness checks.', uses: ['sandbox'], toolsExample: 'Python / pandas' },
      { name: 'Variance Analyst', role: 'Computes budget vs actual and flags material variances.', uses: ['sandbox'], toolsExample: 'Python / pandas' },
      { name: 'Root-cause Agent', role: 'Explains drivers using transaction detail and business context.', uses: ['tools', 'knowledge'], toolsExample: 'GL detail, policy docs' },
      { name: 'Commentary Agent', role: 'Drafts management commentary for review.', uses: ['knowledge'], toolsExample: 'Prior month packs' },
    ],
  },
  {
    id: 'healthcare', name: 'Healthcare', emoji: '🏥', regulated: true, pattern: 'supervisor', autonomy: 'assistive', trigger: 'event', output: 'system_write',
    modules: ['guardrails', 'memory', 'knowledge', 'tools', 'observability', 'runtime'],
    summary: 'A supervisor coordinates clinical documentation, coding and prior authorization. A clinician approves everything before it is written to the EHR (HIPAA).',
    agents: [
      { name: 'Intake Agent', role: 'Structures referral documents and patient history.', uses: ['tools'], toolsExample: 'FHIR API' },
      { name: 'Clinical Summary Agent', role: 'Summarizes encounter notes with citations.', uses: ['knowledge', 'memory'], toolsExample: 'EHR notes' },
      { name: 'Medical Coding Agent', role: 'Suggests ICD-10 / CPT codes with evidence.', uses: ['knowledge'], toolsExample: 'Code set lookup' },
      { name: 'Prior Auth Agent', role: 'Checks payer rules and drafts authorization requests.', uses: ['tools', 'knowledge'], toolsExample: 'Payer policy DB' },
    ],
  },
  {
    id: 'legal', name: 'Legal', emoji: '⚖️', regulated: true, pattern: 'supervisor', autonomy: 'assistive', trigger: 'email', output: 'report',
    modules: ['guardrails', 'knowledge', 'tools', 'observability', 'memory'],
    summary: 'Contract review: a supervisor splits the contract across specialists running in parallel, then merges their findings into a risk memo for counsel.',
    agents: [
      { name: 'Clause Extraction Agent', role: 'Extracts parties, terms, obligations and dates.', uses: ['tools'], toolsExample: 'Document parser' },
      { name: 'Playbook Compliance Agent', role: 'Compares clauses against the firm\'s negotiation playbook.', uses: ['knowledge'], toolsExample: 'Playbook RAG' },
      { name: 'Risk Analysis Agent', role: 'Scores risk and cites precedent.', uses: ['knowledge'], toolsExample: 'Precedent search' },
      { name: 'Redline Drafting Agent', role: 'Proposes redlines and fallback language.', uses: ['knowledge', 'memory'], toolsExample: 'Clause library' },
    ],
  },
  {
    id: 'ecommerce', name: 'E-commerce / Retail', emoji: '🛍️', regulated: false, pattern: 'handoff', autonomy: 'autonomous', trigger: 'chat', output: 'reply',
    modules: ['guardrails', 'memory', 'knowledge', 'tools', 'observability'],
    summary: 'A shopping assistant that personalizes recommendations, checks stock and manages orders, handing off between specialists within one conversation.',
    agents: [
      { name: 'Shopping Assistant', role: 'Understands needs and orchestrates the conversation.', uses: ['memory'], toolsExample: 'User preferences' },
      { name: 'Product Discovery Agent', role: 'Searches catalogue and recommends products.', uses: ['knowledge', 'tools'], toolsExample: 'Catalogue search' },
      { name: 'Inventory & Pricing Agent', role: 'Checks stock, delivery dates and promotions.', uses: ['tools'], toolsExample: 'Inventory API' },
      { name: 'Order Management Agent', role: 'Tracks, modifies and returns orders.', uses: ['tools'], toolsExample: 'OMS / Shopify' },
    ],
  },
  {
    id: 'software', name: 'Software Engineering', emoji: '👩‍💻', regulated: false, pattern: 'critic', autonomy: 'supervised', trigger: 'event', output: 'system_write',
    modules: ['tools', 'sandbox', 'knowledge', 'memory', 'observability', 'runtime'],
    summary: 'An issue triggers a plan → code → test loop; a reviewer agent critiques until tests pass, then opens a pull request for a human to merge.',
    agents: [
      { name: 'Planner Agent', role: 'Reads the issue and codebase, writes an implementation plan.', uses: ['knowledge', 'tools'], toolsExample: 'Repo search, GitHub MCP' },
      { name: 'Coder Agent', role: 'Edits files according to the plan.', uses: ['tools', 'sandbox'], toolsExample: 'File edit, shell' },
      { name: 'Test Agent', role: 'Writes and runs tests in a sandbox.', uses: ['sandbox'], toolsExample: 'pytest / jest' },
    ],
  },
  {
    id: 'supply', name: 'Supply Chain / Manufacturing', emoji: '🏭', regulated: false, pattern: 'hierarchical', autonomy: 'supervised', trigger: 'event', output: 'system_write',
    modules: ['tools', 'sandbox', 'knowledge', 'memory', 'observability', 'runtime', 'comms'],
    summary: 'A hierarchy of planning and operations teams: forecasting, inventory, suppliers and logistics coordinate on disruptions.',
    agents: [
      { name: 'Demand Forecast Agent', role: 'Runs forecasts and explains shifts.', uses: ['sandbox', 'tools'], toolsExample: 'Forecast models' },
      { name: 'Inventory Optimizer', role: 'Recommends reorder points and safety stock.', uses: ['sandbox'], toolsExample: 'Optimization solver' },
      { name: 'Supplier Risk Agent', role: 'Monitors supplier news and delays.', uses: ['knowledge', 'tools'], toolsExample: 'News / supplier portal' },
      { name: 'Logistics Agent', role: 'Re-routes shipments and books carriers.', uses: ['tools'], toolsExample: 'TMS API' },
      { name: 'Quality Anomaly Agent', role: 'Detects anomalies from IoT sensor data.', uses: ['tools', 'memory'], toolsExample: 'Sensor timeseries DB' },
    ],
  },
  {
    id: 'insurance', name: 'Insurance Claims', emoji: '🛡️', regulated: true, pattern: 'sequential', autonomy: 'supervised', trigger: 'email', output: 'system_write',
    modules: ['guardrails', 'tools', 'knowledge', 'memory', 'observability', 'runtime'],
    summary: 'Claims flow from intake to payout. Straight-through processing for simple claims; adjusters approve anything flagged or high-value.',
    agents: [
      { name: 'FNOL Intake Agent', role: 'Extracts first-notice-of-loss details from emails and forms.', uses: ['tools'], toolsExample: 'Document AI' },
      { name: 'Damage Assessment Agent', role: 'Assesses photos and estimates repair cost.', uses: ['tools'], toolsExample: 'Vision model' },
      { name: 'Fraud Detection Agent', role: 'Scores fraud risk using history and rules.', uses: ['tools', 'memory'], toolsExample: 'Fraud model API' },
      { name: 'Coverage & Adjudication Agent', role: 'Checks the policy wording and decides coverage.', uses: ['knowledge'], toolsExample: 'Policy RAG' },
    ],
  },
  {
    id: 'itops', name: 'IT Ops / SRE', emoji: '🚨', regulated: false, pattern: 'supervisor', autonomy: 'supervised', trigger: 'event', output: 'system_write',
    modules: ['guardrails', 'tools', 'sandbox', 'knowledge', 'memory', 'observability', 'runtime'],
    summary: 'An incident commander agent coordinates diagnosis in parallel; remediation on production requires on-call approval.',
    agents: [
      { name: 'Alert Triage Agent', role: 'Deduplicates alerts and assesses blast radius.', uses: ['tools'], toolsExample: 'PagerDuty, Datadog' },
      { name: 'Diagnostics Agent', role: 'Queries logs, metrics and recent deploys.', uses: ['tools', 'sandbox'], toolsExample: 'Grafana, kubectl (read-only)' },
      { name: 'Runbook Agent', role: 'Finds matching runbooks and past incidents.', uses: ['knowledge', 'memory'], toolsExample: 'Runbook RAG' },
      { name: 'Remediation Agent', role: 'Proposes and executes rollbacks or scaling.', uses: ['tools'], toolsExample: 'ArgoCD, cloud APIs' },
    ],
  },
  {
    id: 'marketing', name: 'Marketing & Content', emoji: '📣', regulated: false, pattern: 'critic', autonomy: 'supervised', trigger: 'chat', output: 'report',
    modules: ['tools', 'knowledge', 'memory', 'observability'],
    summary: 'Research → write → optimize, with a brand-critic agent looping until the draft meets brand and SEO standards.',
    agents: [
      { name: 'Research Agent', role: 'Gathers market data and competitor content.', uses: ['tools'], toolsExample: 'Web search' },
      { name: 'Writer Agent', role: 'Drafts long-form content in brand voice.', uses: ['knowledge', 'memory'], toolsExample: 'Brand guide RAG' },
      { name: 'SEO Agent', role: 'Optimizes structure, keywords and metadata.', uses: ['tools'], toolsExample: 'SEO APIs' },
    ],
  },
];

const PATTERNS: { id: Pattern; label: string; hint: string }[] = [
  { id: 'single', label: 'Single Agent', hint: 'One agent with all tools. Start here.' },
  { id: 'sequential', label: 'Sequential', hint: 'Fixed pipeline: A → B → C.' },
  { id: 'supervisor', label: 'Supervisor', hint: 'Orchestrator delegates to workers in parallel and merges results.' },
  { id: 'hierarchical', label: 'Hierarchical', hint: 'Supervisor of team leads, each leading workers.' },
  { id: 'handoff', label: 'Handoff / Swarm', hint: 'Agents transfer control to each other.' },
  { id: 'critic', label: 'Evaluator Loop', hint: 'Workers produce, a critic checks and loops back.' },
];

const MODULES: { key: ModuleKey; label: string; hint: string }[] = [
  { key: 'tools', label: 'Tools & Integrations (MCP)', hint: 'APIs, SaaS, DBs' },
  { key: 'knowledge', label: 'Knowledge / RAG', hint: 'Ground in company docs' },
  { key: 'memory', label: 'Memory', hint: 'Short & long-term' },
  { key: 'sandbox', label: 'Code Sandbox', hint: 'Run generated code' },
  { key: 'guardrails', label: 'Guardrails & Policy', hint: 'Injection, PII, tool ACL' },
  { key: 'observability', label: 'Tracing & Evals', hint: 'Debug and measure' },
  { key: 'runtime', label: 'Durable Runtime', hint: 'Survive crashes & waits' },
  { key: 'comms', label: 'Distributed Agents (A2A)', hint: 'Agents as services' },
];

const RECOMMENDED: Record<string, Record<Scale, string>> = {
  orchestrator: { prototype: 'crewai', production: 'langgraph' },
  planner_llm: { prototype: 'sonnet', production: 'opus' },
  worker_llm: { prototype: 'haiku', production: 'haiku' },
  comms: { prototype: 'shared_state', production: 'a2a' },
  tools: { prototype: 'native_fc', production: 'mcp' },
  memory: { prototype: 'checkpointer', production: 'mem0' },
  knowledge: { prototype: 'file_search', production: 'vector_rag' },
  sandbox: { prototype: 'code_interp', production: 'e2b' },
  hitl: { prototype: 'slack_approval', production: 'review_ui' },
  guardrails: { prototype: 'lakera', production: 'nemo' },
  observability: { prototype: 'langfuse', production: 'langfuse' },
  runtime: { prototype: 'plain_api', production: 'temporal' },
  trigger: { prototype: 'chat', production: 'chat' },
  output: { prototype: 'reply', production: 'reply' },
};

const recommendedFor = (cat: string, scale: Scale, pattern: Pattern, industry: Industry) => {
  if (cat === 'trigger') return industry.trigger;
  if (cat === 'output') return industry.output;
  if (cat === 'orchestrator') {
    if (pattern === 'handoff') return 'openai_agents';
    if (pattern === 'single') return 'claude_sdk';
  }
  if (cat === 'worker_llm' && ['legal', 'software'].includes(industry.id)) return 'sonnet_w';
  if (cat === 'guardrails' && industry.regulated && scale === 'production') return 'opa';
  return RECOMMENDED[cat]?.[scale] ?? catalog[cat].options[0].id;
};

const pickRecommended = (scale: Scale, pattern: Pattern, industry: Industry) => {
  const picks: Record<string, string> = {};
  Object.keys(catalog).forEach(cat => { picks[cat] = recommendedFor(cat, scale, pattern, industry); });
  return picks;
};

const complexityScore: Record<Complexity, number> = { Low: 1, Medium: 2, High: 3 };

interface Advice { level: 'warn' | 'info'; text: string; fix?: { label: string; apply: () => void } }

const nodeCls = (color: string, bold = false) =>
  `${color} border-2 p-2 rounded w-44 text-sm text-center cursor-pointer hover:ring-4 hover:ring-indigo-300 transition-all shadow-sm ${bold ? 'font-bold' : ''}`;

export default function AgentOrchestrationArchitect() {
  const [industryId, setIndustryId] = useState('support');
  const industry = INDUSTRIES.find(i => i.id === industryId) || INDUSTRIES[0];
  const [pattern, setPattern] = useState<Pattern>(industry.pattern);
  const [autonomy, setAutonomy] = useState<Autonomy>(industry.autonomy);
  const [scale, setScale] = useState<Scale>('prototype');
  const [modules, setModules] = useState<Set<ModuleKey>>(new Set(industry.modules));
  const [selectedTech, setSelectedTech] = useState<Record<string, string>>(() => pickRecommended('prototype', industry.pattern, industry));
  const [autoAdapt, setAutoAdapt] = useState(true);

  const [selected, setSelected] = useState<{ category: string; agent?: AgentDef } | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const applyIndustry = (ind: Industry) => {
    setIndustryId(ind.id);
    setPattern(ind.pattern);
    setAutonomy(ind.autonomy);
    setModules(new Set(ind.modules));
    setSelectedTech(pickRecommended(scale, ind.pattern, ind));
    setSelected(null);
  };

  const applyShape = (nextScale: Scale, nextPattern: Pattern) => {
    setScale(nextScale);
    setPattern(nextPattern);
    if (autoAdapt) setSelectedTech(pickRecommended(nextScale, nextPattern, industry));
  };

  const toggleModule = (m: ModuleKey) => {
    setModules(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  };

  const selectTech = (cat: string, id: string) => setSelectedTech(prev => ({ ...prev, [cat]: id }));
  const techFor = (cat: string) => catalog[cat].options.find(o => o.id === selectedTech[cat]) || catalog[cat].options[0];

  const { nodes, edges, metrics, activeCategories } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const activeCats = new Set<string>();
    let edgeId = 0;
    const tech = (cat: string) => catalog[cat].options.find(o => o.id === selectedTech[cat]) || catalog[cat].options[0];
    const multiAgent = pattern !== 'single';
    const agents = industry.agents;

    const addEdge = (source: string, target: string, label?: string, variant: 'flow' | 'dashed' | 'loop' = 'flow') => {
      newEdges.push({
        id: `e${edgeId++}`, source, target, label, type: 'smoothstep', animated: variant !== 'dashed',
        style: variant === 'dashed' ? { strokeDasharray: '6 4', stroke: '#94a3b8' } : variant === 'loop' ? { stroke: '#8b5cf6', strokeDasharray: '6 4' } : undefined,
      });
    };
    const addNode = (id: string, x: number, y: number, label: string, cat: string, className: string, agent?: AgentDef) => {
      activeCats.add(cat);
      newNodes.push({ id, position: { x, y }, data: { label, category: cat, techName: tech(cat).name, agent }, className });
    };

    // 1. Entry
    addNode('trigger', 0, 300, '⚡ Trigger', 'trigger', nodeCls('bg-fuchsia-50 border-fuchsia-400', true));
    let entry = 'trigger';
    if (modules.has('guardrails')) {
      addNode('guard_in', 240, 300, '🛡️ Input Guardrails', 'guardrails', nodeCls('bg-red-50 border-red-400'));
      addEdge(entry, 'guard_in');
      entry = 'guard_in';
    }

    // 2. Orchestration by pattern
    const oX = 500;
    const agentIds: string[] = [];
    let exits: string[] = [];
    let rightX = 0;
    const agentCls = nodeCls('bg-indigo-50 border-indigo-400');

    if (pattern === 'single') {
      addNode('orch', oX, 300, `🤖 ${industry.name} Agent`, 'orchestrator', nodeCls('bg-indigo-100 border-indigo-500', true));
      addEdge(entry, 'orch');
      agentIds.push('orch');
      exits = ['orch'];
      rightX = oX;
    } else if (pattern === 'sequential') {
      addNode('orch', oX, 120, 'Workflow Engine', 'orchestrator', nodeCls('bg-blue-100 border-blue-500', true));
      let prev = entry;
      agents.forEach((a, i) => {
        const id = `agent_${i}`;
        addNode(id, oX + i * 240, 300, a.name, 'worker_llm', agentCls, a);
        addEdge(prev, id, i === 0 ? 'Start' : undefined);
        addEdge('orch', id, undefined, 'dashed');
        agentIds.push(id);
        prev = id;
      });
      exits = [prev];
      rightX = oX + (agents.length - 1) * 240;
    } else if (pattern === 'supervisor') {
      addNode('orch', oX, 300, '🧭 Supervisor', 'orchestrator', nodeCls('bg-blue-100 border-blue-500', true));
      addEdge(entry, 'orch');
      const startY = 300 - ((agents.length - 1) * 130) / 2;
      agents.forEach((a, i) => {
        const id = `agent_${i}`;
        addNode(id, oX + 300, startY + i * 130, a.name, 'worker_llm', agentCls, a);
        addEdge('orch', id, i === 0 ? 'Delegate' : undefined);
        addEdge(id, 'orch', i === 0 ? 'Result' : undefined, 'dashed');
        agentIds.push(id);
      });
      exits = ['orch'];
      rightX = oX + 300;
    } else if (pattern === 'hierarchical') {
      addNode('orch', oX, 300, '🧭 Top Supervisor', 'orchestrator', nodeCls('bg-blue-100 border-blue-500', true));
      addEdge(entry, 'orch');
      const half = Math.ceil(agents.length / 2);
      const teams = [agents.slice(0, half), agents.slice(half)];
      teams.forEach((team, t) => {
        const leadId = `lead_${t}`;
        const leadY = t === 0 ? 120 : 480;
        addNode(leadId, oX + 280, leadY, t === 0 ? 'Team Lead A' : 'Team Lead B', 'planner_llm', nodeCls('bg-sky-100 border-sky-500', true));
        addEdge('orch', leadId, 'Delegate');
        addEdge(leadId, 'orch', undefined, 'dashed');
        team.forEach((a, i) => {
          const id = `agent_${t}_${i}`;
          addNode(id, oX + 560, leadY - ((team.length - 1) * 110) / 2 + i * 110, a.name, 'worker_llm', agentCls, a);
          addEdge(leadId, id);
          agentIds.push(id);
        });
      });
      exits = ['orch'];
      rightX = oX + 560;
    } else if (pattern === 'handoff') {
      addNode('orch', oX, 100, 'Handoff Runtime', 'orchestrator', nodeCls('bg-blue-100 border-blue-500', true));
      agents.forEach((a, i) => {
        const id = `agent_${i}`;
        const x = i === 0 ? oX : oX + 300;
        const y = i === 0 ? 300 : 300 - ((agents.length - 2) * 130) / 2 + (i - 1) * 130;
        addNode(id, x, y, a.name, 'worker_llm', i === 0 ? nodeCls('bg-indigo-100 border-indigo-500', true) : agentCls, a);
        if (i === 0) addEdge(entry, id);
        else {
          addEdge('agent_0', id, i === 1 ? 'Handoff' : undefined);
          addEdge(id, 'agent_0', undefined, 'dashed');
        }
        addEdge('orch', id, undefined, 'dashed');
        agentIds.push(id);
      });
      exits = agentIds.slice(1);
      rightX = oX + 300;
    } else {
      // Evaluator loop: workers in sequence, critic loops back to the first worker
      addNode('orch', oX, 100, 'Loop Controller', 'orchestrator', nodeCls('bg-blue-100 border-blue-500', true));
      let prev = entry;
      agents.forEach((a, i) => {
        const id = `agent_${i}`;
        addNode(id, oX + i * 240, 300, a.name, 'worker_llm', agentCls, a);
        addEdge(prev, id);
        addEdge('orch', id, undefined, 'dashed');
        agentIds.push(id);
        prev = id;
      });
      const criticX = oX + agents.length * 240;
      addNode('critic', criticX, 300, '🧐 Critic / Reviewer', 'planner_llm', nodeCls('bg-violet-100 border-violet-500', true), { name: 'Critic Agent', role: 'Scores the output against acceptance criteria and sends feedback until it passes.', uses: [], toolsExample: 'Rubric, test results' });
      addEdge(prev, 'critic', 'Evaluate');
      addEdge('critic', 'agent_0', 'Revise', 'loop');
      exits = ['critic'];
      rightX = criticX;
    }

    // Model nodes
    addNode('planner_model', oX, -60, '🧠 Planner Model', 'planner_llm', nodeCls('bg-slate-800 border-slate-900 text-white', true));
    addEdge('planner_model', 'orch', undefined, 'dashed');
    if (multiAgent) {
      addNode('worker_model', rightX + 20, -60, '⚙️ Worker Model', 'worker_llm', nodeCls('bg-slate-600 border-slate-700 text-white', true));
      addEdge('worker_model', agentIds[agentIds.length - 1], undefined, 'dashed');
    }
    if (multiAgent && modules.has('comms')) {
      addNode('comms', oX + 150, 620, '📡 Agent Protocol', 'comms', nodeCls('bg-cyan-50 border-cyan-500'));
      addEdge('orch', 'comms', undefined, 'dashed');
    }

    // 3. Shared resources, wired only to agents that use them
    const resX = rightX + 320;
    const resources: { key: Resource; module: ModuleKey; y: number; label: string; cls: string }[] = [
      { key: 'tools', module: 'tools', y: 60, label: '🔌 Tools / MCP', cls: 'bg-amber-50 border-amber-500' },
      { key: 'knowledge', module: 'knowledge', y: 220, label: '📚 Knowledge (RAG)', cls: 'bg-emerald-50 border-emerald-500' },
      { key: 'memory', module: 'memory', y: 380, label: '🗂️ Memory', cls: 'bg-teal-50 border-teal-500' },
      { key: 'sandbox', module: 'sandbox', y: 540, label: '📦 Code Sandbox', cls: 'bg-orange-50 border-orange-500' },
    ];
    resources.forEach(r => {
      if (!modules.has(r.module)) return;
      // agentIds are created in the same order as industry.agents for every multi-agent pattern
      const users = pattern === 'single' ? ['orch'] : agentIds.filter((_, i) => agents[i]?.uses.includes(r.key));
      addNode(r.key, resX, r.y, r.label, r.key, nodeCls(r.cls));
      (users.length ? users : [agentIds[0]]).forEach(u => addEdge(u, r.key, undefined, 'dashed'));
    });

    // 4. Human approval, output guardrails, output
    const outX = resX + 300;
    let last = exits;
    if (autonomy !== 'autonomous') {
      addNode('hitl', outX, 460, autonomy === 'assistive' ? '🙋 Human Review (all outputs)' : '🙋 Approval (high-risk only)', 'hitl', nodeCls('bg-yellow-100 border-yellow-500', true));
      last.forEach(e => addEdge(e, 'hitl', autonomy === 'assistive' ? 'Review' : 'If risky'));
      last = autonomy === 'assistive' ? ['hitl'] : [...last, 'hitl'];
    }
    if (modules.has('guardrails')) {
      addNode('guard_out', outX, 300, '🛡️ Output Guardrails', 'guardrails', nodeCls('bg-red-50 border-red-400'));
      last.forEach(e => addEdge(e, 'guard_out'));
      last = ['guard_out'];
    }
    addNode('output', outX + 260, 300, '✅ Output / Action', 'output', nodeCls('bg-green-100 border-green-500', true));
    last.forEach(e => addEdge(e, 'output'));

    // 5. Platform lane
    if (modules.has('runtime')) {
      addNode('runtime', oX - 260, 620, '⏱️ Durable Runtime', 'runtime', nodeCls('bg-gray-100 border-gray-500'));
      addEdge('runtime', 'orch', 'Checkpoints', 'dashed');
    }
    if (modules.has('observability')) {
      addNode('observability', outX, 700, '🔭 Tracing & Evals', 'observability', nodeCls('bg-teal-100 border-teal-500'));
      addEdge('orch', 'observability', 'Traces', 'dashed');
    }

    newNodes.forEach(n => {
      n.data.label = (
        <>
          <span className="block leading-tight mb-1 font-semibold">{n.data.label as string}</span>
          <span className="bg-white/70 px-2 py-0.5 rounded text-[10px] font-mono text-slate-800 block w-full truncate border border-black/10">
            {n.data.techName as string}
          </span>
        </>
      );
    });

    // Metrics: estimated LLM calls and latency per task, by pattern
    const N = agents.length;
    const P = tech('planner_llm').latencyMs;
    const W = multiAgent ? tech('worker_llm').latencyMs : P;
    const T = modules.has('tools') ? tech('tools').latencyMs : 0;
    const shape: Record<Pattern, { planner: number; worker: number; latency: number }> = {
      single: { planner: 4, worker: 0, latency: 4 * P + 2 * T },
      sequential: { planner: 0, worker: N, latency: N * (W + T) },
      supervisor: { planner: 2, worker: N, latency: 2 * P + W + T },
      hierarchical: { planner: 6, worker: N, latency: 4 * P + W + T },
      handoff: { planner: 0, worker: 3, latency: W + 2 * (W + T) },
      critic: { planner: 1.5, worker: N * 1.5, latency: 1.5 * (N * (W + T) + P) },
    };
    const s = shape[pattern];
    let latency = s.latency + tech('orchestrator').latencyMs;
    if (modules.has('guardrails')) latency += 2 * tech('guardrails').latencyMs;
    if (multiAgent && modules.has('comms')) latency += N * tech('comms').latencyMs;
    const calls = Math.round(s.planner + s.worker);
    const modelCost = s.planner * tech('planner_llm').costValue + s.worker * (multiAgent ? tech('worker_llm').costValue : tech('planner_llm').costValue);
    let infraCost = 0;
    let complexity = 0;
    activeCats.forEach(c => {
      if (c !== 'planner_llm' && c !== 'worker_llm') infraCost += catalog[c].options.find(o => o.id === selectedTech[c])?.costValue ?? 0;
      complexity += complexityScore[tech(c).complexity];
    });

    return {
      nodes: newNodes,
      edges: newEdges,
      metrics: { latency: Math.round(latency), calls, costScore: Math.round(modelCost + infraCost), opsScore: Math.round((complexity / activeCats.size) * 33), agents: pattern === 'single' ? 1 : N + (pattern === 'critic' ? 1 : 0) },
      activeCategories: activeCats,
    };
  }, [industry, pattern, autonomy, modules, selectedTech]);

  const costLabel = metrics.costScore < 30 ? 'Low ($)' : metrics.costScore < 60 ? 'Medium ($$)' : metrics.costScore < 100 ? 'High ($$$)' : 'Very High ($$$$)';

  // Risk: autonomy + regulation + missing controls
  const riskScore = (autonomy === 'autonomous' ? 3 : autonomy === 'supervised' ? 1 : 0)
    + (industry.regulated ? 2 : 0)
    + (modules.has('guardrails') ? -1 : 1)
    + (modules.has('observability') ? -1 : 1)
    + (selectedTech.output === 'system_write' ? 1 : 0);
  const riskLabel = riskScore <= 1 ? 'Low' : riskScore <= 3 ? 'Medium' : 'High';

  // Advisor
  const advice: Advice[] = (() => {
    const list: Advice[] = [];
    const t = (c: string) => selectedTech[c];
    if (industry.regulated && autonomy === 'autonomous') list.push({ level: 'warn', text: `${industry.name} is regulated — fully autonomous agents writing to systems of record need human sign-off.`, fix: { label: 'Require approval', apply: () => setAutonomy('supervised') } });
    if (industry.regulated && !modules.has('guardrails')) list.push({ level: 'warn', text: 'Regulated data without guardrails risks PII leakage and prompt-injection via documents.', fix: { label: 'Add Guardrails', apply: () => toggleModule('guardrails') } });
    if (!modules.has('observability')) list.push({ level: 'warn', text: 'Multi-step agents are impossible to debug without traces. Add tracing before going to production.', fix: { label: 'Add Tracing', apply: () => toggleModule('observability') } });
    if (autonomy !== 'autonomous' && !modules.has('runtime') && scale === 'production') list.push({ level: 'warn', text: 'Human approvals can take hours or days — without a durable runtime the run is lost on restart.', fix: { label: 'Add Durable Runtime', apply: () => toggleModule('runtime') } });
    if (modules.has('runtime') && t('runtime') === 'plain_api' && scale === 'production') list.push({ level: 'info', text: 'A plain API server loses in-flight runs on deploys and timeouts; prefer a durable engine.', fix: { label: 'Use Temporal', apply: () => selectTech('runtime', 'temporal') } });
    if (pattern === 'supervisor' && industry.agents.length > 5) list.push({ level: 'info', text: 'One supervisor with many workers gets confused routing; split into teams.', fix: { label: 'Go Hierarchical', apply: () => applyShape(scale, 'hierarchical') } });
    if (pattern === 'hierarchical' && industry.agents.length <= 3) list.push({ level: 'info', text: 'Hierarchy adds 4+ planner calls of overhead for a small team — a single supervisor is enough.', fix: { label: 'Use Supervisor', apply: () => applyShape(scale, 'supervisor') } });
    if (pattern === 'handoff' && !modules.has('memory')) list.push({ level: 'warn', text: 'Handoffs lose context unless conversation state is carried in memory.', fix: { label: 'Add Memory', apply: () => toggleModule('memory') } });
    if (pattern === 'single' && industry.agents.length >= 5) list.push({ level: 'info', text: `A single agent covering ${industry.agents.length} specialist roles will have a long prompt and many tools; consider a supervisor once evals show failures.` });
    if (pattern !== 'single' && scale === 'prototype' && industry.agents.length > 3) list.push({ level: 'info', text: 'Prototype tip: validate the task with a single agent first — multi-agent adds cost and failure modes.' });
    if (industry.agents.some(a => a.uses.includes('sandbox')) && !modules.has('sandbox')) list.push({ level: 'warn', text: 'Some agents run code (analysis / tests) but no sandbox is configured.', fix: { label: 'Add Sandbox', apply: () => toggleModule('sandbox') } });
    if (t('planner_llm') !== 'opus' && t('planner_llm') !== 'sonnet' && pattern === 'hierarchical') list.push({ level: 'info', text: 'Hierarchical planning is reasoning-heavy — a top-tier planner model reduces delegation errors.' });
    if (t('worker_llm') === 'sonnet_w' && pattern !== 'single' && !['legal', 'software'].includes(industry.id)) list.push({ level: 'info', text: 'Workers make most calls. A small model is often enough for narrow tasks.', fix: { label: 'Use Haiku workers', apply: () => selectTech('worker_llm', 'haiku') } });
    if (modules.has('comms') && scale === 'prototype') list.push({ level: 'info', text: 'Distributed agents (A2A / queues) add network hops; keep agents in-process while prototyping.', fix: { label: 'Remove A2A', apply: () => toggleModule('comms') } });
    if (modules.has('tools') && t('tools') === 'computer_use' && !modules.has('sandbox')) list.push({ level: 'warn', text: 'Computer-use agents must run in an isolated VM or container.', fix: { label: 'Add Sandbox', apply: () => toggleModule('sandbox') } });
    if (modules.has('guardrails') && t('guardrails') === 'opa' && industry.regulated) list.push({ level: 'info', text: 'OPA gates tool calls but does not inspect content — pair it with a PII/injection classifier.' });
    if (list.length === 0) list.push({ level: 'info', text: 'No conflicts detected — the design matches its industry, pattern and autonomy level.' });
    return list;
  })();

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    if (node.data?.category) {
      setSelected({ category: node.data.category as string, agent: node.data.agent as AgentDef | undefined });
      setExpandedItem(null);
    }
  }, []);

  const handleExport = () => {
    const doc = new jsPDF();
    let y = 20;
    const newPageIfNeeded = (space = 30) => { if (y > 280 - space) { doc.addPage(); y = 20; } };
    const para = (text: string, size = 10, color: [number, number, number] = [60, 60, 60]) => {
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, 170);
      newPageIfNeeded(lines.length * 5);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 1;
    };

    para(`${industry.name} — Agent System Blueprint`, 18, [63, 81, 181]);
    y += 3;
    para(`Pattern: ${PATTERNS.find(p => p.id === pattern)?.label} | Autonomy: ${autonomy} | Scale: ${scale}`, 10, [100, 100, 100]);
    para(industry.summary);
    y += 4;
    para('Estimates', 14, [0, 0, 0]);
    para(`- LLM calls per task: ~${metrics.calls}   - Latency (excl. human wait): ~${(metrics.latency / 1000).toFixed(1)}s`);
    para(`- Cost profile: ${costLabel}   - Risk level: ${riskLabel}   - Agents: ${metrics.agents}`);
    y += 4;
    para('Agent Roster', 14, [0, 0, 0]);
    industry.agents.forEach(a => para(`- ${a.name}: ${a.role} (tools: ${a.toolsExample})`));
    y += 4;
    para('Technology Decisions', 14, [0, 0, 0]);
    Array.from(activeCategories).forEach(cat => {
      const c = catalog[cat];
      const chosen = techFor(cat);
      newPageIfNeeded(30);
      para(c.title, 12, [40, 40, 150]);
      para(`Decision: ${chosen.name} — ${chosen.description}`, 10, [0, 0, 0]);
      para(`Pros: ${chosen.pros}. Trade-off: ${chosen.cons}.`);
      para(`Alternatives considered: ${c.options.filter(o => o.id !== chosen.id).map(o => o.name).join('; ')}`);
      y += 3;
    });
    para('Advisor Notes', 14, [0, 0, 0]);
    advice.forEach(a => para(`${a.level === 'warn' ? '[!]' : '[i]'} ${a.text}`));

    doc.save(`${industry.id}-agent-blueprint.pdf`);
  };

  const OptionCard = ({ item, cat }: { item: TechOption; cat: string }) => {
    const isSelected = selectedTech[cat] === item.id;
    const isExpanded = expandedItem === item.id;
    const isRecommended = recommendedFor(cat, scale, pattern, industry) === item.id;
    return (
      <div className={`border rounded-lg p-3 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
        <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpandedItem(isExpanded ? null : item.id)}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
              <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{item.name}</span>
              {isRecommended && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200 font-bold">
                  <Sparkles className="w-3 h-3" /> Best fit
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"><Clock className="w-3 h-3" /> {item.latencyText}</span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100"><Calculator className="w-3 h-3" /> {item.costText}</span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded border border-orange-100"><Cpu className="w-3 h-3" /> {item.complexity}</span>
            </div>
          </div>
          <div className="mt-1">{isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}</div>
        </div>
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs leading-relaxed text-slate-600 mb-2">{item.description}</p>
            <p className="text-xs text-emerald-700 mb-1">+ {item.pros}</p>
            <p className="text-xs text-rose-700 mb-3">− {item.cons}</p>
            <div className="flex items-center justify-between">
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Documentation
                </a>
              ) : <span />}
              {!isSelected && (
                <button onClick={e => { e.stopPropagation(); selectTech(cat, item.id); }} className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition-colors shadow-sm">
                  Select
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const segBtn = (active: boolean) => `py-1 px-1 text-[11px] font-bold rounded transition-colors ${active ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`;
  const checkRow = 'flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm';
  const stepBadge = (n: number) => <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{n}</span>;
  const cat = selected ? catalog[selected.category] : null;

  return (
    <div className="w-full h-full flex flex-col xl:flex-row bg-slate-50 overflow-hidden">
      {/* Controls Panel */}
      <div className="w-full xl:w-[24rem] h-full shrink-0 flex flex-col gap-2 p-3 bg-white border-r border-slate-200 z-20 shadow-lg overflow-y-auto custom-scrollbar">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-sm shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Agent System Analytics</h4>
            <button onClick={handleExport} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm">
              <Download className="w-3 h-3" /> EXPORT
            </button>
          </div>
          {[
            { icon: <Bot className="w-3 h-3 text-slate-400" />, label: 'Agents / LLM calls per task', value: `${metrics.agents} / ~${metrics.calls}` },
            { icon: <Clock className="w-3 h-3 text-slate-400" />, label: 'Task latency (excl. humans)', value: `~${(metrics.latency / 1000).toFixed(1)} s` },
            { icon: <Calculator className="w-3 h-3 text-slate-400" />, label: 'Cost Profile', value: costLabel },
            { icon: <ShieldAlert className="w-3 h-3 text-slate-400" />, label: 'Risk Level', value: riskLabel },
            { icon: <Layers className="w-3 h-3 text-slate-400" />, label: 'Ops Load', value: metrics.opsScore < 50 ? 'Lean' : metrics.opsScore < 70 ? 'Moderate' : 'Heavy' },
          ].map(m => (
            <div key={m.label} className="flex items-center justify-between mb-1 last:mb-0">
              <span className="text-xs text-slate-600 flex items-center gap-2">{m.icon} {m.label}</span>
              <span className={`font-mono text-xs font-bold ${m.label === 'Risk Level' && riskLabel === 'High' ? 'text-red-600' : 'text-slate-900'}`}>{m.value}</span>
            </div>
          ))}
        </div>

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">{stepBadge(1)} Industry Use Case</h4>
          <div className="grid grid-cols-3 gap-1">
            {INDUSTRIES.map(ind => (
              <button key={ind.id} onClick={() => applyIndustry(ind)} className={`text-[11px] font-semibold py-1.5 px-1 rounded border transition-colors ${ind.id === industryId ? 'bg-indigo-50 border-indigo-400 text-indigo-800' : 'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'}`}>
                <span className="block text-base leading-none mb-0.5">{ind.emoji}</span>{ind.name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{industry.summary}</p>
        </div>

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">{stepBadge(2)} Orchestration Pattern</h4>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
            {PATTERNS.map(p => (
              <button key={p.id} title={p.hint} onClick={() => applyShape(scale, p.id)} className={segBtn(pattern === p.id)}>{p.label}</button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{PATTERNS.find(p => p.id === pattern)?.hint}</p>
        </div>

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">{stepBadge(3)} Autonomy & Scale</h4>
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
              {(['assistive', 'supervised', 'autonomous'] as Autonomy[]).map(a => (
                <button key={a} onClick={() => setAutonomy(a)} className={segBtn(autonomy === a)} title={a === 'assistive' ? 'Human reviews every output' : a === 'supervised' ? 'Human approves high-risk actions' : 'No human in the loop'}>
                  {a === 'assistive' ? 'Assistive' : a === 'supervised' ? 'Supervised' : 'Autonomous'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
              {(['prototype', 'production'] as Scale[]).map(s => (
                <button key={s} onClick={() => applyShape(s, pattern)} className={segBtn(scale === s)}>{s === 'prototype' ? 'Prototype' : 'Production'}</button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer" title="Re-pick recommended technologies whenever scale or pattern changes">
                <input type="checkbox" checked={autoAdapt} onChange={() => setAutoAdapt(!autoAdapt)} className="accent-indigo-600 w-3 h-3" />
                Auto-adapt tech on change
              </label>
              <button onClick={() => setSelectedTech(pickRecommended(scale, pattern, industry))} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded hover:bg-amber-200 transition-colors">
                <Wand2 className="w-3 h-3" /> Best-fit stack
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">{stepBadge(4)} Agent Capabilities</h4>
          <div className="flex flex-col gap-1">
            {MODULES.map(m => {
              const disabled = m.key === 'comms' && pattern === 'single';
              return (
                <label key={m.key} className={`${checkRow} ${disabled ? 'opacity-50' : ''}`} title={m.hint}>
                  <input type="checkbox" disabled={disabled} checked={modules.has(m.key)} onChange={() => toggleModule(m.key)} className="accent-indigo-600 w-3 h-3" />
                  <span className="font-medium text-slate-700">{m.label}</span>
                  <span className="ml-auto text-[10px] text-slate-400 truncate">{m.hint}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 pb-2">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">{stepBadge(5)} Agent Design Advisor</h4>
          <div className="flex flex-col gap-1.5">
            {advice.map((a, i) => (
              <div key={i} className={`text-[11px] p-2 rounded border flex gap-2 ${a.level === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-sky-50 border-sky-200 text-sky-900'}`}>
                {a.level === 'warn' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="leading-snug">{a.text}</p>
                  {a.fix && (
                    <button onClick={a.fix.apply} className="mt-1 text-[10px] font-bold px-2 py-0.5 bg-white border border-current rounded hover:bg-slate-50">{a.fix.label}</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DAG Display */}
      <div className="flex-1 h-full bg-slate-50 relative min-h-[600px]">
        <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur px-5 py-3 text-sm font-bold border border-slate-200 rounded-xl text-indigo-900 shadow-lg flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          {industry.emoji} {industry.name} — {PATTERNS.find(p => p.id === pattern)?.label} Agent System
        </div>

        <ReactFlow key={`${industryId}-${pattern}-${autonomy}`} nodes={nodes} edges={edges} onNodeClick={onNodeClick} fitView attributionPosition="bottom-right">
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {selected && cat && (
          <div className={`absolute top-4 right-4 z-20 ${compareMode ? 'w-[40rem]' : 'w-[24rem]'} max-w-[95%] max-h-[95%] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl p-5 flex flex-col custom-scrollbar`}>
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-2 border-b border-slate-100 z-10">
              <h3 className="font-bold text-lg text-slate-900 leading-tight pr-4">{selected.agent ? selected.agent.name : cat.title}</h3>
              <div className="flex gap-1">
                <button onClick={() => setCompareMode(!compareMode)} title="Compare alternatives" className={`rounded p-1 transition-colors ${compareMode ? 'bg-indigo-600 text-white' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'}`}>
                  <Table2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded p-1 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {selected.agent && (
              <div className="mb-4 bg-violet-50 border border-violet-200 p-4 rounded-lg">
                <h4 className="text-xs font-bold text-violet-800 uppercase tracking-wider mb-2 flex items-center gap-1"><Bot className="w-4 h-4" /> Agent Role</h4>
                <p className="text-sm text-violet-900 leading-relaxed mb-2">{selected.agent.role}</p>
                <p className="text-xs text-violet-800"><span className="font-bold">Example tools:</span> {selected.agent.toolsExample}</p>
                {selected.agent.uses.length > 0 && (
                  <p className="text-xs text-violet-800"><span className="font-bold">Uses:</span> {selected.agent.uses.join(', ')}</p>
                )}
                <p className="text-[11px] text-violet-600 mt-2 italic">Below: the model powering this agent.</p>
              </div>
            )}

            <div className="mb-4 bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1"><BookOpen className="w-4 h-4" /> {cat.title}</h4>
              <p className="text-sm text-indigo-900 leading-relaxed">{cat.concept}</p>
            </div>

            <div className="mb-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">How to Decide</h4>
              <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                {cat.decisionTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>

            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">
              {compareMode ? 'Compare Alternatives' : 'Select Technology'} <span className="text-slate-400 normal-case font-normal">— best fit for {industry.name} / {scale}</span>
            </h4>

            {compareMode ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-left">
                      <th className="p-2">Option</th><th className="p-2">Pros</th><th className="p-2">Cons</th><th className="p-2">Cost</th><th className="p-2">Ops</th><th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.options.map(o => {
                      const isSel = selectedTech[selected.category] === o.id;
                      return (
                        <tr key={o.id} className={`border-b border-slate-100 align-top ${isSel ? 'bg-indigo-50' : ''}`}>
                          <td className="p-2 font-semibold text-slate-800">
                            {o.name}
                            {recommendedFor(selected.category, scale, pattern, industry) === o.id && <Sparkles className="inline w-3 h-3 ml-1 text-amber-500" />}
                          </td>
                          <td className="p-2 text-emerald-700">{o.pros}</td>
                          <td className="p-2 text-rose-700">{o.cons}</td>
                          <td className="p-2 whitespace-nowrap">{o.costText}</td>
                          <td className="p-2">{o.complexity}</td>
                          <td className="p-2">
                            {isSel ? <CheckCircle className="w-4 h-4 text-indigo-600" /> : (
                              <button onClick={() => selectTech(selected.category, o.id)} className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-semibold hover:bg-indigo-700">Use</button>
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
                {cat.options.map(o => <OptionCard key={o.id} item={o} cat={selected.category} />)}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </div>
  );
}
