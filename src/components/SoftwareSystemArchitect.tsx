import { useState, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { X, ChevronDown, ChevronUp, ExternalLink, Calculator, Clock, Cpu, CheckCircle, Download, BookOpen, Layers, Sparkles, AlertTriangle, Info, Wand2, Table2, ThumbsUp, ThumbsDown } from 'lucide-react';
import jsPDF from 'jspdf';
import '@xyflow/react/dist/style.css';

type Scale = 'startup' | 'growth' | 'hyperscale';
type Style = 'monolith' | 'microservices' | 'serverless';
type Tag = Scale | Style;
type Complexity = 'Low' | 'Medium' | 'High';

type ModuleKey =
  | 'cdn' | 'waf' | 'auth' | 'realtime' | 'cache' | 'search' | 'objectStorage'
  | 'queue' | 'notifications' | 'payments' | 'analytics' | 'observability' | 'devops' | 'mesh';

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
  bestFor: Tag[];
}

interface Category {
  title: string;
  layer: string;
  concept: string;
  decisionTips: string[];
  options: TechOption[];
}

// -------------------------------------------------------------
// Tech catalogue: every component with its alternatives
// -------------------------------------------------------------
const catalog: Record<string, Category> = {
  web_client: {
    title: 'Web Frontend',
    layer: 'Client',
    concept: 'The browser-facing application. Choose between client-side SPAs, server-rendered (SSR) frameworks for SEO and first-paint speed, or hypermedia approaches that keep logic on the server.',
    decisionTips: ['SEO-critical (e-commerce, content)? Prefer SSR/SSG.', 'Internal dashboards can be pure SPA.', 'Team skill set usually matters more than benchmarks.'],
    options: [
      { id: 'nextjs', name: 'React + Next.js', description: 'Most popular React meta-framework with SSR, SSG and server components.', pros: 'Huge ecosystem, SEO-friendly, hiring pool', cons: 'Framework churn, vendor-leaning features', url: 'https://nextjs.org/', costText: 'Free', costValue: 1, latencyText: 'Fast FCP (SSR)', latencyMs: 0, complexity: 'Medium', bestFor: ['startup', 'growth', 'hyperscale', 'monolith', 'microservices', 'serverless'] },
      { id: 'angular', name: 'Angular', description: 'Opinionated, batteries-included framework from Google.', pros: 'Strong structure for large teams, TypeScript-first', cons: 'Steeper learning curve, verbose', url: 'https://angular.dev/', costText: 'Free', costValue: 1, latencyText: 'CSR/SSR', latencyMs: 0, complexity: 'High', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'vue', name: 'Vue + Nuxt', description: 'Progressive framework with gentle learning curve and SSR via Nuxt.', pros: 'Simple, productive, great docs', cons: 'Smaller enterprise ecosystem than React', url: 'https://nuxt.com/', costText: 'Free', costValue: 1, latencyText: 'CSR/SSR', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth', 'monolith'] },
      { id: 'sveltekit', name: 'SvelteKit', description: 'Compiler-based framework producing tiny bundles.', pros: 'Smallest bundles, very fast', cons: 'Smaller talent pool', url: 'https://kit.svelte.dev/', costText: 'Free', costValue: 1, latencyText: 'Very fast', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'serverless'] },
      { id: 'htmx', name: 'HTMX + Server Templates', description: 'Hypermedia-driven UI; server returns HTML fragments.', pros: 'Minimal JS, one codebase with backend', cons: 'Limited for rich offline/interactive UIs', url: 'https://htmx.org/', costText: 'Free', costValue: 0, latencyText: 'Server-bound', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'monolith'] },
    ],
  },
  mobile_client: {
    title: 'Mobile App',
    layer: 'Client',
    concept: 'Cross-platform frameworks share one codebase across iOS and Android; native gives best performance and platform APIs at the cost of two codebases.',
    decisionTips: ['Heavy device features (AR, BLE, camera pipelines) → native.', 'Share code with a React web app → React Native.', 'Consider a PWA first if app-store presence is optional.'],
    options: [
      { id: 'rn', name: 'React Native / Expo', description: 'JavaScript/TypeScript cross-platform apps with native components.', pros: 'Shares skills/code with React web', cons: 'Bridge/native module friction', url: 'https://reactnative.dev/', costText: 'Free', costValue: 2, latencyText: 'Near-native', latencyMs: 0, complexity: 'Medium', bestFor: ['startup', 'growth'] },
      { id: 'flutter', name: 'Flutter', description: 'Dart-based UI toolkit rendering its own widgets.', pros: 'Pixel-perfect consistent UI, fast', cons: 'Dart talent pool, larger app size', url: 'https://flutter.dev/', costText: 'Free', costValue: 2, latencyText: 'Near-native', latencyMs: 0, complexity: 'Medium', bestFor: ['startup', 'growth'] },
      { id: 'native', name: 'Native (Swift + Kotlin)', description: 'Separate iOS and Android codebases using platform SDKs.', pros: 'Best performance & platform access', cons: 'Two teams, double the work', url: 'https://developer.android.com/kotlin', costText: '2x Team Cost', costValue: 6, latencyText: 'Native', latencyMs: 0, complexity: 'High', bestFor: ['hyperscale'] },
      { id: 'pwa', name: 'Progressive Web App', description: 'Installable web app with offline support via service workers.', pros: 'No app store, one codebase', cons: 'Limited iOS capabilities', url: 'https://web.dev/progressive-web-apps/', costText: 'Free', costValue: 0, latencyText: 'Web', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'serverless'] },
    ],
  },
  cdn: {
    title: 'CDN & Edge Caching',
    layer: 'Edge',
    concept: 'A Content Delivery Network caches static assets (and optionally API responses) at points-of-presence close to users, cutting latency and offloading origin servers.',
    decisionTips: ['Cache static assets with immutable, hashed filenames.', 'Edge compute (Workers) can do auth, A/B tests and redirects.', 'Watch egress pricing at scale.'],
    options: [
      { id: 'cloudflare', name: 'Cloudflare', description: 'Global CDN with built-in DDoS protection, Workers edge compute and R2.', pros: 'Generous free tier, edge compute', cons: 'Less granular than AWS for some configs', url: 'https://www.cloudflare.com/', costText: 'Free → $$', costValue: 1, latencyText: '~10ms', latencyMs: 10, complexity: 'Low', bestFor: ['startup', 'growth', 'hyperscale', 'serverless', 'monolith'] },
      { id: 'cloudfront', name: 'AWS CloudFront', description: 'AWS-native CDN tightly integrated with S3, ALB and Lambda@Edge.', pros: 'Native AWS integration', cons: 'Egress costs, slower config propagation', url: 'https://aws.amazon.com/cloudfront/', costText: 'Pay per GB', costValue: 3, latencyText: '~15ms', latencyMs: 15, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'microservices', 'serverless'] },
      { id: 'fastly', name: 'Fastly', description: 'Programmable edge with instant purge; used by large media sites.', pros: 'Instant purge, VCL/Wasm edge logic', cons: 'Pricier, steeper learning curve', url: 'https://www.fastly.com/', costText: '$$$', costValue: 5, latencyText: '~8ms', latencyMs: 8, complexity: 'High', bestFor: ['hyperscale'] },
      { id: 'akamai', name: 'Akamai', description: 'The largest legacy CDN, common in enterprises and media.', pros: 'Massive global footprint', cons: 'Enterprise contracts, complex', url: 'https://www.akamai.com/', costText: 'Enterprise $$$$', costValue: 7, latencyText: '~10ms', latencyMs: 10, complexity: 'High', bestFor: ['hyperscale'] },
    ],
  },
  waf: {
    title: 'WAF & DDoS Protection',
    layer: 'Edge',
    concept: 'A Web Application Firewall blocks OWASP Top-10 attacks (SQLi, XSS), bots and volumetric DDoS before traffic reaches your servers. Rate limiting typically lives here too.',
    decisionTips: ['Start with managed rule sets, then tune false positives.', 'Pair with rate limiting per IP / per API key.'],
    options: [
      { id: 'cf_waf', name: 'Cloudflare WAF', description: 'Managed rule sets, bot management and unmetered DDoS.', pros: 'Easy setup, strong DDoS', cons: 'Advanced bot mgmt is paid', url: 'https://www.cloudflare.com/waf/', costText: '$ → $$', costValue: 2, latencyText: '~2ms', latencyMs: 2, complexity: 'Low', bestFor: ['startup', 'growth', 'monolith', 'serverless'] },
      { id: 'aws_waf', name: 'AWS WAF + Shield', description: 'AWS-native WAF attached to ALB/CloudFront/API Gateway.', pros: 'Native to AWS, fine-grained rules', cons: 'Shield Advanced is expensive', url: 'https://aws.amazon.com/waf/', costText: 'Per rule + requests', costValue: 4, latencyText: '~2ms', latencyMs: 2, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'azure_fd', name: 'Azure Front Door WAF', description: 'Global load balancing + WAF for Azure workloads.', pros: 'Combined LB + WAF + CDN', cons: 'Azure-centric', url: 'https://azure.microsoft.com/products/frontdoor', costText: '$$', costValue: 4, latencyText: '~3ms', latencyMs: 3, complexity: 'Medium', bestFor: ['growth', 'hyperscale'] },
      { id: 'coraza', name: 'ModSecurity / Coraza (OSS)', description: 'Self-hosted open-source WAF with OWASP Core Rule Set.', pros: 'Free, full control', cons: 'You operate and tune it', url: 'https://coraza.io/', costText: 'Free (ops)', costValue: 1, latencyText: '~5ms', latencyMs: 5, complexity: 'High', bestFor: ['monolith'] },
    ],
  },
  gateway: {
    title: 'Load Balancer / API Gateway',
    layer: 'Entry',
    concept: 'The single entry point for API traffic. Handles TLS termination, routing, rate limiting, request auth and load balancing across instances or services.',
    decisionTips: ['Monoliths often only need an L7 load balancer.', 'Microservices benefit from a gateway for routing, auth and aggregation (BFF pattern).'],
    options: [
      { id: 'nginx', name: 'NGINX / HAProxy', description: 'Battle-tested reverse proxy and load balancer.', pros: 'Extremely fast, stable, free', cons: 'Config-file driven, fewer API mgmt features', url: 'https://nginx.org/', costText: 'Free', costValue: 1, latencyText: '~1ms', latencyMs: 1, complexity: 'Low', bestFor: ['startup', 'monolith'] },
      { id: 'kong', name: 'Kong Gateway', description: 'Plugin-based API gateway built on NGINX/OpenResty.', pros: 'Auth, rate-limit, plugins out-of-box', cons: 'Enterprise features are paid', url: 'https://konghq.com/', costText: 'OSS / $$$', costValue: 4, latencyText: '~3ms', latencyMs: 3, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'aws_apigw', name: 'AWS API Gateway / ALB', description: 'Managed gateway; native trigger for Lambda.', pros: 'Zero ops, integrates with Lambda', cons: 'Per-request cost, 29s timeout', url: 'https://aws.amazon.com/api-gateway/', costText: '$3.50 / 1M req', costValue: 4, latencyText: '~10ms', latencyMs: 10, complexity: 'Low', bestFor: ['startup', 'growth', 'serverless'] },
      { id: 'envoy', name: 'Envoy / Gloo / Emissary', description: 'Cloud-native L7 proxy, also the data plane of Istio.', pros: 'gRPC, observability, dynamic config', cons: 'Complex configuration', url: 'https://www.envoyproxy.io/', costText: 'Free (ops)', costValue: 3, latencyText: '~2ms', latencyMs: 2, complexity: 'High', bestFor: ['hyperscale', 'microservices'] },
      { id: 'traefik', name: 'Traefik', description: 'Auto-discovering edge router for Docker/Kubernetes.', pros: 'Auto service discovery, Let\'s Encrypt', cons: 'Less mature at massive scale', url: 'https://traefik.io/', costText: 'Free', costValue: 1, latencyText: '~2ms', latencyMs: 2, complexity: 'Low', bestFor: ['startup', 'growth', 'microservices'] },
    ],
  },
  api_style: {
    title: 'API Contract Style',
    layer: 'Entry',
    concept: 'How clients and services talk. REST is universal, GraphQL lets clients shape responses, gRPC is fastest for service-to-service, tRPC gives end-to-end types in TypeScript monorepos.',
    decisionTips: ['Public APIs → REST + OpenAPI.', 'Many client shapes over the same data → GraphQL.', 'Internal high-throughput calls → gRPC.'],
    options: [
      { id: 'rest', name: 'REST + OpenAPI', description: 'Resource-oriented HTTP/JSON APIs with an OpenAPI spec.', pros: 'Universal, cacheable, simple', cons: 'Over/under-fetching', url: 'https://www.openapis.org/', costText: 'Free', costValue: 0, latencyText: '~2ms serialize', latencyMs: 2, complexity: 'Low', bestFor: ['startup', 'growth', 'hyperscale', 'monolith', 'serverless', 'microservices'] },
      { id: 'graphql', name: 'GraphQL (Apollo / Federation)', description: 'Query language letting clients request exactly what they need.', pros: 'Flexible for many clients, typed schema', cons: 'Caching & N+1 complexity', url: 'https://graphql.org/', costText: 'Free', costValue: 1, latencyText: '~5ms resolve', latencyMs: 5, complexity: 'Medium', bestFor: ['growth', 'microservices'] },
      { id: 'grpc', name: 'gRPC + Protobuf', description: 'Binary RPC over HTTP/2 with generated clients.', pros: 'Fast, strongly typed, streaming', cons: 'Not browser-native (needs gRPC-Web)', url: 'https://grpc.io/', costText: 'Free', costValue: 1, latencyText: '<1ms serialize', latencyMs: 1, complexity: 'High', bestFor: ['hyperscale', 'microservices'] },
      { id: 'trpc', name: 'tRPC', description: 'End-to-end type-safe RPC for TypeScript full-stack apps.', pros: 'No codegen, instant type safety', cons: 'TypeScript-only, not for public APIs', url: 'https://trpc.io/', costText: 'Free', costValue: 0, latencyText: '~2ms', latencyMs: 2, complexity: 'Low', bestFor: ['startup', 'monolith', 'serverless'] },
    ],
  },
  auth: {
    title: 'Identity & Auth',
    layer: 'Security',
    concept: 'Authentication (who you are) and authorization (what you can do). Use standards: OAuth 2.0 / OpenID Connect for login, JWT or opaque tokens for sessions, RBAC/ABAC for permissions.',
    decisionTips: ['Never roll your own crypto or password storage.', 'B2B SaaS needs SSO (SAML/OIDC) and SCIM.', 'Managed providers price per monthly active user.'],
    options: [
      { id: 'auth0', name: 'Auth0 / Okta', description: 'Managed identity platform with SSO, MFA and social login.', pros: 'Enterprise SSO, compliance', cons: 'Expensive per MAU at scale', url: 'https://auth0.com/', costText: 'Per MAU $$$', costValue: 5, latencyText: '~50ms (login)', latencyMs: 0, complexity: 'Low', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'clerk', name: 'Clerk / Supabase Auth', description: 'Developer-first auth with prebuilt UI components.', pros: 'Fastest to integrate', cons: 'Less enterprise customization', url: 'https://clerk.com/', costText: 'Free tier → $$', costValue: 2, latencyText: '~50ms (login)', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'serverless', 'monolith'] },
      { id: 'keycloak', name: 'Keycloak (Self-hosted)', description: 'Open-source IAM with OIDC, SAML, LDAP federation.', pros: 'Free, full control, SSO', cons: 'You operate and upgrade it', url: 'https://www.keycloak.org/', costText: 'Free (ops)', costValue: 3, latencyText: '~30ms (login)', latencyMs: 0, complexity: 'High', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'cognito', name: 'AWS Cognito / Firebase Auth', description: 'Cloud-provider managed user pools.', pros: 'Cheap, integrates with cloud IAM', cons: 'Clunky customization', url: 'https://aws.amazon.com/cognito/', costText: 'Low per MAU', costValue: 2, latencyText: '~60ms (login)', latencyMs: 0, complexity: 'Medium', bestFor: ['startup', 'growth', 'serverless'] },
      { id: 'custom_auth', name: 'Custom (Passport / Spring Security + JWT)', description: 'Framework libraries with your own user table.', pros: 'No vendor fees', cons: 'Security risk, MFA/SSO is on you', url: 'https://www.passportjs.org/', costText: 'Free (risk)', costValue: 1, latencyText: '~20ms (login)', latencyMs: 0, complexity: 'High', bestFor: ['monolith'] },
    ],
  },
  backend: {
    title: 'Backend Language & Framework',
    layer: 'Application',
    concept: 'Where business logic lives. The choice drives performance, hiring and ecosystem. In microservices, services can be polyglot — but a paved-road default reduces cognitive load.',
    decisionTips: ['Optimize for team familiarity first.', 'CPU-heavy or latency-critical services → Go/Rust/Java.', 'Data/ML-heavy domains → Python.'],
    options: [
      { id: 'node', name: 'Node.js (NestJS / Express / Fastify)', description: 'JavaScript/TypeScript runtime; great for I/O heavy APIs.', pros: 'Same language as frontend, fast I/O', cons: 'Single-threaded CPU limits', url: 'https://nestjs.com/', costText: 'Free', costValue: 2, latencyText: '~5ms overhead', latencyMs: 5, complexity: 'Low', bestFor: ['startup', 'growth', 'serverless', 'monolith', 'microservices'] },
      { id: 'spring', name: 'Java / Kotlin (Spring Boot)', description: 'Enterprise standard with a massive ecosystem.', pros: 'Mature, performant, huge ecosystem', cons: 'Heavier memory, slow cold starts', url: 'https://spring.io/projects/spring-boot', costText: 'Free (more RAM)', costValue: 3, latencyText: '~4ms overhead', latencyMs: 4, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'microservices', 'monolith'] },
      { id: 'go', name: 'Go (Gin / Fiber / stdlib)', description: 'Compiled, concurrent, tiny binaries — cloud-native favourite.', pros: 'Fast, low memory, simple concurrency', cons: 'Less expressive, smaller web ecosystem', url: 'https://go.dev/', costText: 'Free (low RAM)', costValue: 1, latencyText: '~1ms overhead', latencyMs: 1, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'microservices', 'serverless'] },
      { id: 'python', name: 'Python (FastAPI / Django)', description: 'Productive, ideal when ML/data is core to the product.', pros: 'Fastest to build, ML ecosystem', cons: 'Slower runtime, GIL', url: 'https://fastapi.tiangolo.com/', costText: 'Free', costValue: 2, latencyText: '~8ms overhead', latencyMs: 8, complexity: 'Low', bestFor: ['startup', 'monolith', 'serverless'] },
      { id: 'dotnet', name: 'C# / .NET (ASP.NET Core)', description: 'High-performance, strongly typed framework from Microsoft.', pros: 'Very fast, great tooling', cons: 'Microsoft-centric ecosystem', url: 'https://dotnet.microsoft.com/', costText: 'Free', costValue: 2, latencyText: '~2ms overhead', latencyMs: 2, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'monolith', 'microservices'] },
      { id: 'rust', name: 'Rust (Axum / Actix)', description: 'Memory-safe systems language for maximum performance.', pros: 'Fastest, no GC pauses', cons: 'Steep learning curve, slower dev', url: 'https://github.com/tokio-rs/axum', costText: 'Free (lowest RAM)', costValue: 1, latencyText: '<1ms overhead', latencyMs: 1, complexity: 'High', bestFor: ['hyperscale'] },
    ],
  },
  compute: {
    title: 'Compute & Hosting Platform',
    layer: 'Infrastructure',
    concept: 'Where your code runs. The spectrum goes from PaaS (least ops) → containers (ECS/Cloud Run) → Kubernetes (most control) → functions (scale-to-zero, pay-per-invocation).',
    decisionTips: ['Kubernetes pays off only with a platform team.', 'Spiky or low traffic → serverless / scale-to-zero.', 'Steady high load → reserved containers or VMs are cheaper.'],
    options: [
      { id: 'paas', name: 'PaaS (Render / Fly.io / Heroku / App Service)', description: 'Push code, platform handles servers, TLS and scaling.', pros: 'Near-zero ops', cons: 'Costly & limited at scale', url: 'https://render.com/', costText: '$ → $$', costValue: 2, latencyText: '—', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'monolith'] },
      { id: 'ecs', name: 'Containers (ECS Fargate / Cloud Run)', description: 'Managed container runtime without managing a cluster.', pros: 'Docker portability, low ops', cons: 'Less control than K8s', url: 'https://cloud.google.com/run', costText: '$$', costValue: 4, latencyText: '—', latencyMs: 0, complexity: 'Medium', bestFor: ['startup', 'growth', 'monolith', 'microservices'] },
      { id: 'k8s', name: 'Kubernetes (EKS / GKE / AKS)', description: 'Industry-standard container orchestration.', pros: 'Portable, huge ecosystem, fine control', cons: 'Operational complexity', url: 'https://kubernetes.io/', costText: '$$$ + platform team', costValue: 7, latencyText: '—', latencyMs: 0, complexity: 'High', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'lambda', name: 'Functions (AWS Lambda / Cloud Functions / Azure Functions)', description: 'Event-driven functions billed per invocation.', pros: 'Scale to zero, no servers', cons: 'Cold starts, time limits, vendor lock-in', url: 'https://aws.amazon.com/lambda/', costText: 'Per invocation', costValue: 2, latencyText: '+cold start ~100ms', latencyMs: 30, complexity: 'Medium', bestFor: ['startup', 'growth', 'serverless'] },
      { id: 'vms', name: 'VMs (EC2 / Compute Engine) + Autoscaling', description: 'Classic virtual machines in autoscaling groups.', pros: 'Full control, cheap with reservations', cons: 'Patching and config drift', url: 'https://aws.amazon.com/ec2/', costText: '$$', costValue: 4, latencyText: '—', latencyMs: 0, complexity: 'Medium', bestFor: ['monolith', 'hyperscale'] },
    ],
  },
  mesh: {
    title: 'Service Mesh & Discovery',
    layer: 'Application',
    concept: 'In microservices, a service mesh adds mTLS, retries, circuit breaking, traffic shifting and tracing between services via sidecar (or sidecar-less) proxies — without changing app code.',
    decisionTips: ['Adopt only once you have many services and a platform team.', 'Linkerd is simpler; Istio is more powerful.'],
    options: [
      { id: 'linkerd', name: 'Linkerd', description: 'Lightweight, Rust-based mesh focused on simplicity.', pros: 'Simple, low overhead, mTLS by default', cons: 'Fewer advanced traffic features', url: 'https://linkerd.io/', costText: 'Free (ops)', costValue: 3, latencyText: '~1ms/hop', latencyMs: 1, complexity: 'Medium', bestFor: ['growth', 'microservices'] },
      { id: 'istio', name: 'Istio (Ambient / Sidecar)', description: 'Most feature-rich mesh on Envoy.', pros: 'Advanced routing, policy, security', cons: 'Complex, resource heavy', url: 'https://istio.io/', costText: 'Free (heavy ops)', costValue: 5, latencyText: '~2ms/hop', latencyMs: 2, complexity: 'High', bestFor: ['hyperscale', 'microservices'] },
      { id: 'consul', name: 'HashiCorp Consul', description: 'Service discovery + mesh working across K8s and VMs.', pros: 'Multi-platform (VMs + K8s)', cons: 'Licensing changes (BSL)', url: 'https://www.consul.io/', costText: 'OSS / $$$', costValue: 4, latencyText: '~2ms/hop', latencyMs: 2, complexity: 'High', bestFor: ['hyperscale'] },
      { id: 'no_mesh', name: 'Client Libraries (no mesh)', description: 'Resilience via libraries (Resilience4j, Polly) and K8s DNS.', pros: 'No extra infra', cons: 'Logic duplicated per language', url: 'https://resilience4j.readme.io/', costText: 'Free', costValue: 0, latencyText: '0ms', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth'] },
    ],
  },
  primary_db: {
    title: 'Primary Database',
    layer: 'Data',
    concept: 'The system of record. Relational (SQL) databases give ACID transactions and joins; NoSQL trades those for horizontal scale and flexible schemas; distributed SQL tries to offer both. CAP theorem: under a network partition you choose consistency or availability.',
    decisionTips: ['Default to PostgreSQL unless you have a proven reason not to.', 'Money / inventory → strong consistency (ACID).', 'Massive write throughput with simple access patterns → wide-column / key-value.'],
    options: [
      { id: 'postgres', name: 'PostgreSQL (RDS / Aurora / Neon)', description: 'Feature-rich open-source relational DB with JSONB, extensions and strong ACID.', pros: 'Versatile, reliable, huge ecosystem', cons: 'Vertical scaling; sharding needs work (Citus)', url: 'https://www.postgresql.org/', costText: '$ → $$$', costValue: 3, latencyText: '~5ms', latencyMs: 5, complexity: 'Low', bestFor: ['startup', 'growth', 'monolith', 'microservices', 'serverless'] },
      { id: 'mysql', name: 'MySQL / Aurora MySQL / PlanetScale', description: 'Widely used relational DB; Vitess (PlanetScale) enables sharding.', pros: 'Proven at huge scale (Vitess)', cons: 'Fewer advanced features than Postgres', url: 'https://www.mysql.com/', costText: '$ → $$$', costValue: 3, latencyText: '~5ms', latencyMs: 5, complexity: 'Low', bestFor: ['startup', 'growth', 'hyperscale', 'monolith'] },
      { id: 'mongodb', name: 'MongoDB (Atlas)', description: 'Document database with flexible JSON schemas.', pros: 'Flexible schema, easy horizontal scale', cons: 'Joins and multi-doc transactions are weaker', url: 'https://www.mongodb.com/', costText: '$$', costValue: 4, latencyText: '~5ms', latencyMs: 5, complexity: 'Medium', bestFor: ['startup', 'growth', 'microservices'] },
      { id: 'dynamodb', name: 'DynamoDB / Firestore', description: 'Serverless key-value/document store with single-digit ms latency.', pros: 'Infinite scale, zero ops', cons: 'Must design around access patterns', url: 'https://aws.amazon.com/dynamodb/', costText: 'Per request', costValue: 3, latencyText: '~4ms', latencyMs: 4, complexity: 'Medium', bestFor: ['serverless', 'hyperscale'] },
      { id: 'cockroach', name: 'CockroachDB / Google Spanner / YugabyteDB', description: 'Distributed SQL — horizontally scalable with serializable transactions.', pros: 'Global scale + ACID', cons: 'Higher latency per write, cost', url: 'https://www.cockroachlabs.com/', costText: '$$$$', costValue: 7, latencyText: '~10ms', latencyMs: 10, complexity: 'High', bestFor: ['hyperscale', 'microservices'] },
      { id: 'cassandra', name: 'Cassandra / ScyllaDB', description: 'Wide-column store for massive write throughput.', pros: 'Linear write scalability, multi-DC', cons: 'Eventual consistency, query-first modelling', url: 'https://www.scylladb.com/', costText: '$$$', costValue: 6, latencyText: '~3ms', latencyMs: 3, complexity: 'High', bestFor: ['hyperscale'] },
    ],
  },
  cache: {
    title: 'Caching Layer',
    layer: 'Data',
    concept: 'Caching stores hot data in memory to cut database load and latency. Patterns: cache-aside, write-through, write-behind. The hard part is invalidation and avoiding thundering herds.',
    decisionTips: ['Set TTLs on everything.', 'Use request coalescing to avoid cache stampedes.', 'Redis doubles as rate limiter, session store and lightweight queue.'],
    options: [
      { id: 'redis', name: 'Redis (ElastiCache / Upstash)', description: 'In-memory data structure store; the default cache.', pros: 'Rich data types, pub/sub, huge adoption', cons: 'Licensing changes; memory cost', url: 'https://redis.io/', costText: '$ → $$', costValue: 3, latencyText: '~1ms', latencyMs: 1, complexity: 'Low', bestFor: ['startup', 'growth', 'hyperscale', 'monolith', 'microservices', 'serverless'] },
      { id: 'valkey', name: 'Valkey / Dragonfly', description: 'Open-source Redis-compatible alternatives; Dragonfly is multi-threaded.', pros: 'Truly OSS, higher throughput', cons: 'Younger projects', url: 'https://valkey.io/', costText: '$ → $$', costValue: 2, latencyText: '<1ms', latencyMs: 1, complexity: 'Medium', bestFor: ['growth', 'hyperscale'] },
      { id: 'memcached', name: 'Memcached', description: 'Simple, multi-threaded key-value cache.', pros: 'Very simple and fast', cons: 'No persistence or data structures', url: 'https://memcached.org/', costText: '$', costValue: 2, latencyText: '<1ms', latencyMs: 1, complexity: 'Low', bestFor: ['hyperscale', 'monolith'] },
      { id: 'inproc', name: 'In-process (Caffeine / LRU map)', description: 'Local memory cache inside each app instance.', pros: 'Fastest, zero infra', cons: 'Not shared; inconsistent across instances', url: 'https://github.com/ben-manes/caffeine', costText: 'Free', costValue: 0, latencyText: '~0.01ms', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'monolith'] },
    ],
  },
  search: {
    title: 'Search Engine',
    layer: 'Data',
    concept: 'Full-text search with relevance ranking, typo tolerance, facets and filters. Usually fed from the primary DB via Change Data Capture (CDC) or events, so it is eventually consistent.',
    decisionTips: ['Start with Postgres full-text search if needs are simple.', 'Keep the DB as source of truth; search index is rebuildable.'],
    options: [
      { id: 'elastic', name: 'Elasticsearch / OpenSearch', description: 'Distributed Lucene-based search and log analytics.', pros: 'Powerful queries, aggregations, scale', cons: 'Operationally heavy, JVM tuning', url: 'https://opensearch.org/', costText: '$$$', costValue: 6, latencyText: '~20ms', latencyMs: 20, complexity: 'High', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'meili', name: 'Meilisearch / Typesense', description: 'Lightweight, instant, typo-tolerant search engines.', pros: 'Simple, blazing fast for small-mid data', cons: 'Limited at very large scale', url: 'https://www.meilisearch.com/', costText: '$', costValue: 2, latencyText: '~5ms', latencyMs: 5, complexity: 'Low', bestFor: ['startup', 'growth', 'monolith'] },
      { id: 'algolia', name: 'Algolia', description: 'Hosted search-as-a-service with great front-end widgets.', pros: 'Zero ops, excellent UX', cons: 'Expensive per record/search', url: 'https://www.algolia.com/', costText: 'Per search $$$', costValue: 5, latencyText: '~10ms', latencyMs: 10, complexity: 'Low', bestFor: ['startup', 'serverless'] },
      { id: 'pgfts', name: 'Postgres Full-Text / pg_trgm', description: 'Built-in search inside your primary database.', pros: 'No new infra, transactional', cons: 'Weaker relevance; load on primary DB', url: 'https://www.postgresql.org/docs/current/textsearch.html', costText: 'Free', costValue: 0, latencyText: '~15ms', latencyMs: 15, complexity: 'Low', bestFor: ['startup', 'monolith'] },
      { id: 'vespa', name: 'Vespa / Solr', description: 'Large-scale search & recommendation serving with ML ranking.', pros: 'Hybrid vector + text, ML ranking', cons: 'Steep learning curve', url: 'https://vespa.ai/', costText: '$$$', costValue: 6, latencyText: '~15ms', latencyMs: 15, complexity: 'High', bestFor: ['hyperscale'] },
    ],
  },
  object_storage: {
    title: 'Object / Blob Storage',
    layer: 'Data',
    concept: 'Stores files (images, videos, documents, backups) cheaply with 11-nines durability. Clients upload directly via pre-signed URLs to bypass your servers; the CDN serves them.',
    decisionTips: ['Use pre-signed URLs for uploads/downloads.', 'Lifecycle rules move cold data to cheaper tiers.', 'Watch egress fees — R2 has zero egress.'],
    options: [
      { id: 's3', name: 'Amazon S3', description: 'The de-facto object storage standard.', pros: 'Ecosystem standard, storage tiers', cons: 'Egress fees', url: 'https://aws.amazon.com/s3/', costText: '$0.023 / GB-mo', costValue: 2, latencyText: '~20ms', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth', 'hyperscale', 'monolith', 'microservices', 'serverless'] },
      { id: 'r2', name: 'Cloudflare R2', description: 'S3-compatible storage with zero egress fees.', pros: 'No egress cost, S3 API', cons: 'Fewer features than S3', url: 'https://www.cloudflare.com/developer-platform/r2/', costText: '$0.015 / GB-mo', costValue: 1, latencyText: '~20ms', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth', 'serverless'] },
      { id: 'gcs', name: 'Google Cloud Storage / Azure Blob', description: 'Equivalent offerings on GCP / Azure.', pros: 'Native to those clouds', cons: 'Egress fees', url: 'https://cloud.google.com/storage', costText: '~$0.02 / GB-mo', costValue: 2, latencyText: '~20ms', latencyMs: 0, complexity: 'Low', bestFor: ['growth', 'hyperscale'] },
      { id: 'minio', name: 'MinIO (Self-hosted)', description: 'High-performance S3-compatible storage you run yourself.', pros: 'On-prem / air-gapped, S3 API', cons: 'You manage durability', url: 'https://min.io/', costText: 'Hardware + ops', costValue: 3, latencyText: '~5ms', latencyMs: 0, complexity: 'High', bestFor: ['monolith'] },
    ],
  },
  queue: {
    title: 'Message Queue / Event Bus',
    layer: 'Async',
    concept: 'Decouples producers from consumers so slow work (emails, payments, video transcoding) happens asynchronously. Queues (point-to-point) vs. logs/streams (replayable, many consumers). Enables event-driven architecture, Outbox pattern and Sagas.',
    decisionTips: ['Need replay / event sourcing / high throughput → Kafka.', 'Simple background jobs → SQS or RabbitMQ.', 'Design idempotent consumers — delivery is at-least-once.'],
    options: [
      { id: 'kafka', name: 'Apache Kafka (MSK / Confluent / Redpanda)', description: 'Distributed commit log for high-throughput event streaming.', pros: 'Replay, ordering per partition, massive scale', cons: 'Heavy to operate, overkill for small apps', url: 'https://kafka.apache.org/', costText: '$$$', costValue: 7, latencyText: '~5ms', latencyMs: 5, complexity: 'High', bestFor: ['hyperscale', 'microservices'] },
      { id: 'rabbitmq', name: 'RabbitMQ', description: 'Mature broker with flexible routing (exchanges, topics).', pros: 'Flexible routing, easy to start', cons: 'Limited replay, clustering quirks', url: 'https://www.rabbitmq.com/', costText: '$', costValue: 3, latencyText: '~2ms', latencyMs: 2, complexity: 'Medium', bestFor: ['growth', 'monolith', 'microservices'] },
      { id: 'sqs', name: 'AWS SQS + SNS / EventBridge', description: 'Fully managed queues and pub/sub fan-out.', pros: 'Zero ops, integrates with Lambda', cons: 'AWS lock-in, limited ordering (FIFO caps)', url: 'https://aws.amazon.com/sqs/', costText: '$0.40 / 1M msgs', costValue: 2, latencyText: '~20ms', latencyMs: 20, complexity: 'Low', bestFor: ['startup', 'growth', 'serverless'] },
      { id: 'pubsub', name: 'Google Pub/Sub / Azure Service Bus', description: 'Managed global messaging on GCP / Azure.', pros: 'Managed, global', cons: 'Cloud lock-in', url: 'https://cloud.google.com/pubsub', costText: 'Per GB', costValue: 3, latencyText: '~15ms', latencyMs: 15, complexity: 'Low', bestFor: ['growth', 'serverless'] },
      { id: 'nats', name: 'NATS JetStream', description: 'Lightweight, very fast messaging with persistence.', pros: 'Tiny footprint, very low latency', cons: 'Smaller ecosystem', url: 'https://nats.io/', costText: 'Free (ops)', costValue: 2, latencyText: '<1ms', latencyMs: 1, complexity: 'Medium', bestFor: ['microservices', 'growth'] },
      { id: 'redis_streams', name: 'Redis Streams / BullMQ', description: 'Queue on top of existing Redis.', pros: 'Reuse Redis, simple', cons: 'Durability limited to Redis config', url: 'https://docs.bullmq.io/', costText: '$', costValue: 1, latencyText: '~1ms', latencyMs: 1, complexity: 'Low', bestFor: ['startup', 'monolith'] },
    ],
  },
  workers: {
    title: 'Background Workers & Workflows',
    layer: 'Async',
    concept: 'Consumers that process queued jobs. For multi-step business processes (order → payment → shipping), a durable workflow engine handles retries, timeouts and compensation (Saga pattern).',
    decisionTips: ['Long-running, multi-step processes → durable workflows (Temporal).', 'Make every job idempotent and retry-safe.'],
    options: [
      { id: 'job_libs', name: 'Celery / Sidekiq / BullMQ / Hangfire', description: 'Language-native job queue libraries.', pros: 'Simple, well known', cons: 'Complex workflows get messy', url: 'https://docs.celeryq.dev/', costText: 'Compute', costValue: 2, latencyText: 'Async', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth', 'monolith'] },
      { id: 'temporal', name: 'Temporal', description: 'Durable execution engine — workflows as code that survive crashes.', pros: 'Reliable sagas, retries, visibility', cons: 'New programming model, cluster to run', url: 'https://temporal.io/', costText: 'OSS / Cloud $$', costValue: 5, latencyText: 'Async', latencyMs: 0, complexity: 'High', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'step_fn', name: 'AWS Step Functions / Durable Functions', description: 'Managed state machines orchestrating serverless functions.', pros: 'Visual workflows, zero ops', cons: 'JSON state language, lock-in', url: 'https://aws.amazon.com/step-functions/', costText: 'Per transition', costValue: 3, latencyText: 'Async', latencyMs: 0, complexity: 'Medium', bestFor: ['serverless'] },
      { id: 'k8s_jobs', name: 'Kubernetes Jobs / KEDA', description: 'Autoscaled consumer pods driven by queue depth.', pros: 'Scales on queue length', cons: 'Requires Kubernetes', url: 'https://keda.sh/', costText: 'Compute', costValue: 3, latencyText: 'Async', latencyMs: 0, complexity: 'Medium', bestFor: ['microservices', 'hyperscale'] },
    ],
  },
  realtime: {
    title: 'Real-time Updates',
    layer: 'Application',
    concept: 'Push updates to clients instantly (chat, notifications, live dashboards). WebSockets are bi-directional; Server-Sent Events (SSE) are simpler one-way streams; long-polling is the fallback.',
    decisionTips: ['One-way updates (feeds, progress) → SSE.', 'Chat / collaboration → WebSockets.', 'Scale connections with a pub/sub backplane (Redis).'],
    options: [
      { id: 'websocket', name: 'WebSockets (Socket.IO / ws)', description: 'Self-hosted persistent bi-directional connections.', pros: 'Full control, bi-directional', cons: 'Sticky sessions, connection scaling', url: 'https://socket.io/', costText: 'Compute', costValue: 3, latencyText: '~20ms push', latencyMs: 0, complexity: 'Medium', bestFor: ['growth', 'monolith', 'microservices'] },
      { id: 'sse', name: 'Server-Sent Events', description: 'One-way HTTP streaming from server to browser.', pros: 'Simple, works over HTTP/2', cons: 'One-direction only', url: 'https://developer.mozilla.org/docs/Web/API/Server-sent_events', costText: 'Free', costValue: 1, latencyText: '~20ms push', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'monolith'] },
      { id: 'ably', name: 'Ably / Pusher / PubNub', description: 'Managed real-time messaging platforms.', pros: 'Global scale, zero ops', cons: 'Per-message pricing', url: 'https://ably.com/', costText: 'Per message $$', costValue: 4, latencyText: '~50ms push', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'serverless', 'hyperscale'] },
      { id: 'supabase_rt', name: 'Supabase / Firebase Realtime', description: 'Database-change subscriptions pushed to clients.', pros: 'Realtime from DB changes, minimal code', cons: 'Tied to that platform', url: 'https://supabase.com/realtime', costText: '$ → $$', costValue: 2, latencyText: '~50ms push', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'serverless'] },
    ],
  },
  notifications: {
    title: 'Notifications (Email / SMS / Push)',
    layer: 'Integrations',
    concept: 'Outbound communication channels. Always send asynchronously via the queue, respect user preferences and rate limits, and track delivery status via webhooks.',
    decisionTips: ['Separate transactional and marketing email domains.', 'Use a notification orchestrator when channels multiply.'],
    options: [
      { id: 'sendgrid', name: 'Twilio + SendGrid', description: 'SMS/voice (Twilio) and email (SendGrid) APIs.', pros: 'Reliable, global reach', cons: 'Costs grow with volume', url: 'https://www.twilio.com/', costText: 'Per message', costValue: 3, latencyText: 'Async', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth', 'monolith'] },
      { id: 'ses', name: 'AWS SES + SNS / Pinpoint', description: 'Low-cost AWS email and SMS/push.', pros: 'Cheapest at scale', cons: 'More setup, deliverability tuning', url: 'https://aws.amazon.com/ses/', costText: '$0.10 / 1K emails', costValue: 1, latencyText: 'Async', latencyMs: 0, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'serverless'] },
      { id: 'fcm', name: 'Firebase Cloud Messaging / APNs', description: 'Mobile & web push notifications.', pros: 'Free push delivery', cons: 'Push only', url: 'https://firebase.google.com/docs/cloud-messaging', costText: 'Free', costValue: 0, latencyText: 'Async', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth', 'hyperscale'] },
      { id: 'novu', name: 'Novu / Knock (Orchestrator)', description: 'Multi-channel notification infrastructure with preferences & digests.', pros: 'One API for all channels', cons: 'Another dependency', url: 'https://novu.co/', costText: 'OSS / $$', costValue: 3, latencyText: 'Async', latencyMs: 0, complexity: 'Medium', bestFor: ['growth', 'microservices'] },
    ],
  },
  payments: {
    title: 'Payments',
    layer: 'Integrations',
    concept: 'Never store raw card data — use a PCI-compliant provider with tokenization. Handle payment webhooks idempotently and keep an internal, strongly consistent ledger.',
    decisionTips: ['Use idempotency keys on every charge request.', 'Reconcile provider webhooks against your ledger.'],
    options: [
      { id: 'stripe', name: 'Stripe', description: 'Developer-first payments, billing and subscriptions.', pros: 'Best DX, subscriptions, global', cons: '~2.9% + 30¢ fees', url: 'https://stripe.com/', costText: '% per txn', costValue: 3, latencyText: '~300ms', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth', 'monolith', 'serverless', 'microservices'] },
      { id: 'adyen', name: 'Adyen', description: 'Enterprise acquirer with global local payment methods.', pros: 'Lower fees at volume, global methods', cons: 'Enterprise onboarding', url: 'https://www.adyen.com/', costText: 'Interchange++', costValue: 4, latencyText: '~300ms', latencyMs: 0, complexity: 'Medium', bestFor: ['hyperscale'] },
      { id: 'paypal', name: 'PayPal / Braintree', description: 'Wallet payments with broad consumer trust.', pros: 'Consumer trust, wallet', cons: 'Dispute handling, UX', url: 'https://www.braintreepayments.com/', costText: '% per txn', costValue: 3, latencyText: '~400ms', latencyMs: 0, complexity: 'Medium', bestFor: ['growth'] },
      { id: 'razorpay', name: 'Razorpay / Regional (UPI)', description: 'Regional gateways supporting UPI, netbanking, wallets.', pros: 'Local payment methods (India)', cons: 'Regional focus', url: 'https://razorpay.com/', costText: '% per txn', costValue: 2, latencyText: '~300ms', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth'] },
    ],
  },
  analytics: {
    title: 'Analytics & Data Warehouse',
    layer: 'Data Platform',
    concept: 'OLTP (your primary DB) serves the app; OLAP (a warehouse) serves analytics. Data flows via ELT / CDC into a columnar store so heavy reporting never touches production.',
    decisionTips: ['Never run heavy analytics on the production DB.', 'Real-time user-facing analytics → ClickHouse / Pinot.'],
    options: [
      { id: 'bigquery', name: 'Google BigQuery', description: 'Serverless warehouse billed by data scanned.', pros: 'Zero ops, massive scale', cons: 'Cost surprises on bad queries', url: 'https://cloud.google.com/bigquery', costText: 'Per TB scanned', costValue: 4, latencyText: 'Seconds', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth', 'serverless'] },
      { id: 'snowflake', name: 'Snowflake', description: 'Multi-cloud warehouse with separated storage/compute.', pros: 'Easy scaling, data sharing', cons: 'Credit costs add up', url: 'https://www.snowflake.com/', costText: 'Credits $$$', costValue: 6, latencyText: 'Seconds', latencyMs: 0, complexity: 'Low', bestFor: ['growth', 'hyperscale'] },
      { id: 'clickhouse', name: 'ClickHouse', description: 'Blazing fast open-source columnar OLAP DB.', pros: 'Sub-second analytics, cheap', cons: 'Updates/joins are limited', url: 'https://clickhouse.com/', costText: 'OSS / Cloud $$', costValue: 3, latencyText: 'Sub-second', latencyMs: 0, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'databricks', name: 'Databricks (Lakehouse)', description: 'Spark-based lakehouse for data engineering and ML.', pros: 'Unified data + ML', cons: 'Complex, expensive', url: 'https://www.databricks.com/', costText: 'DBUs $$$$', costValue: 7, latencyText: 'Seconds', latencyMs: 0, complexity: 'High', bestFor: ['hyperscale'] },
      { id: 'posthog', name: 'PostHog / Mixpanel (Product Analytics)', description: 'Event-based product analytics without a warehouse.', pros: 'Instant funnels, no data team', cons: 'Not a general warehouse', url: 'https://posthog.com/', costText: 'Free tier → $$', costValue: 2, latencyText: 'Seconds', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'monolith'] },
    ],
  },
  observability: {
    title: 'Observability (Logs / Metrics / Traces)',
    layer: 'Operations',
    concept: 'The three pillars: logs (what happened), metrics (how much / how fast), traces (where time went across services). Instrument with OpenTelemetry so you can switch backends. Define SLOs and alert on symptoms, not causes.',
    decisionTips: ['Instrument with OpenTelemetry from day one.', 'Distributed tracing is mandatory for microservices.', 'Sample traces and control log volume to manage cost.'],
    options: [
      { id: 'datadog', name: 'Datadog', description: 'All-in-one SaaS for APM, logs, metrics, RUM.', pros: 'Everything in one place', cons: 'Very expensive at scale', url: 'https://www.datadoghq.com/', costText: 'Per host + GB $$$$', costValue: 7, latencyText: 'Async', latencyMs: 0, complexity: 'Low', bestFor: ['growth', 'hyperscale', 'microservices'] },
      { id: 'grafana', name: 'Grafana Stack (Prometheus / Loki / Tempo)', description: 'Open-source observability stack; Grafana Cloud option.', pros: 'OSS, flexible, cost-efficient', cons: 'More to assemble & run', url: 'https://grafana.com/', costText: 'OSS / Cloud $$', costValue: 3, latencyText: 'Async', latencyMs: 0, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'microservices', 'monolith'] },
      { id: 'otel_jaeger', name: 'OpenTelemetry + Jaeger + ELK', description: 'Vendor-neutral instrumentation with self-hosted backends.', pros: 'No lock-in', cons: 'Significant operations', url: 'https://opentelemetry.io/', costText: 'Free (ops)', costValue: 3, latencyText: 'Async', latencyMs: 0, complexity: 'High', bestFor: ['hyperscale', 'microservices'] },
      { id: 'sentry', name: 'Sentry + Cloud-native (CloudWatch)', description: 'Error tracking plus your cloud\'s built-in monitoring.', pros: 'Cheap, fast to start', cons: 'Fragmented views', url: 'https://sentry.io/', costText: 'Free tier → $', costValue: 1, latencyText: 'Async', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'serverless', 'monolith'] },
      { id: 'newrelic', name: 'New Relic / Honeycomb', description: 'APM and high-cardinality event-based observability.', pros: 'Powerful querying, generous free tier', cons: 'Pricing model complexity', url: 'https://www.honeycomb.io/', costText: 'Per GB/user $$', costValue: 4, latencyText: 'Async', latencyMs: 0, complexity: 'Low', bestFor: ['growth'] },
    ],
  },
  cicd: {
    title: 'CI/CD Pipeline',
    layer: 'DevOps',
    concept: 'Continuous Integration builds and tests every commit; Continuous Delivery deploys safely using blue-green, canary or rolling strategies. GitOps makes Git the source of truth for what runs in production.',
    decisionTips: ['Keep pipelines under ~10 minutes.', 'Use canary / feature flags for risky releases.', 'Kubernetes → GitOps (ArgoCD / Flux).'],
    options: [
      { id: 'gha', name: 'GitHub Actions', description: 'CI/CD built into GitHub with a huge action marketplace.', pros: 'Zero setup, integrated', cons: 'Minutes cost for private repos', url: 'https://github.com/features/actions', costText: 'Free tier → $', costValue: 1, latencyText: '—', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'growth', 'monolith', 'serverless', 'microservices'] },
      { id: 'gitlab', name: 'GitLab CI', description: 'Integrated DevSecOps platform, self-hostable.', pros: 'All-in-one, self-hosted option', cons: 'Heavier platform', url: 'https://docs.gitlab.com/ee/ci/', costText: 'Free → $$', costValue: 2, latencyText: '—', latencyMs: 0, complexity: 'Medium', bestFor: ['growth', 'hyperscale'] },
      { id: 'argocd', name: 'ArgoCD / Flux (GitOps)', description: 'Kubernetes controllers syncing cluster state from Git.', pros: 'Declarative, auditable, drift correction', cons: 'Kubernetes only', url: 'https://argo-cd.readthedocs.io/', costText: 'Free (ops)', costValue: 2, latencyText: '—', latencyMs: 0, complexity: 'Medium', bestFor: ['hyperscale', 'microservices'] },
      { id: 'jenkins', name: 'Jenkins', description: 'Self-hosted, plugin-driven automation server.', pros: 'Infinitely customizable', cons: 'Plugin hell, maintenance burden', url: 'https://www.jenkins.io/', costText: 'Free (ops)', costValue: 3, latencyText: '—', latencyMs: 0, complexity: 'High', bestFor: ['monolith'] },
      { id: 'circleci', name: 'CircleCI / Buildkite', description: 'Fast hosted CI; Buildkite uses your own runners.', pros: 'Fast, scalable parallelism', cons: 'Another vendor', url: 'https://buildkite.com/', costText: '$$', costValue: 3, latencyText: '—', latencyMs: 0, complexity: 'Low', bestFor: ['growth', 'hyperscale'] },
    ],
  },
  iac: {
    title: 'Infrastructure as Code',
    layer: 'DevOps',
    concept: 'Define infrastructure in versioned code so environments are reproducible, reviewable and recoverable. Avoid click-ops in production.',
    decisionTips: ['Keep state remote and locked.', 'Separate modules per environment.', 'Policy-as-code (OPA) for guardrails.'],
    options: [
      { id: 'terraform', name: 'Terraform / OpenTofu', description: 'Declarative, multi-cloud IaC with a vast provider registry.', pros: 'Multi-cloud standard', cons: 'HCL limits, state management', url: 'https://opentofu.org/', costText: 'Free', costValue: 1, latencyText: '—', latencyMs: 0, complexity: 'Medium', bestFor: ['growth', 'hyperscale', 'microservices', 'monolith'] },
      { id: 'pulumi', name: 'Pulumi', description: 'IaC in real programming languages (TS, Python, Go).', pros: 'Loops, types, testing in code', cons: 'Smaller community', url: 'https://www.pulumi.com/', costText: 'Free → $$', costValue: 2, latencyText: '—', latencyMs: 0, complexity: 'Medium', bestFor: ['startup', 'growth'] },
      { id: 'cdk', name: 'AWS CDK / SST / Serverless Framework', description: 'High-level constructs for AWS & serverless apps.', pros: 'Great for serverless on AWS', cons: 'AWS only', url: 'https://sst.dev/', costText: 'Free', costValue: 1, latencyText: '—', latencyMs: 0, complexity: 'Low', bestFor: ['startup', 'serverless'] },
      { id: 'ansible', name: 'Ansible', description: 'Agentless configuration management for servers.', pros: 'Great for VM configuration', cons: 'Not ideal for cloud provisioning', url: 'https://www.ansible.com/', costText: 'Free', costValue: 1, latencyText: '—', latencyMs: 0, complexity: 'Low', bestFor: ['monolith'] },
    ],
  },
};

const MODULES: { key: ModuleKey; label: string; hint: string }[] = [
  { key: 'cdn', label: 'CDN & Edge Caching', hint: 'Static assets near users' },
  { key: 'waf', label: 'WAF & DDoS Protection', hint: 'Block attacks at the edge' },
  { key: 'auth', label: 'Identity & Auth', hint: 'Login, SSO, RBAC' },
  { key: 'cache', label: 'Caching Layer', hint: 'Reduce DB load & latency' },
  { key: 'search', label: 'Full-text Search', hint: 'Relevance, facets, typo tolerance' },
  { key: 'objectStorage', label: 'Object / File Storage', hint: 'Images, video, documents' },
  { key: 'queue', label: 'Async Queue + Workers', hint: 'Event-driven background jobs' },
  { key: 'realtime', label: 'Real-time Updates', hint: 'Chat, live feeds' },
  { key: 'notifications', label: 'Notifications', hint: 'Email, SMS, push' },
  { key: 'payments', label: 'Payments', hint: 'Checkout, subscriptions' },
  { key: 'analytics', label: 'Analytics / Warehouse', hint: 'OLAP reporting' },
  { key: 'observability', label: 'Observability', hint: 'Logs, metrics, traces' },
  { key: 'devops', label: 'CI/CD + IaC', hint: 'Automated delivery' },
  { key: 'mesh', label: 'Service Mesh', hint: 'Microservices only' },
];

type Preset = { id: string; name: string; emoji: string; scale: Scale; style: Style; web: boolean; mobile: boolean; modules: ModuleKey[] };

const PRESETS: Preset[] = [
  { id: 'ecommerce', name: 'E-commerce', emoji: '🛒', scale: 'growth', style: 'microservices', web: true, mobile: true, modules: ['cdn', 'waf', 'auth', 'cache', 'search', 'objectStorage', 'queue', 'notifications', 'payments', 'analytics', 'observability', 'devops'] },
  { id: 'saas', name: 'B2B SaaS', emoji: '💼', scale: 'startup', style: 'monolith', web: true, mobile: false, modules: ['cdn', 'auth', 'cache', 'queue', 'notifications', 'payments', 'observability', 'devops'] },
  { id: 'chat', name: 'Chat / Social', emoji: '💬', scale: 'hyperscale', style: 'microservices', web: true, mobile: true, modules: ['cdn', 'waf', 'auth', 'cache', 'search', 'objectStorage', 'queue', 'realtime', 'notifications', 'analytics', 'observability', 'devops', 'mesh'] },
  { id: 'streaming', name: 'Media Streaming', emoji: '🎬', scale: 'hyperscale', style: 'microservices', web: true, mobile: true, modules: ['cdn', 'waf', 'auth', 'cache', 'search', 'objectStorage', 'queue', 'payments', 'analytics', 'observability', 'devops', 'mesh'] },
  { id: 'fintech', name: 'Fintech', emoji: '🏦', scale: 'growth', style: 'microservices', web: true, mobile: true, modules: ['waf', 'auth', 'cache', 'queue', 'notifications', 'payments', 'analytics', 'observability', 'devops'] },
  { id: 'mvp', name: 'Serverless MVP', emoji: '🚀', scale: 'startup', style: 'serverless', web: true, mobile: false, modules: ['cdn', 'auth', 'objectStorage', 'queue', 'observability', 'devops'] },
];

const LAYER_STYLES: Record<string, string> = {
  Client: 'bg-sky-50 border-sky-400',
  Edge: 'bg-orange-50 border-orange-400',
  Entry: 'bg-blue-100 border-blue-500 font-bold',
  Security: 'bg-red-50 border-red-400',
  Application: 'bg-indigo-100 border-indigo-500 font-bold',
  Infrastructure: 'bg-slate-200 border-slate-500',
  Data: 'bg-emerald-50 border-emerald-500',
  Async: 'bg-amber-50 border-amber-500',
  Integrations: 'bg-fuchsia-50 border-fuchsia-400',
  'Data Platform': 'bg-violet-50 border-violet-500',
  Operations: 'bg-teal-50 border-teal-500',
  DevOps: 'bg-gray-100 border-gray-400',
};

const complexityScore: Record<Complexity, number> = { Low: 1, Medium: 2, High: 3 };

const fitScore = (opt: TechOption, scale: Scale, style: Style) =>
  (opt.bestFor.includes(scale) ? 2 : 0) + (opt.bestFor.includes(style) ? 1 : 0);

const bestOption = (cat: string, scale: Scale, style: Style) =>
  catalog[cat].options.reduce((best, o) => (fitScore(o, scale, style) > fitScore(best, scale, style) ? o : best), catalog[cat].options[0]);

const pickAllBest = (scale: Scale, style: Style) => {
  const picks: Record<string, string> = {};
  Object.keys(catalog).forEach(cat => { picks[cat] = bestOption(cat, scale, style).id; });
  return picks;
};

interface Advice { level: 'warn' | 'info'; text: string; fix?: { label: string; apply: () => void } }

export default function SoftwareSystemArchitect() {
  const [scale, setScale] = useState<Scale>('startup');
  const [style, setStyle] = useState<Style>('monolith');
  const [hasWeb, setHasWeb] = useState(true);
  const [hasMobile, setHasMobile] = useState(false);
  const [modules, setModules] = useState<Set<ModuleKey>>(new Set(['cdn', 'auth', 'cache', 'queue', 'observability', 'devops']));
  const [selectedTech, setSelectedTech] = useState<Record<string, string>>(() => pickAllBest('startup', 'monolith'));
  const [autoAdapt, setAutoAdapt] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);


  const toggleModule = (m: ModuleKey) => {
    setModules(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  };

  // When auto-adapt is on, changing scale/style re-picks the best-fit tech for every component
  const applyShape = (nextScale: Scale, nextStyle: Style) => {
    setScale(nextScale);
    setStyle(nextStyle);
    if (autoAdapt) setSelectedTech(pickAllBest(nextScale, nextStyle));
  };

  const applyPreset = (p: Preset) => {
    setHasWeb(p.web);
    setHasMobile(p.mobile);
    setModules(new Set(p.modules));
    setScale(p.scale);
    setStyle(p.style);
    setSelectedTech(pickAllBest(p.scale, p.style));
  };

  const selectTech = (cat: string, id: string) => setSelectedTech(prev => ({ ...prev, [cat]: id }));
  const techFor = (cat: string) => catalog[cat].options.find(o => o.id === selectedTech[cat]) || catalog[cat].options[0];

  const { nodes, edges, metrics, activeCategories } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const activeCats = new Set<string>();
    let edgeId = 0;
    const tech = (cat: string) => catalog[cat].options.find(o => o.id === selectedTech[cat]) || catalog[cat].options[0];

    const addEdge = (source: string, target: string, label?: string, dashed = false) => {
      newEdges.push({
        id: `e${edgeId++}`, source, target, label, type: 'smoothstep', animated: !dashed,
        style: dashed ? { strokeDasharray: '6 4', stroke: '#94a3b8' } : undefined,
      });
    };
    const addNode = (id: string, x: number, y: number, label: string, cat: string) => {
      activeCats.add(cat);
      const layer = catalog[cat].layer;
      newNodes.push({
        id, position: { x, y },
        data: { label, category: cat, techName: tech(cat).name },
        className: `${LAYER_STYLES[layer]} border-2 p-2 rounded w-44 text-sm text-center cursor-pointer hover:ring-4 hover:ring-indigo-300 transition-all shadow-sm`,
      });
    };

    const X = { client: 0, edge: 260, entry: 520, api: 780, svc: 1040, data: 1340, async: 1620, worker: 1880, sink: 2140 };

    // 1. Clients
    const clients: string[] = [];
    if (hasWeb) { addNode('web_client', X.client, 180, '🖥️ Web App', 'web_client'); clients.push('web_client'); }
    if (hasMobile) { addNode('mobile_client', X.client, 380, '📱 Mobile App', 'mobile_client'); clients.push('mobile_client'); }

    // 2. Edge
    let edgeTargets = clients;
    if (modules.has('cdn')) {
      addNode('cdn', X.edge, 160, 'CDN', 'cdn');
      clients.forEach(c => addEdge(c, 'cdn', c === 'web_client' ? 'HTTPS' : undefined));
      edgeTargets = ['cdn'];
    }
    if (modules.has('waf')) {
      addNode('waf', X.edge, 360, 'WAF / Rate Limit', 'waf');
      edgeTargets.forEach(s => addEdge(s, 'waf'));
      if (modules.has('cdn')) clients.filter(c => c === 'mobile_client').forEach(c => addEdge(c, 'waf', 'API'));
      edgeTargets = ['waf'];
    }

    // 3. Entry
    addNode('gateway', X.entry, 280, style === 'monolith' ? 'Load Balancer' : 'API Gateway', 'gateway');
    edgeTargets.forEach(s => addEdge(s, 'gateway'));
    addNode('api_style', X.api, 280, 'API Contract', 'api_style');
    addEdge('gateway', 'api_style');

    if (modules.has('auth')) {
      addNode('auth', X.entry, 60, '🔐 Identity & Auth', 'auth');
      addEdge('gateway', 'auth', 'Verify token');
    }

    // 4. Application tier
    let services: string[];
    if (style === 'monolith') {
      addNode('svc_mono', X.svc, 280, 'Modular Monolith', 'backend');
      services = ['svc_mono'];
    } else if (style === 'microservices') {
      addNode('svc_user', X.svc, 130, 'User Service', 'backend');
      addNode('svc_core', X.svc, 280, 'Core Domain Service', 'backend');
      addNode('svc_order', X.svc, 430, 'Order / Txn Service', 'backend');
      services = ['svc_user', 'svc_core', 'svc_order'];
      if (modules.has('mesh')) {
        addNode('mesh', X.svc, -40, 'Service Mesh (mTLS)', 'mesh');
        services.forEach(s => addEdge('mesh', s, undefined, true));
      }
    } else {
      addNode('svc_fn_api', X.svc, 200, 'λ API Functions', 'backend');
      addNode('svc_fn_event', X.svc, 380, 'λ Event Functions', 'backend');
      services = ['svc_fn_api', 'svc_fn_event'];
    }
    services.forEach(s => addEdge('api_style', s, style === 'microservices' ? 'Route' : undefined));

    const computeY = style === 'microservices' ? 590 : 540;
    addNode('compute', X.svc, computeY, 'Runs On', 'compute');
    services.forEach(s => addEdge(s, 'compute', undefined, true));

    if (modules.has('realtime')) {
      addNode('realtime', X.api, 80, '⚡ Real-time Channel', 'realtime');
      addEdge('gateway', 'realtime', 'Upgrade');
      addEdge(services[0], 'realtime', 'Publish');
    }

    // 5. Data tier
    addNode('primary_db', X.data, 280, '🗄️ Primary Database', 'primary_db');
    services.forEach(s => addEdge(s, 'primary_db'));
    if (modules.has('cache')) {
      addNode('cache', X.data, 120, 'Cache', 'cache');
      services.forEach(s => addEdge(s, 'cache', s === services[0] ? 'Cache-aside' : undefined));
    }
    if (modules.has('search')) {
      addNode('search', X.data, 440, 'Search Index', 'search');
      addEdge(services[0], 'search', 'Query');
      addEdge('primary_db', 'search', 'CDC sync', true);
    }
    if (modules.has('objectStorage')) {
      addNode('object_storage', X.data, 600, 'Object Storage', 'object_storage');
      addEdge(services[services.length - 1], 'object_storage', 'Pre-signed URL');
      if (modules.has('cdn')) addEdge('object_storage', 'cdn', 'Origin', true);
    }

    // 6. Async tier
    let asyncSource = services[services.length - 1];
    if (modules.has('queue')) {
      addNode('queue', X.async, 280, '📨 Event Bus / Queue', 'queue');
      services.forEach(s => addEdge(s, 'queue', s === services[0] ? 'Publish events' : undefined));
      addNode('workers', X.worker, 280, 'Workers / Workflows', 'workers');
      addEdge('queue', 'workers', 'Consume');
      asyncSource = 'workers';
    }
    if (modules.has('notifications')) {
      addNode('notifications', X.sink, 140, '🔔 Notifications', 'notifications');
      addEdge(asyncSource, 'notifications');
    }
    if (modules.has('payments')) {
      addNode('payments', X.async, 60, '💳 Payments', 'payments');
      addEdge(services[services.length - 1], 'payments', 'Charge (idempotent)');
      addEdge('payments', services[services.length - 1], 'Webhook', true);
    }
    if (modules.has('analytics')) {
      addNode('analytics', X.sink, 420, '📊 Data Warehouse', 'analytics');
      addEdge('primary_db', 'analytics', 'ELT / CDC', true);
      if (modules.has('queue')) addEdge('queue', 'analytics', 'Event stream', true);
    }

    // 7. Operations lane
    if (modules.has('observability')) {
      addNode('observability', X.data, 780, '🔭 Observability', 'observability');
      services.forEach(s => addEdge(s, 'observability', s === services[0] ? 'Telemetry' : undefined, true));
    }
    if (modules.has('devops')) {
      addNode('cicd', X.entry, 700, 'CI/CD', 'cicd');
      addNode('iac', X.api, 780, 'Infra as Code', 'iac');
      addEdge('cicd', 'compute', 'Deploy', true);
      addEdge('iac', 'compute', 'Provision', true);
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

    // Metrics: synchronous request path, with a 70% cache-hit assumption on DB reads
    const cacheHit = activeCats.has('cache') ? 0.7 : 0;
    const pathCats = ['cdn', 'waf', 'gateway', 'api_style', 'mesh', 'backend', 'compute'];
    let latency = pathCats.filter(c => activeCats.has(c)).reduce((sum, c) => sum + tech(c).latencyMs, 0);
    if (activeCats.has('mesh')) latency += tech('mesh').latencyMs; // two hops between services
    latency += Math.round(tech('primary_db').latencyMs * (1 - cacheHit));
    if (activeCats.has('cache')) latency += tech('cache').latencyMs;

    const scaleMultiplier = { startup: 1, growth: 1.5, hyperscale: 2.5 }[scale];
    let costScore = 0;
    let complexity = 0;
    activeCats.forEach(c => {
      costScore += tech(c).costValue;
      complexity += complexityScore[tech(c).complexity];
    });
    costScore = Math.round(costScore * scaleMultiplier);

    return {
      nodes: newNodes,
      edges: newEdges,
      metrics: { latency, costScore, opsScore: Math.round((complexity / activeCats.size) * 33), numNodes: newNodes.length },
      activeCategories: activeCats,
    };
  }, [scale, style, hasWeb, hasMobile, modules, selectedTech]);

  const costLabel = metrics.costScore < 40 ? 'Low ($)' : metrics.costScore < 80 ? 'Medium ($$)' : metrics.costScore < 130 ? 'High ($$$)' : 'Very High ($$$$)';
  const opsLabel = metrics.opsScore < 50 ? 'Lean' : metrics.opsScore < 70 ? 'Moderate' : 'Platform team needed';

  // Architecture advisor: rules that react to the current design
  const advice: Advice[] = (() => {
    const list: Advice[] = [];
    const t = (c: string) => selectedTech[c];
    if (style === 'microservices' && scale === 'startup') list.push({ level: 'warn', text: 'Microservices at startup scale add network, deployment and data-consistency overhead. A modular monolith is usually faster to ship.', fix: { label: 'Switch to monolith', apply: () => applyShape('startup', 'monolith') } });
    if (style === 'monolith' && scale === 'hyperscale') list.push({ level: 'info', text: 'At hyperscale, plan to extract hot domains (strangler-fig pattern) into independently scalable services.' });
    if (style === 'serverless' && t('compute') !== 'lambda') list.push({ level: 'warn', text: `Style is serverless but compute is "${techFor('compute').name}".`, fix: { label: 'Use Functions', apply: () => selectTech('compute', 'lambda') } });
    if (style !== 'serverless' && t('compute') === 'lambda') list.push({ level: 'info', text: 'Functions chosen as compute for a non-serverless style — watch cold starts and execution time limits.' });
    if (style === 'microservices' && modules.has('mesh') && scale === 'startup') list.push({ level: 'warn', text: 'A service mesh is heavy for a small team. Consider client-side resilience libraries first.', fix: { label: 'Remove mesh', apply: () => toggleModule('mesh') } });
    if (style !== 'microservices' && modules.has('mesh')) list.push({ level: 'info', text: 'Service mesh only applies to microservices; it is hidden in this style.' });
    if (modules.has('queue') && t('queue') === 'kafka' && scale === 'startup') list.push({ level: 'warn', text: 'Kafka is operationally heavy for a startup. Managed queues or Redis Streams usually suffice.', fix: { label: 'Use SQS', apply: () => selectTech('queue', 'sqs') } });
    if (modules.has('payments') && ['dynamodb', 'cassandra'].includes(t('primary_db'))) list.push({ level: 'warn', text: 'Payments need a strongly consistent ledger. Eventual-consistency stores are risky for money movement.', fix: { label: 'Use PostgreSQL', apply: () => selectTech('primary_db', 'postgres') } });
    if (modules.has('auth') && t('auth') === 'custom_auth') list.push({ level: 'warn', text: 'Custom auth makes you responsible for password hashing, MFA, session revocation and SSO.' });
    if (!modules.has('auth')) list.push({ level: 'warn', text: 'No identity layer — almost every production system needs authentication.', fix: { label: 'Add Auth', apply: () => toggleModule('auth') } });
    if (!modules.has('observability') && scale !== 'startup') list.push({ level: 'warn', text: 'Running at scale without observability means debugging blind.', fix: { label: 'Add Observability', apply: () => toggleModule('observability') } });
    if (style === 'microservices' && modules.has('observability') && t('observability') === 'sentry') list.push({ level: 'info', text: 'Microservices need distributed tracing — consider an OpenTelemetry-based backend.' });
    if (!modules.has('cache') && scale === 'hyperscale') list.push({ level: 'warn', text: 'Hyperscale read traffic without a cache will overload the primary database.', fix: { label: 'Add Cache', apply: () => toggleModule('cache') } });
    if (modules.has('cache') && t('cache') === 'inproc' && style !== 'monolith') list.push({ level: 'info', text: 'In-process caches are not shared across instances — expect inconsistent reads.' });
    if (modules.has('search') && t('search') === 'pgfts' && scale === 'hyperscale') list.push({ level: 'info', text: 'Postgres full-text search puts query load on your primary DB; a dedicated engine scales better.' });
    if (hasWeb && !modules.has('cdn') && scale !== 'startup') list.push({ level: 'info', text: 'Serving static assets without a CDN increases latency for distant users.', fix: { label: 'Add CDN', apply: () => toggleModule('cdn') } });
    if (modules.has('realtime') && style === 'serverless' && t('realtime') === 'websocket') list.push({ level: 'warn', text: 'Self-hosted WebSockets don\'t fit functions well — use a managed real-time service.', fix: { label: 'Use Ably', apply: () => selectTech('realtime', 'ably') } });
    if (t('compute') === 'k8s' && scale === 'startup') list.push({ level: 'warn', text: 'Kubernetes needs a dedicated platform team; managed containers are simpler at this stage.', fix: { label: 'Use Cloud Run / ECS', apply: () => selectTech('compute', 'ecs') } });
    if (list.length === 0) list.push({ level: 'info', text: 'No conflicts detected — the design is consistent with its scale and style.' });
    return list;
  })();

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    if (node.data?.category) {
      setSelectedCategory(node.data.category as string);
      setExpandedItem(null);
    }
  }, []);

  const handleExport = () => {
    const doc = new jsPDF();
    let y = 20;
    const newPageIfNeeded = (space = 30) => { if (y > 280 - space) { doc.addPage(); y = 20; } };

    doc.setFontSize(18);
    doc.setTextColor(63, 81, 181);
    doc.text('Software System Architecture Blueprint', 20, y); y += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Style: ${style} | Scale: ${scale} | Clients: ${[hasWeb && 'Web', hasMobile && 'Mobile'].filter(Boolean).join(', ') || 'None'}`, 20, y); y += 12;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Estimates', 20, y); y += 8;
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`- Request path latency (p50, indicative): ~${metrics.latency} ms`, 20, y); y += 6;
    doc.text(`- Cost profile: ${costLabel} (score ${metrics.costScore})`, 20, y); y += 6;
    doc.text(`- Operational load: ${opsLabel}`, 20, y); y += 12;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Architecture Decision Records', 20, y); y += 10;

    Array.from(activeCategories).forEach(cat => {
      newPageIfNeeded(45);
      const c = catalog[cat];
      const chosen = techFor(cat);
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 150);
      doc.text(`[${c.layer}] ${c.title}`, 20, y); y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Decision: ${chosen.name}`, 20, y); y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = [
        ...doc.splitTextToSize(`Why: ${chosen.description} Pros: ${chosen.pros}.`, 170),
        ...doc.splitTextToSize(`Trade-off: ${chosen.cons}. Cost: ${chosen.costText}. Complexity: ${chosen.complexity}.`, 170),
        ...doc.splitTextToSize(`Alternatives considered: ${c.options.filter(o => o.id !== chosen.id).map(o => o.name).join('; ')}`, 170),
      ];
      doc.text(lines, 20, y);
      y += lines.length * 5 + 6;
    });

    newPageIfNeeded(40);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Advisor Notes', 20, y); y += 8;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    advice.forEach(a => {
      newPageIfNeeded(15);
      const lines = doc.splitTextToSize(`${a.level === 'warn' ? '[!]' : '[i]'} ${a.text}`, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 2;
    });

    doc.save('software-system-blueprint.pdf');
  };

  const OptionCard = ({ item, cat }: { item: TechOption; cat: string }) => {
    const isSelected = selectedTech[cat] === item.id;
    const isExpanded = expandedItem === item.id;
    const isRecommended = bestOption(cat, scale, style).id === item.id;
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
            <p className="text-xs text-emerald-700 flex gap-1 mb-1"><ThumbsUp className="w-3 h-3 mt-0.5 shrink-0" /> {item.pros}</p>
            <p className="text-xs text-rose-700 flex gap-1 mb-2"><ThumbsDown className="w-3 h-3 mt-0.5 shrink-0" /> {item.cons}</p>
            <p className="text-[10px] text-slate-500 mb-3">Best for: {item.bestFor.join(', ')}</p>
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

  const segBtn = (active: boolean) => `flex-1 py-1 text-[11px] font-bold rounded transition-colors ${active ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`;
  const checkRow = 'flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors bg-white border border-slate-200 shadow-sm';

  return (
    <div className="w-full h-full flex flex-col xl:flex-row bg-slate-50 overflow-hidden">
      {/* Controls Panel */}
      <div className="w-full xl:w-[24rem] h-full shrink-0 flex flex-col gap-2 p-3 bg-white border-r border-slate-200 z-20 shadow-lg overflow-y-auto custom-scrollbar">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-sm shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">System Analytics</h4>
            <button onClick={handleExport} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm">
              <Download className="w-3 h-3" /> EXPORT ADR
            </button>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 flex items-center gap-2" title="Synchronous request path, assumes 70% cache hit ratio"><Clock className="w-3 h-3 text-slate-400" /> Request Latency</span>
            <span className="font-mono text-xs font-bold text-slate-900">~{metrics.latency} ms</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 flex items-center gap-2"><Calculator className="w-3 h-3 text-slate-400" /> Cost Profile</span>
            <span className="font-mono text-xs font-bold text-slate-900">{costLabel}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 flex items-center gap-2"><Cpu className="w-3 h-3 text-slate-400" /> Ops Load</span>
            <span className="font-mono text-xs font-bold text-slate-900">{opsLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 flex items-center gap-2"><Layers className="w-3 h-3 text-slate-400" /> Components</span>
            <span className="font-mono text-xs font-bold text-slate-900">{metrics.numNodes}</span>
          </div>
        </div>

        {/* Presets */}
        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">0</span>
            Start From a Template
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
            Clients
          </h4>
          <div className="flex gap-1">
            <label className={`${checkRow} flex-1`}>
              <input type="checkbox" checked={hasWeb} onChange={() => (hasMobile || !hasWeb) && setHasWeb(!hasWeb)} className="accent-indigo-600 w-3 h-3" />
              <span className="font-medium text-slate-700">Web</span>
            </label>
            <label className={`${checkRow} flex-1`}>
              <input type="checkbox" checked={hasMobile} onChange={() => (hasWeb || !hasMobile) && setHasMobile(!hasMobile)} className="accent-indigo-600 w-3 h-3" />
              <span className="font-medium text-slate-700">Mobile</span>
            </label>
          </div>
        </div>

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">2</span>
            Scale & Architecture Style
          </h4>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
              {(['startup', 'growth', 'hyperscale'] as Scale[]).map(s => (
                <button key={s} onClick={() => applyShape(s, style)} className={segBtn(scale === s)}>
                  {s === 'startup' ? 'Startup' : s === 'growth' ? 'Growth' : 'Hyperscale'}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
              {(['monolith', 'microservices', 'serverless'] as Style[]).map(s => (
                <button key={s} onClick={() => applyShape(scale, s)} className={segBtn(style === s)}>
                  {s === 'monolith' ? 'Monolith' : s === 'microservices' ? 'Microservices' : 'Serverless'}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer" title="Re-pick best-fit technologies whenever scale or style changes">
                <input type="checkbox" checked={autoAdapt} onChange={() => setAutoAdapt(!autoAdapt)} className="accent-indigo-600 w-3 h-3" />
                Auto-adapt tech on change
              </label>
              <button onClick={() => setSelectedTech(pickAllBest(scale, style))} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded hover:bg-amber-200 transition-colors">
                <Wand2 className="w-3 h-3" /> Best-fit stack
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">3</span>
            System Capabilities
          </h4>
          <div className="flex flex-col gap-1">
            {MODULES.map(m => {
              const disabled = m.key === 'mesh' && style !== 'microservices';
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

        {/* Advisor */}
        <div className="shrink-0 pb-2">
          <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">4</span>
            Architecture Advisor
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
      <div className="flex-1 h-full bg-slate-50 relative min-h-[600px]">
        <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur px-5 py-3 text-sm font-bold border border-slate-200 rounded-xl text-indigo-900 shadow-lg flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          Software System Blueprint — click any component to swap its technology
        </div>

        <ReactFlow key={`${style}-${hasWeb}-${hasMobile}`} nodes={nodes} edges={edges} onNodeClick={onNodeClick} fitView attributionPosition="bottom-right">
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {selectedCategory && catalog[selectedCategory] && (
          <div className={`absolute top-4 right-4 z-20 ${compareMode ? 'w-[40rem]' : 'w-[24rem]'} max-w-[95%] max-h-[95%] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl p-5 flex flex-col custom-scrollbar`}>
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-2 border-b border-slate-100 z-10">
              <div className="pr-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{catalog[selectedCategory].layer} layer</span>
                <h3 className="font-bold text-lg text-slate-900 leading-tight">{catalog[selectedCategory].title}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setCompareMode(!compareMode)} title="Compare alternatives" className={`rounded p-1 transition-colors ${compareMode ? 'bg-indigo-600 text-white' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'}`}>
                  <Table2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedCategory(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded p-1 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-4 bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1"><BookOpen className="w-4 h-4" /> Concept Explained</h4>
              <p className="text-sm text-indigo-900 leading-relaxed">{catalog[selectedCategory].concept}</p>
            </div>

            <div className="mb-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">How to Decide</h4>
              <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                {catalog[selectedCategory].decisionTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>

            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">
              {compareMode ? 'Compare Alternatives' : 'Select Technology'} <span className="text-slate-400 normal-case font-normal">— best fit for {scale} / {style}</span>
            </h4>

            {compareMode ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-left">
                      <th className="p-2">Option</th><th className="p-2">Pros</th><th className="p-2">Cons</th><th className="p-2">Cost</th><th className="p-2">Ops</th><th className="p-2">Fit</th><th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog[selectedCategory].options.map(o => {
                      const isSel = selectedTech[selectedCategory] === o.id;
                      const fit = fitScore(o, scale, style);
                      return (
                        <tr key={o.id} className={`border-b border-slate-100 align-top ${isSel ? 'bg-indigo-50' : ''}`}>
                          <td className="p-2 font-semibold text-slate-800">{o.name}</td>
                          <td className="p-2 text-emerald-700">{o.pros}</td>
                          <td className="p-2 text-rose-700">{o.cons}</td>
                          <td className="p-2 whitespace-nowrap">{o.costText}</td>
                          <td className="p-2">{o.complexity}</td>
                          <td className="p-2 whitespace-nowrap" title="2 pts for scale match, 1 pt for style match">{'★'.repeat(fit)}{'☆'.repeat(3 - fit)}</td>
                          <td className="p-2">
                            {isSel ? <CheckCircle className="w-4 h-4 text-indigo-600" /> : (
                              <button onClick={() => selectTech(selectedCategory, o.id)} className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-semibold hover:bg-indigo-700">Use</button>
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
                {catalog[selectedCategory].options.map(o => <OptionCard key={o.id} item={o} cat={selectedCategory} />)}
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
