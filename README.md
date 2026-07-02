# @shapeshift-labs/frontier-lang-parser

Parser for the first Frontier Lang `.frontier` syntax slice.


## Related Packages

The published Frontier package family is generated from one shared package catalog so READMEs stay in sync across packages:

- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier): Core JSON diff/apply, compact patch tuples, JSON Pointer, equality, clone, validation, Unicode helpers, and tiny dependency-free runtime budget/scheduler primitives.
- [`@shapeshift-labs/frontier-query`](https://www.npmjs.com/package/@shapeshift-labs/frontier-query): Shared query-key, selector path, condition, entity identity, and table-shape primitives.
- [`@shapeshift-labs/frontier-codec`](https://www.npmjs.com/package/@shapeshift-labs/frontier-codec): Patch serialization, binary frames, canonical JSON, and patch-history codecs.
- [`@shapeshift-labs/frontier-engine`](https://www.npmjs.com/package/@shapeshift-labs/frontier-engine): Stateful planned diff engine, adaptive profiles, schema plans, and engine-level history helpers.
- [`@shapeshift-labs/frontier-state`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state): Patch-routed app-state subscriptions, owned commits, maintained views, and path mapping.
- [`@shapeshift-labs/frontier-dataflow`](https://www.npmjs.com/package/@shapeshift-labs/frontier-dataflow): Serializable incremental dataflow and materialized-view graphs for Frontier apps, including selectors, dependency DAGs, filters, joins, aggregations, stale paths, recompute budgets, output patches, provenance records, and proof of why derived views changed.
- [`@shapeshift-labs/frontier-state-cache`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache): Normalized query-result cache with entity/query watchers, persistence, change logs, optimistic layers, scheduled persistence, and mutation bridge.
- [`@shapeshift-labs/frontier-state-cache-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-idb): IndexedDB persistence adapter for Frontier state-cache snapshots and durable change logs.
- [`@shapeshift-labs/frontier-state-cache-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-file): Structured file persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-state-cache-sql`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-sql): SQL persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-schema`](https://www.npmjs.com/package/@shapeshift-labs/frontier-schema): JSON Schema validation, Frontier profile generation, CloudEvent envelopes, and query/table schema helpers.
- [`@shapeshift-labs/frontier-migrations`](https://www.npmjs.com/package/@shapeshift-labs/frontier-migrations): Boundary-first data migrations, import normalization, plugin/API version mapping, versioned envelopes, graph diagnostics, patch path rewrites, dry-run reports, and current-shape rehydration.
- [`@shapeshift-labs/frontier-event-log`](https://www.npmjs.com/package/@shapeshift-labs/frontier-event-log): Bounded event logs, replay cursors, consumer acknowledgements, keyed compaction, checkpoints, and Frontier patch event records.
- [`@shapeshift-labs/frontier-run`](https://www.npmjs.com/package/@shapeshift-labs/frontier-run): Append-only distributed run graphs, causal event DAGs, evidence nodes, lanes, leases, refs, segments, dashboard projections, and admission decision records for Frontier agent work.
- [`@shapeshift-labs/frontier-lease`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lease): Runtime-neutral semantic, file, package, and repository lease claims with fencing tokens, expiry, conflict checks, apply validation, and replayable evidence for Frontier collaboration.
- [`@shapeshift-labs/frontier-inspect`](https://www.npmjs.com/package/@shapeshift-labs/frontier-inspect): Cross-package inspection/evidence bundles, registry graph snapshots, feature/resource impact reports, timeline/event normalization, redaction, JSONL import/export, and AI-readable app feature maps.
- [`@shapeshift-labs/frontier-runtime-proof`](https://www.npmjs.com/package/@shapeshift-labs/frontier-runtime-proof): Runtime-neutral proof capsules, source-bound runtime telemetry, and admission evidence helpers for Frontier merge and review workflows.
- [`@shapeshift-labs/frontier-scheduler`](https://www.npmjs.com/package/@shapeshift-labs/frontier-scheduler): Deterministic work scheduling, lanes, cancellation, backpressure, frame policies, replay snapshots, and work graphs.
- [`@shapeshift-labs/frontier-logging`](https://www.npmjs.com/package/@shapeshift-labs/frontier-logging): Opt-in structured logging, browser telemetry, scheduled sinks, file sinks, exporters, benchmark traces, and Frontier patch/update summaries.
- [`@shapeshift-labs/frontier-mutation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-mutation): Explicit mutation and selector plans compiled to Frontier patches or CRDT operations.
- [`@shapeshift-labs/frontier-effects`](https://www.npmjs.com/package/@shapeshift-labs/frontier-effects): Serializable effect descriptors and resource graphs for Frontier apps, including fetch, storage, timers, navigation, workers, clipboard, broadcast, WebSocket, stream, policy metadata, runtime records, redaction, JSONL, proof helpers, and registry graph output.
- [`@shapeshift-labs/frontier-auth`](https://www.npmjs.com/package/@shapeshift-labs/frontier-auth): Frontier-native auth contracts for providers, sessions, profile completeness, route and resource gates, account-linking policy, token issue/verify plans, runtime grants, audit events, registry graphs, lint resources, and auth evidence without owning app secrets, crypto, storage, or provider SDKs.
- [`@shapeshift-labs/frontier-policy`](https://www.npmjs.com/package/@shapeshift-labs/frontier-policy): Serializable policy and capability decisions for Frontier apps, effects, views, sync, routes, traces, and AI tools.
- [`@shapeshift-labs/frontier-flags`](https://www.npmjs.com/package/@shapeshift-labs/frontier-flags): Patchable policy-aware feature flag state for Frontier apps, including targeting, deterministic rollouts, experiment variants, kill switches, exposure records, audit logs, and replay evidence.
- [`@shapeshift-labs/frontier-tools`](https://www.npmjs.com/package/@shapeshift-labs/frontier-tools): Serializable app action/tool manifests for AI-operable Frontier apps, including availability, validation, dry-run plans, patch previews, effect/tool constraints, execution records, rollback links, and registry graph output.
- [`@shapeshift-labs/frontier-sandbox`](https://www.npmjs.com/package/@shapeshift-labs/frontier-sandbox): Runtime-agnostic sandbox contracts for Frontier patch-producing actions, including manifests, declared reads/writes/capabilities, host-validated patch/effect/event/log results, dynamic source modules, source event replay, and structural runtime adapters.
- [`@shapeshift-labs/frontier-sandbox-quickjs`](https://www.npmjs.com/package/@shapeshift-labs/frontier-sandbox-quickjs): QuickJS/WebAssembly runtime adapter for Frontier sandbox actions, including invocation/runtime isolation modes, deadline and memory limits, dynamic source execution, and patch/effect result normalization.
- [`@shapeshift-labs/frontier-workflow`](https://www.npmjs.com/package/@shapeshift-labs/frontier-workflow): Serializable durable workflow/process manifests for Frontier apps, including steps, waits, approvals, timers, retries, expected patches, compensation, records, timelines, and registry graph output.
- [`@shapeshift-labs/frontier-worker`](https://www.npmjs.com/package/@shapeshift-labs/frontier-worker): Serializable worker and edge task descriptors for Frontier apps, including queues, idempotency keys, retry and timeout policy, declared reads/writes/effects, snapshots, patch outputs, produced assets, execution records, logs, trace links, proof hashes, dedupe indexes, and registry graph output.
- [`@shapeshift-labs/frontier-queue`](https://www.npmjs.com/package/@shapeshift-labs/frontier-queue): Serializable durable queue state, leases, retries, dedupe keys, patch-carrying jobs, dead-letter records, replay evidence, and queue inspection for Frontier apps.
- [`@shapeshift-labs/frontier-swarm`](https://www.npmjs.com/package/@shapeshift-labs/frontier-swarm): Hierarchical swarm plans, lanes, compute profiles, ownership policy, semantic ownership regions, task queues, event streams, run records, merge bundles, merge indexes, queue overlays, merge admission, coordinator dashboards, changed-path checks, and proof artifacts for Frontier agent work.
- [`@shapeshift-labs/frontier-swarm-git`](https://www.npmjs.com/package/@shapeshift-labs/frontier-swarm-git): Node Git, workspace, patch, changed-path, write-fence, package-link repair, patch check, HEAD read, blob hash, and apply-ledger adapter for Frontier swarm runners.
- [`@shapeshift-labs/frontier-swarm-codex`](https://www.npmjs.com/package/@shapeshift-labs/frontier-swarm-codex): Node Codex CLI adapter for Frontier swarm plans, including prompt rendering, worktree and snapshot workspaces, Codex argument compatibility, browser resource allocation, JSONL capture, verification commands, pid-backed stop, collect/apply workflows, merge indexes, queue overlays, merge bundles, normalized job evidence, coordinator query artifacts, result artifacts, and run-log sync adapters.
- [`@shapeshift-labs/frontier-loom-ui`](https://www.npmjs.com/package/@shapeshift-labs/frontier-loom-ui): Read-only Loom and Frontier operator dashboard for workspace-lifetime progress, active agents, queue state, evidence/admission status, run events, run-log sync projections, semantic leases, gate executions, git apply/workspace evidence, and coordinator steering intent files.
- [`@shapeshift-labs/frontier-lang-kernel`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-kernel): Runtime-neutral semantic source graph, type/lattice/extern declarations, patch bundles, replay, hashing, evidence records, and merge-admission kernel for Frontier Lang.
- [`@shapeshift-labs/frontier-lang-checker`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-checker): Checker and diagnostics for Frontier Lang semantic documents, including type symbols, effects, regions, lattice laws, CRDT metadata, and patch evidence.
- [`@shapeshift-labs/frontier-lang-typescript`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-typescript): TypeScript projection adapter for Frontier Lang semantic documents, including type/entity/state/action/extern declarations and CRDT lattice descriptors.
- [`@shapeshift-labs/frontier-lang-javascript`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-javascript): JavaScript projection adapter for Frontier Lang semantic documents, including ESM action stubs and schema/lattice descriptors.
- [`@shapeshift-labs/frontier-lang-jsx`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-jsx): Runtime-neutral JSX semantic merge evidence for Frontier Lang, including element identity, prop records, keyed children, spread props, source spans, and fail-closed renderer/runtime proof gaps.
- [`@shapeshift-labs/frontier-lang-svg`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-svg): Runtime-neutral SVG semantic merge evidence for Frontier Lang, including element identity, local id definitions, url/href reference graphs, source spans, and fail-closed paint/runtime proof gaps.
- [`@shapeshift-labs/frontier-lang-package`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-package): Runtime-neutral package manifest semantic merge evidence for Frontier Lang, including dependency, script, export/import, bin, workspace, package-manager, source-span, and fail-closed install/runtime proof gaps.
- [`@shapeshift-labs/frontier-lang-html`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-html): HTML semantic merge evidence and projection adapter for Frontier Lang semantic documents, including element tree identity, attributes, text/comment spans, source maps, and fail-closed browser/runtime proof gaps.
- [`@shapeshift-labs/frontier-lang-css`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-css): CSS semantic merge evidence and projection adapter for Frontier Lang semantic documents, including selector specificity, declaration/cascade keys, custom properties, `@property` and `@page` descriptor evidence, CSS Modules/ICSS export and composition evidence, source maps, and fail-closed browser cascade/render proof gaps.
- [`@shapeshift-labs/frontier-lang-rust`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-rust): Rust projection adapter for Frontier Lang semantic documents, including structs, aliases, and action stubs.
- [`@shapeshift-labs/frontier-lang-python`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-python): Python projection adapter for Frontier Lang semantic documents, including dataclasses, typed patch records, and action stubs.
- [`@shapeshift-labs/frontier-lang-c`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-c): C header projection adapter for Frontier Lang semantic documents, including structs and action prototypes.
- [`@shapeshift-labs/frontier-lang-compiler`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-compiler): Compiler facade for Frontier Lang source documents, including parse, check, hash, diagnostics, universal AST envelopes, proof/paradigm semantic summaries, projection to TypeScript, JavaScript, JSX, TSX, SVG, HTML, CSS, package manifests, Rust, Python, and C, and native source-import adapters for semantic merge evidence.
- [`@shapeshift-labs/frontier-lang-swift`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-swift): Swift source-language importer package for Frontier Lang semantic documents, including package-level metadata, SwiftSyntax adapter helpers, native import results, and semantic sidecar generation for SwiftSyntax/SwiftParser-shaped syntax trees.
- [`@shapeshift-labs/frontier-lang-kotlin`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-kotlin): Kotlin PSI source-language importer package for Frontier Lang semantic documents, including package-level metadata, Kotlin PSI adapter helpers, native import results, and semantic sidecar generation for Kotlin PSI/KtFile-shaped syntax trees.
- [`@shapeshift-labs/frontier-lang-java`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-java): Java source-language importer package for Frontier Lang semantic documents, including package-level metadata, Java AST adapter helpers, native import results, and semantic sidecar generation for javac/JDT/JavaParser-shaped ASTs.
- [`@shapeshift-labs/frontier-lang-go`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-go): Go source-language importer package for Frontier Lang semantic documents, including package-level metadata, Go AST adapter helpers, native import results, and semantic sidecar generation for go/ast File or Package trees.
- [`@shapeshift-labs/frontier-lang-csharp`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-csharp): C# Roslyn source-language importer package for Frontier Lang semantic documents, including package-level metadata, Roslyn adapter helpers, native import results, and semantic sidecar generation for SyntaxTree/SyntaxNode-shaped ASTs.
- [`@shapeshift-labs/frontier-lang-clang`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-clang): Clang AST source-language importer package for Frontier Lang semantic documents, including package-level metadata, Clang AST JSON adapter helpers, native import results, and semantic sidecar generation for C/C++ translation units.
- [`@shapeshift-labs/frontier-lang-cli`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-cli): Command line interface for parsing, checking, hashing, emitting, native source import/projection, semantic slicing, and corpus roundtrip evidence for Frontier Lang projects.
- [`@shapeshift-labs/frontier-lang`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang): Umbrella package for Frontier Lang kernel, parser, checker, compiler facade, universal AST helpers, projection adapters, HTML/CSS semantic merge evidence adapters, and source-language importer adapters.
- [`@shapeshift-labs/frontier-kv`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv): Serializable in-memory key/value state for Frontier apps, including TTL, versioned compare-and-set, batched patch mutations, scans, watchers, snapshots, JSONL event evidence, and replay verification.
- [`@shapeshift-labs/frontier-kv-locks`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-locks): Lease-style lock records on top of Frontier KV, including acquire, renew, release, fencing tokens, expiration, owner evidence, and replayable lock events.
- [`@shapeshift-labs/frontier-kv-rate-limit`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-rate-limit): Patch-native rate limit buckets for Frontier KV, including fixed windows, sliding windows, token buckets, deterministic refill, consume evidence, and reset records.
- [`@shapeshift-labs/frontier-kv-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-file): Node file persistence adapter for Frontier KV snapshots and append-only JSONL event logs, including atomic writes, compaction, replay loading, and adapter evidence.
- [`@shapeshift-labs/frontier-kv-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-idb): IndexedDB persistence adapter for Frontier KV snapshots and event logs, with structural IDB interfaces, upgrade planning, compact event storage, and replay loading.
- [`@shapeshift-labs/frontier-kv-redis`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-redis): Redis-compatible command planning and structural client adapter for Frontier KV operations, including key mapping, TTL commands, optimistic CAS scripts, and replay evidence without bundling Redis drivers.
- [`@shapeshift-labs/frontier-kv-server`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-server): Small Node HTTP server adapter for Frontier KV, including request planning, JSON endpoints for get/set/delete/scan/batch, optional rate-limit hooks, and replayable response evidence.
- [`@shapeshift-labs/frontier-assets`](https://www.npmjs.com/package/@shapeshift-labs/frontier-assets): Serializable asset and content provenance graphs for Frontier apps, including source files, generated variants, thumbnails, LOD chunks, shader/material dependencies, transforms, hashes, owners, runtime consumers, review plans, registry graph output, and impact queries.
- [`@shapeshift-labs/frontier-blueprint`](https://www.npmjs.com/package/@shapeshift-labs/frontier-blueprint): Serializable Blueprint/Prefab flyweight templates for Frontier apps, including parameterized instantiation, deterministic ID/path remapping, compact overrides, variants, effective-state materialization, scene/state patch emission, dependency metadata, and registry graph output.
- [`@shapeshift-labs/frontier-triggers`](https://www.npmjs.com/package/@shapeshift-labs/frontier-triggers): Capability-gated event trigger registry, scoped event envelopes, listener/reaction rules, structured rejection, deterministic event-to-action scheduling, replay/provenance records, and registry graph output.
- [`@shapeshift-labs/frontier-virtual`](https://www.npmjs.com/package/@shapeshift-labs/frontier-virtual): DOM-neutral virtualization, layout providers, range materialization, grids, spatial/frustum indexes, patch invalidation, camera anchors, and serializable layout state.
- [`@shapeshift-labs/frontier-table`](https://www.npmjs.com/package/@shapeshift-labs/frontier-table): Renderer-neutral data grid and table primitives for Frontier apps, including stable row identity, sorting, filtering, selection, virtual ranges, patch-driven edits, cache/dataflow descriptors, and CRDT-compatible row and cell operation frames.
- [`@shapeshift-labs/frontier-scene`](https://www.npmjs.com/package/@shapeshift-labs/frontier-scene): Patch-native 2D/3D scene graph, transform propagation, bounds queries, virtual/culling adapters, spatial invalidation, and camera/frustum materialization.
- [`@shapeshift-labs/frontier-pathfinding`](https://www.npmjs.com/package/@shapeshift-labs/frontier-pathfinding): Patch-native grid pathfinding, typed-array A*/Dijkstra search, flow fields, connected components, line-of-sight smoothing, dirty-cell invalidation, and scheduler-friendly path jobs.
- [`@shapeshift-labs/frontier-lod`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lod): Patch-native level-of-detail and significance selection for rendering and computation workloads, compact typed hot paths, multi-observer selection, budget degradation, materialization frames, and scheduler work plans.
- [`@shapeshift-labs/frontier-route`](https://www.npmjs.com/package/@shapeshift-labs/frontier-route): DOM-neutral app/game route resources, route and scene manifests, match/resolve/transition planning, dependency metadata, sessions, registry graph output, and impact queries.
- [`@shapeshift-labs/frontier-trace`](https://www.npmjs.com/package/@shapeshift-labs/frontier-trace): Serializable traces, spans, events, causal links, W3C trace context helpers, timeline/resource/path queries, critical-path analysis, registry graph output, JSONL/proof helpers, Chrome trace export, and redaction for app-wide feature observability.
- [`@shapeshift-labs/frontier-manifest`](https://www.npmjs.com/package/@shapeshift-labs/frontier-manifest): Build/static feature manifests for owners, routes, actions, states, migrations, tests, source files, assets, resources, tasks, dependency metadata, registry graph output, feature maps, JSONL export, and impact queries.
- [`@shapeshift-labs/frontier-view`](https://www.npmjs.com/package/@shapeshift-labs/frontier-view): Renderer-neutral view manifests, type defaults, validation frames, action bindings, visual channels, virtual/LOD hints, and data-to-representation mapping for Frontier apps.
- [`@shapeshift-labs/frontier-icons`](https://www.npmjs.com/package/@shapeshift-labs/frontier-icons): Renderer-neutral icon records, icon sets, lookup aliases, SVG frames, string rendering, and registry evidence for Frontier apps.
- [`@shapeshift-labs/frontier-design`](https://www.npmjs.com/package/@shapeshift-labs/frontier-design): Renderer-neutral design-system tokens, semantic roles, recipes, target style frames, CSS variable output, and registry graph evidence for Frontier apps.
- [`@shapeshift-labs/frontier-canvas`](https://www.npmjs.com/package/@shapeshift-labs/frontier-canvas): Renderer-neutral infinite canvas surfaces for Frontier apps, including camera and viewport math, pan/zoom plans, grid materialization, snapping, hit testing, selection handles, extensible tool dispatch, frame records, registry graph output, and impact/proof helpers.
- [`@shapeshift-labs/frontier-canvas-tools`](https://www.npmjs.com/package/@shapeshift-labs/frontier-canvas-tools): Renderer-neutral editor tools, state machines, transform handles, permissions, async records, and AI action bridges for Frontier canvas surfaces.
- [`@shapeshift-labs/frontier-dnd`](https://www.npmjs.com/package/@shapeshift-labs/frontier-dnd): Renderer-neutral drag-and-drop sessions, sensor descriptors, collision ranking, drop planning, reorder patches, state partitioning, and registry evidence for Frontier apps.
- [`@shapeshift-labs/frontier-dom`](https://www.npmjs.com/package/@shapeshift-labs/frontier-dom): Patch-native DOM and host renderer bindings, manifest hydration, JSX runtime/compiler helpers, SSR, devtools, and logging bridges.
- [`@shapeshift-labs/frontier-playwright`](https://www.npmjs.com/package/@shapeshift-labs/frontier-playwright): Playwright/headless automation probes for Frontier state, DOM, devtools, marks, and timeline queries.
- [`@shapeshift-labs/frontier-test`](https://www.npmjs.com/package/@shapeshift-labs/frontier-test): Serializable test/spec evidence manifests for Frontier apps, including fixtures, commands, expected patches/effects/routes/policies, coverage declarations, run plans, run records, report adapters, replay proofs, fuzzers, benchmarks, registry graph output, and impact queries.
- [`@shapeshift-labs/frontier-fixtures`](https://www.npmjs.com/package/@shapeshift-labs/frontier-fixtures): Deterministic fixture and scenario generation for Frontier apps, including schema-valid sample state, related entity collections, actor personas, route states, replay-verified patch streams, event records, JSONL bundles, and evidence summaries.
- [`@shapeshift-labs/frontier-component-preview`](https://www.npmjs.com/package/@shapeshift-labs/frontier-component-preview): Frontier-native component preview books, generated preview manifests, stateful variants, Vite virtual modules, standalone browser preview shells, inspector bridges, and preview harness evidence for Frontier apps.
- [`@shapeshift-labs/frontier-documentation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-documentation): Frontier-native documentation manifests, generated documentation books, package/API/source discovery, Vite virtual modules, standalone browser docs shells, inspector bridges, search indexes, and documentation harness evidence for Frontier apps and packages.
- [`@shapeshift-labs/frontier-ast-walk`](https://www.npmjs.com/package/@shapeshift-labs/frontier-ast-walk): Dependency-light source graph, import/export/declaration/call analysis, Frontier package-use discovery, and business-logic placement findings for Frontier tools, apps, docs, fuzzers, benchmarks, and agent evidence.
- [`@shapeshift-labs/frontier-history`](https://www.npmjs.com/package/@shapeshift-labs/frontier-history): Serializable temporal explanation and causality records for Frontier apps, including field-change explanations, action/workflow/policy/effect/trace/test provenance, audit windows, undo planning, registry/provenance graph output, JSONL replay bundles, and proof hashes.
- [`@shapeshift-labs/frontier-application`](https://www.npmjs.com/package/@shapeshift-labs/frontier-application): Serializable whole-application graph and impact queries for Frontier apps, including features, owners, packages, routes, views, actions, mutations, state paths, effects, workers, assets, tests, traces, policies, workflows, migrations, benchmarks, registry graph output, feature maps, JSONL bundles, and proof hashes.
- [`@shapeshift-labs/frontier-linter`](https://www.npmjs.com/package/@shapeshift-labs/frontier-linter): Serializable Frontier lint rules, diagnostics, fixes, reports, and fast rule execution for package catalogs, registry graphs, application maps, manifests, traces, policies, workflows, workers, assets, tests, benchmarks, and source snippets.
- [`@shapeshift-labs/frontier-framework`](https://www.npmjs.com/package/@shapeshift-labs/frontier-framework): High-level app framework package for Frontier applications, including configuration, CLI scaffolding, Vite builds, monorepo layout, TSX route builds, split frontend/backend deploy artifacts, backend-neutral Fetch handler and sync transport contracts, runtime data-source migrations, devtools, harness gates, agent MCP/tool manifests, CI evidence gates, workflow manifests, SARIF/linter output, replay scripts, and evidence manifest output.
- [`@shapeshift-labs/frontier-crdt`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt): Native CRDT documents, update tooling, awareness, branches, conflict introspection, version frames, and undo.
- [`@shapeshift-labs/frontier-crdt-sync`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-sync): CRDT sync endpoints, repo/storage/provider contracts, scheduled sync work, document URLs, local networks, model checking, forensics, and text binding contracts.
- [`@shapeshift-labs/frontier-crdt-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-websocket): WebSocket client/server transports for Frontier CRDT sync providers.
- [`@shapeshift-labs/frontier-react`](https://www.npmjs.com/package/@shapeshift-labs/frontier-react): React external-store hooks and adapters for Frontier state, cache, and CRDT surfaces.
- [`@shapeshift-labs/frontier-richtext`](https://www.npmjs.com/package/@shapeshift-labs/frontier-richtext): Rich text Delta normalization/application, marks, embeds, ranges, and cursor/selection transforms for local editor integrations.
- [`@shapeshift-labs/frontier-realtime`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime): Shared realtime command, tick, snapshot, prediction, reconciliation, interpolation, rollback, message, and delta primitives.
- [`@shapeshift-labs/frontier-realtime-server`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-server): Authoritative realtime room, tick, command validation, rate-limit, session, and snapshot-history runtime.
- [`@shapeshift-labs/frontier-realtime-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-websocket): WebSocket client, wire, and Node room-server transport for Frontier realtime.
- [`@shapeshift-labs/frontier-game`](https://www.npmjs.com/package/@shapeshift-labs/frontier-game): Game-facing entity, component, player, room, ownership, spatial interest, rollback, physics, and replication helpers above realtime.
- [`@shapeshift-labs/loom`](https://www.npmjs.com/package/@shapeshift-labs/loom): Repo-level semantic collaboration CLI for .loom workspaces, including init, scan, status, graph snapshots, projection plans, Frontier Lang delegation, Frontier Swarm delegation, run-log sync command delegation, and Frontier Framework delegation.

Package source repositories:

- [`siliconjungle/-shapeshift-labs-frontier`](https://github.com/siliconjungle/-shapeshift-labs-frontier)
- [`siliconjungle/-shapeshift-labs-frontier-query`](https://github.com/siliconjungle/-shapeshift-labs-frontier-query)
- [`siliconjungle/-shapeshift-labs-frontier-codec`](https://github.com/siliconjungle/-shapeshift-labs-frontier-codec)
- [`siliconjungle/-shapeshift-labs-frontier-engine`](https://github.com/siliconjungle/-shapeshift-labs-frontier-engine)
- [`siliconjungle/-shapeshift-labs-frontier-state`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state)
- [`siliconjungle/-shapeshift-labs-frontier-dataflow`](https://github.com/siliconjungle/-shapeshift-labs-frontier-dataflow)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-idb)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-file)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-sql`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-sql)
- [`siliconjungle/-shapeshift-labs-frontier-schema`](https://github.com/siliconjungle/-shapeshift-labs-frontier-schema)
- [`siliconjungle/-shapeshift-labs-frontier-migrations`](https://github.com/siliconjungle/-shapeshift-labs-frontier-migrations)
- [`siliconjungle/-shapeshift-labs-frontier-event-log`](https://github.com/siliconjungle/-shapeshift-labs-frontier-event-log)
- [`siliconjungle/-shapeshift-labs-frontier-run`](https://github.com/siliconjungle/-shapeshift-labs-frontier-run)
- [`siliconjungle/-shapeshift-labs-frontier-lease`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lease)
- [`siliconjungle/-shapeshift-labs-frontier-inspect`](https://github.com/siliconjungle/-shapeshift-labs-frontier-inspect)
- [`siliconjungle/-shapeshift-labs-frontier-runtime-proof`](https://github.com/siliconjungle/-shapeshift-labs-frontier-runtime-proof)
- [`siliconjungle/-shapeshift-labs-frontier-scheduler`](https://github.com/siliconjungle/-shapeshift-labs-frontier-scheduler)
- [`siliconjungle/-shapeshift-labs-frontier-logging`](https://github.com/siliconjungle/-shapeshift-labs-frontier-logging)
- [`siliconjungle/-shapeshift-labs-frontier-mutation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)
- [`siliconjungle/-shapeshift-labs-frontier-effects`](https://github.com/siliconjungle/-shapeshift-labs-frontier-effects)
- [`siliconjungle/-shapeshift-labs-frontier-auth`](https://github.com/siliconjungle/-shapeshift-labs-frontier-auth)
- [`siliconjungle/-shapeshift-labs-frontier-policy`](https://github.com/siliconjungle/-shapeshift-labs-frontier-policy)
- [`siliconjungle/-shapeshift-labs-frontier-flags`](https://github.com/siliconjungle/-shapeshift-labs-frontier-flags)
- [`siliconjungle/-shapeshift-labs-frontier-tools`](https://github.com/siliconjungle/-shapeshift-labs-frontier-tools)
- [`siliconjungle/-shapeshift-labs-frontier-sandbox`](https://github.com/siliconjungle/-shapeshift-labs-frontier-sandbox)
- [`siliconjungle/-shapeshift-labs-frontier-sandbox-quickjs`](https://github.com/siliconjungle/-shapeshift-labs-frontier-sandbox-quickjs)
- [`siliconjungle/-shapeshift-labs-frontier-workflow`](https://github.com/siliconjungle/-shapeshift-labs-frontier-workflow)
- [`siliconjungle/-shapeshift-labs-frontier-worker`](https://github.com/siliconjungle/-shapeshift-labs-frontier-worker)
- [`siliconjungle/-shapeshift-labs-frontier-queue`](https://github.com/siliconjungle/-shapeshift-labs-frontier-queue)
- [`siliconjungle/-shapeshift-labs-frontier-swarm`](https://github.com/siliconjungle/-shapeshift-labs-frontier-swarm)
- [`siliconjungle/-shapeshift-labs-frontier-swarm-git`](https://github.com/siliconjungle/-shapeshift-labs-frontier-swarm-git)
- [`siliconjungle/-shapeshift-labs-frontier-swarm-codex`](https://github.com/siliconjungle/-shapeshift-labs-frontier-swarm-codex)
- [`siliconjungle/frontier-loom-ui`](https://github.com/siliconjungle/frontier-loom-ui)
- [`siliconjungle/-shapeshift-labs-frontier-lang-kernel`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-kernel)
- [`siliconjungle/-shapeshift-labs-frontier-lang-parser`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-parser)
- [`siliconjungle/-shapeshift-labs-frontier-lang-checker`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-checker)
- [`siliconjungle/-shapeshift-labs-frontier-lang-typescript`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-typescript)
- [`siliconjungle/-shapeshift-labs-frontier-lang-javascript`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-javascript)
- [`siliconjungle/-shapeshift-labs-frontier-lang-jsx`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-jsx)
- [`siliconjungle/-shapeshift-labs-frontier-lang-svg`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-svg)
- [`siliconjungle/-shapeshift-labs-frontier-lang-package`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-package)
- [`siliconjungle/-shapeshift-labs-frontier-lang-html`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-html)
- [`siliconjungle/-shapeshift-labs-frontier-lang-css`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-css)
- [`siliconjungle/-shapeshift-labs-frontier-lang-rust`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-rust)
- [`siliconjungle/-shapeshift-labs-frontier-lang-python`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-python)
- [`siliconjungle/-shapeshift-labs-frontier-lang-c`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-c)
- [`siliconjungle/-shapeshift-labs-frontier-lang-compiler`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-compiler)
- [`siliconjungle/-shapeshift-labs-frontier-lang-swift`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-swift)
- [`siliconjungle/-shapeshift-labs-frontier-lang-kotlin`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-kotlin)
- [`siliconjungle/-shapeshift-labs-frontier-lang-java`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-java)
- [`siliconjungle/-shapeshift-labs-frontier-lang-go`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-go)
- [`siliconjungle/-shapeshift-labs-frontier-lang-csharp`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-csharp)
- [`siliconjungle/-shapeshift-labs-frontier-lang-clang`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-clang)
- [`siliconjungle/-shapeshift-labs-frontier-lang-cli`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-cli)
- [`siliconjungle/-shapeshift-labs-frontier-lang`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang)
- [`siliconjungle/-shapeshift-labs-frontier-kv`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv)
- [`siliconjungle/-shapeshift-labs-frontier-kv-locks`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-locks)
- [`siliconjungle/-shapeshift-labs-frontier-kv-rate-limit`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-rate-limit)
- [`siliconjungle/-shapeshift-labs-frontier-kv-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-file)
- [`siliconjungle/-shapeshift-labs-frontier-kv-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-idb)
- [`siliconjungle/-shapeshift-labs-frontier-kv-redis`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-redis)
- [`siliconjungle/-shapeshift-labs-frontier-kv-server`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-server)
- [`siliconjungle/-shapeshift-labs-frontier-assets`](https://github.com/siliconjungle/-shapeshift-labs-frontier-assets)
- [`siliconjungle/-shapeshift-labs-frontier-blueprint`](https://github.com/siliconjungle/-shapeshift-labs-frontier-blueprint)
- [`siliconjungle/-shapeshift-labs-frontier-triggers`](https://github.com/siliconjungle/-shapeshift-labs-frontier-triggers)
- [`siliconjungle/-shapeshift-labs-frontier-virtual`](https://github.com/siliconjungle/-shapeshift-labs-frontier-virtual)
- [`siliconjungle/-shapeshift-labs-frontier-table`](https://github.com/siliconjungle/-shapeshift-labs-frontier-table)
- [`siliconjungle/-shapeshift-labs-frontier-scene`](https://github.com/siliconjungle/-shapeshift-labs-frontier-scene)
- [`siliconjungle/-shapeshift-labs-frontier-pathfinding`](https://github.com/siliconjungle/-shapeshift-labs-frontier-pathfinding)
- [`siliconjungle/-shapeshift-labs-frontier-lod`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lod)
- [`siliconjungle/-shapeshift-labs-frontier-route`](https://github.com/siliconjungle/-shapeshift-labs-frontier-route)
- [`siliconjungle/-shapeshift-labs-frontier-trace`](https://github.com/siliconjungle/-shapeshift-labs-frontier-trace)
- [`siliconjungle/-shapeshift-labs-frontier-manifest`](https://github.com/siliconjungle/-shapeshift-labs-frontier-manifest)
- [`siliconjungle/-shapeshift-labs-frontier-view`](https://github.com/siliconjungle/-shapeshift-labs-frontier-view)
- [`siliconjungle/-shapeshift-labs-frontier-icons`](https://github.com/siliconjungle/-shapeshift-labs-frontier-icons)
- [`siliconjungle/-shapeshift-labs-frontier-design`](https://github.com/siliconjungle/-shapeshift-labs-frontier-design)
- [`siliconjungle/-shapeshift-labs-frontier-canvas`](https://github.com/siliconjungle/-shapeshift-labs-frontier-canvas)
- [`siliconjungle/-shapeshift-labs-frontier-canvas-tools`](https://github.com/siliconjungle/-shapeshift-labs-frontier-canvas-tools)
- [`siliconjungle/-shapeshift-labs-frontier-dnd`](https://github.com/siliconjungle/-shapeshift-labs-frontier-dnd)
- [`siliconjungle/-shapeshift-labs-frontier-dom`](https://github.com/siliconjungle/-shapeshift-labs-frontier-dom)
- [`siliconjungle/-shapeshift-labs-frontier-playwright`](https://github.com/siliconjungle/-shapeshift-labs-frontier-playwright)
- [`siliconjungle/-shapeshift-labs-frontier-test`](https://github.com/siliconjungle/-shapeshift-labs-frontier-test)
- [`siliconjungle/-shapeshift-labs-frontier-fixtures`](https://github.com/siliconjungle/-shapeshift-labs-frontier-fixtures)
- [`siliconjungle/-shapeshift-labs-frontier-component-preview`](https://github.com/siliconjungle/-shapeshift-labs-frontier-component-preview)
- [`siliconjungle/-shapeshift-labs-frontier-documentation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-documentation)
- [`siliconjungle/-shapeshift-labs-frontier-ast-walk`](https://github.com/siliconjungle/-shapeshift-labs-frontier-ast-walk)
- [`siliconjungle/-shapeshift-labs-frontier-history`](https://github.com/siliconjungle/-shapeshift-labs-frontier-history)
- [`siliconjungle/-shapeshift-labs-frontier-application`](https://github.com/siliconjungle/-shapeshift-labs-frontier-application)
- [`siliconjungle/-shapeshift-labs-frontier-linter`](https://github.com/siliconjungle/-shapeshift-labs-frontier-linter)
- [`siliconjungle/-shapeshift-labs-frontier-framework`](https://github.com/siliconjungle/-shapeshift-labs-frontier-framework)
- [`siliconjungle/-shapeshift-labs-frontier-crdt`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-sync`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-sync)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-react`](https://github.com/siliconjungle/-shapeshift-labs-frontier-react)
- [`siliconjungle/-shapeshift-labs-frontier-richtext`](https://github.com/siliconjungle/-shapeshift-labs-frontier-richtext)
- [`siliconjungle/-shapeshift-labs-frontier-realtime`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-server`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-server)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-game`](https://github.com/siliconjungle/-shapeshift-labs-frontier-game)
- [`siliconjungle/-shapeshift-labs-loom`](https://github.com/siliconjungle/-shapeshift-labs-loom)

## Install

```sh
npm install @shapeshift-labs/frontier-lang-parser
```

The parser projects text into `@shapeshift-labs/frontier-lang-kernel` documents. The syntax is intentionally small and experimental.

## Authored view render graph syntax

`.frontier` view blocks can describe UI render graphs directly. Nested `render`
blocks are flattened into `view.renders`, and each parent stores stable child
render IDs in `children`. This keeps authored UI structural and target-neutral:
HTML, JSX, SwiftUI, or another target can lower the same semantic graph without
the parser claiming browser or runtime equivalence.

```frontier
view TodoList @id("view_todo_list") {
  reads TodoDb.todos
  dispatches action_add
  prop disabled @id("view_prop_disabled"): Boolean
  event save @id("view_event_save") action action_add input TodoInput

  render Article @id("render_todo_root") {
    key todo-list-root

    render Button @id("render_save_button") {
      identity save
      text "Save"
      prop disabled disabled
      on press save
    }

    render SaveIcon kind component @id("render_save_icon") {
      component Icon
      key save-icon
      prop name "check"
    }
  }
}
```

The root render becomes a graph node whose `children` reference
`render_save_button` and `render_save_icon` in source order. Child props, text,
and events stay attached to the child render node instead of leaking onto the
parent. `kind component` records `component` instead of a literal HTML tag, so
target adapters can decide how to project it.

## Authored package and canvas syntax

`.frontier` files can describe package-management and canvas semantic surfaces
directly, without requiring the source of truth to be a generated JSON tree.
These blocks make dependency, script, export, draw-command, command-trace, and
proof-gap records queryable as source-level evidence. They intentionally do not
claim package install equivalence, canvas runtime equivalence, or visual
equivalence.

```frontier
packageManifest AppPackage @id("pkg_manifest_app") {
  sourcePath package.json
  sourceHash sha256:package
  packageManager npm@11.0.0
  evidence packageProbe @id("evidence_package_probe") kind test status passed path reports/package.json
  metadata name @id("pkg_meta_name") value "@example/app" evidence evidence_package_probe
  dependency react @id("pkg_dep_react") section dependencies range ^19.0.0 evidence evidence_package_probe
  dependency typescript @id("pkg_dep_typescript") section peerDependencies range ^5.9.0 proofGap package-peer-compatibility-boundary evidence evidence_package_probe
  script test @id("pkg_script_test") command "vitest --run" proofGap package-script-runtime-boundary evidence evidence_package_probe
  export root @id("pkg_export_root") section exports name . target ./dist/index.js proofGap package-conditional-resolution-boundary evidence evidence_package_probe
  gap workspace @id("pkg_gap_workspace") code package-workspace-graph-boundary summary "Workspace expansion requires repository graph evidence."
}

canvasSurface PreviewCanvas @id("canvas_surface_preview") {
  sourcePath src/draw.js
  sourceHash sha256:draw
  evidence canvasProbe @id("evidence_canvas_probe") kind browser-probe status passed path reports/canvas.json
  element preview @id("canvas_element_preview") name canvas category html-canvas order 1 identity canvas:preview attributes data-frontier-key=preview|width=100 evidence evidence_canvas_probe
  command context @id("canvas_command_context") name getContext category context context 2d order 2 proofGap canvas-context-runtime-boundary evidence evidence_canvas_probe
  state fillStyle @id("canvas_state_fill_style") name fillStyle category state order 3 proofGap canvas-stateful-render-order-boundary evidence evidence_canvas_probe
  command fill @id("canvas_command_fill") name fillRect category draw context 2d order 4 proofGap canvas-stateful-render-order-boundary evidence evidence_canvas_probe
  command offscreen @id("canvas_command_offscreen") name transferControlToOffscreen category offscreen order 5 proofGap canvas-offscreen-worker-boundary evidence evidence_canvas_probe
  trace drawFrame @id("canvas_trace_draw_frame") commands getContext|fillStyle|fillRect|transferControlToOffscreen evidence evidence_canvas_probe
  gap image @id("canvas_gap_image") code canvas-image-resource-boundary summary "Image drawing needs bitmap/resource evidence."
}
```

The parser stores package blocks in `metadata.packageManifests` and canvas
blocks in `metadata.canvasSurfaces`, and mirrors both under
`metadata.universalAst` so compiler and merge tooling can see them next to
native-source source maps and merge candidates. Package records keep
`packageInstallEquivalenceClaim`, `installEquivalenceClaim`, and
`runtimeEquivalenceClaim` false. Canvas records keep
`browserRuntimeEquivalenceClaim`, `canvasRuntimeEquivalenceClaim`, and
`canvasVisualEquivalenceClaim` false.
Runtime probes, package-manager solver output, lockfile proof, browser pixels,
worker transfer evidence, and GPU validation must still be supplied by higher
layers before admission.

## Authored target projection syntax

`.frontier` target blocks can carry projection contracts next to their emit settings. These rows describe what a target lowering claims to represent, what it still needs proof for, and which losses or missing evidence must stay visible to merge and translation tooling.

```frontier
target rust @id("target_rust") {
  language rust
  package example_todo
  emitPath src/generated/todo.rs
  moduleFormat crate
  projection rustAdapter @id("target_projection_rust") disposition target-adapter readiness needs-review represented semantic-symbol|source-map missing semantic-ownership evidence artifact_todo_title_probe proof artifact_todo_title_probe loss loss_borrow_scope missingEvidence translation-borrow-scope:borrow-across-await
  layer ownership @id("target_layer_rust_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
}
```

The parser stores these rows on the target node metadata as `projectionContracts` and `projectionLayers`. They are target-lowering evidence, not proof of equivalence: `autoMergeClaim` and `semanticEquivalenceClaim` remain false.

## Authored decision graph syntax

`.frontier` files can carry semantic merge admission evidence directly in `decisionGraph` or `admissionGraph` blocks. These blocks preserve the causal review shape around a candidate edit: semantic changes, gates, evidence records, patch events, admission decisions, merge decisions, graph nodes, and graph edges.

```frontier
decisionGraph TodoAdmission @id("decision_graph_todo") {
  graphKind semantic-merge-admission
  scope mod_todo
  root merge_decision_title
  subject action_add,field_title
  node change @id("decision_node_change") kind semantic-change record semantic_change_title label "Title change" status passed
  edge changeToGate @id("decision_edge_change_gate") from semantic_change_title to gate_typecheck kind gates status passed
  change title @id("semantic_change_title") kind source-edit language typescript sourcePath src/todo.ts semanticNode field_title semanticSymbol symbol:Todo.title evidence evidence_typecheck
  gate typecheck @id("gate_typecheck") kind typecheck status passed required command "npm run typecheck" semanticChange semantic_change_title evidence evidence_typecheck
  evidence typecheck @id("evidence_typecheck") kind test status passed path reports/typecheck.json gate gate_typecheck semanticChange semantic_change_title
  patchEvent workerPatch @id("patch_event_worker") patch patch_worker status passed baseHash h_base targetHash h_worker semanticChange semantic_change_title gate gate_typecheck evidence evidence_typecheck deterministic
  admission titleSafe @id("admission_title_safe") candidate candidate_todo_title semanticChange semantic_change_title classification safe decision merge autoMergeable gate gate_typecheck evidence evidence_typecheck
  merge titleMerge @id("merge_decision_title") candidate candidate_todo_title semanticChange semantic_change_title admissionDecision admission_title_safe decision merge autoMergeable gate gate_typecheck evidence evidence_typecheck
}
```

The parser projects these rows into `metadata.decisionGraph`. Decision graph records are normalized by the kernel helpers, so authored files can describe why a merge is admissible without embedding raw JSON. This is intentionally evidence-first: a safe merge can be represented as a graph of changes, gates, evidence, and decisions, while missing proof can remain explicit as blocked or review-required records.

## Authored resource graph syntax

`.frontier` files can carry semantic resource graph evidence directly in `resourceGraph` or `semanticResourceGraph` blocks. These blocks make ownership, aliases, loans, moves, drops, lifetimes, unsafe boundaries, conflicts, and proof obligations explicit for translation and semantic merge admission.

```frontier
resourceGraph TodoResources @id("resource_graph_todo") {
  sourceLanguage javascript
  sourcePath src/todo.ts
  sourceHash sha256:example
  evidence artifact_todo_title_probe
  resource todos @id("resource_todos") kind collection owner owner_todo_store
  owner todoStore @id("owner_todo_store") kind store
  lifetime request @id("life_request") kind lexical startLine 1 endLine 80
  loan readTodos @id("loan_read_todos") resource resource_todos owner owner_todo_store lifetime life_request mode shared access read
  alias todosAlias @id("alias_todos") resource resource_todos owner owner_todo_store alias alias:todos kind local
  move todoMove @id("move_todos") resource resource_todos fromOwner owner_todo_store toOwner owner_worker kind transfer
  drop todoDrop @id("drop_todos") resource resource_todos owner owner_worker lifetime life_request kind lexical-drop order 1
  escape todoEscape @id("escape_todos") resource resource_todos loan loan_read_todos lifetime life_request kind returned-borrow status needs-proof
  outlives requestModule @id("life_request_outlives_module") from life_module to life_request kind contains
  borrow readScope @id("borrow_scope_todos") resource resource_todos lifetime life_request kind shared-borrow constraint shared|read-only
  unsafe ffiBoundary @id("unsafe_todos_ffi") resource resource_todos kind ffi proofStatus missing
  conflict aliasConflict @id("conflict_todos_alias") resource resource_todos loan loan_read_todos alias alias_todos reasonCode exclusive-resource-alias-overlap-requires-proof status open severity error
  proof aliasProof @id("proof_obligation_alias") resource resource_todos conflict conflict_todos_alias kind alias-safety status open statement "Prove the alias cannot mutate during the shared loan."
}
```

The parser projects these rows into `metadata.semanticResourceGraphs`. Resource graphs are evidence, not proof: generated claims for borrow-checker soundness, alias safety, lifetime soundness, semantic equivalence, and auto-merge stay false. Compiler conversion routes can use these authored graphs as source-side resource, ownership, lifetime, and borrow-checker evidence while still requiring target proof before admission.

## Authored interlingua syntax

`.frontier` files can carry universal interlingua route evidence directly in `interlingua` or `universalInterlingua` blocks. These blocks describe the source lift, represented and missing semantic layers, constraint edges, proof obligations, and target lowering disposition for a route without claiming semantic equivalence.

```frontier
interlingua JsToRust @id("interlingua_js_rust") {
  route conversion_route_javascript_to_rust
  sourceLanguage javascript
  target rust
  mode target-adapter
  lift source @id("lift_js") sourceImport native_import_js sourcePath src/public-api.js sourceHash sha256:source sourceMap source_map_js ownership symbol:displayName conflict symbol:displayName evidence evidence_translation proof proof_translation
  layer symbols @id("layer_symbols") kind semantic-symbol status represented evidence evidence_translation
  layer ownership @id("layer_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
  constraint borrowAwait @id("constraint_borrow_await") family borrow-scope layer semantic-ownership status needs-evidence action collect-borrow-scope required shared-borrow-compatible|borrow-across-await represented shared-borrow-compatible missing borrow-across-await missingEvidence translation-borrow-scope:borrow-across-await evidence evidence_borrow_scope obligation obligation_borrow_await
  obligation borrowAwait @id("obligation_borrow_await") edge constraint_borrow_await family borrow-scope kind borrow-across-await status missing missingEvidence translation-borrow-scope:borrow-across-await evidence evidence_borrow_scope
  lowering rustAdapter @id("lowering_rust_adapter") disposition target-adapter adapter fixture-js-rust adapterKind targetProjection readiness needs-review lossClass targetAdapterProjection proofEvidence proof_translation missingEvidence host-target-adapter-review review adapter-review
}
```

The parser projects these rows into `metadata.universalInterlingua`. Interlingua records are route evidence: they expose queryable layer kinds, constraint families, obligation kinds/statuses, lowering disposition, proof ids, and missing evidence while keeping `autoMergeClaim` and `semanticEquivalenceClaim` false. The compiler can merge matching authored records into generated conversion routes by route id or source/target.

## Authored conversion syntax

`.frontier` files can carry universal conversion evidence directly in `conversion` or `universalConversionPlan` blocks. The parser projects these records into `metadata.universalConversionPlan` for the compiler facade and downstream semantic merge tooling.

```frontier
conversion TodoJavascriptToRust @id("conversion_todo_js_rust") {
  sourceLanguage javascript
  target rust
  sourceRuntime javascript node
  targetRuntime rust cli
  runtimeRequirement fetchRuntime @id("runtime_requirement_fetch") capability fetch sourceRuntime node targetRuntime cli requiredSignals source-hash|target-hash|runtime-command|probe-id|telemetry-hash|network-trace-hash evidence artifact_todo_title_probe proofEvidence artifact_todo_title_probe
  dialect nodeProcess @id("dialect_node_process") language javascript dialect node.runtime kind runtime target rust disposition unsupported readiness blocked loss loss_node_process_projection
  extern viteRoutes @id("extern_vite_routes") language javascript dialect vite.plugin.virtual-module externKind generatorArtifact target rust disposition runtime-required evidence evidence_vite_routes_manifest bindingSymbol virtual:routes
  constraint type publicApi @id("type_constraint_public_api") role source kind public-function symbol symbol:addTodo signatureHash sig_add_todo evidence artifact_todo_title_probe
  constraint module-constraint todoModule @id("module_constraint_todo") role source kind module-boundary specifier ./todo exportedName addTodo packageName @app/todo packageCondition import resolutionKind node16 evidence artifact_todo_title_probe
  constraint scope-binding todoLocal @id("scope_binding_todo") role source kind lexical-binding bindingId binding:todo referenceId ref:todo scopeId scope:handler resolvedBindingId binding:todo evidence artifact_todo_title_probe
  constraint memory-model todoMemory @id("memory_model_todo") role source kind stable-reference resource TodoDb.todos memoryKind shared-memory memoryOrder acquire lockId lock:todo shared evidence artifact_todo_title_probe
  constraint effect-constraint todoWrite @id("effect_constraint_todo_write") role source kind storage-write capability storage.write resource TodoDb.todos adapterRequired evidence artifact_todo_title_probe
  constraint host-environment browserFetch @id("host_environment_fetch") role source kind browser-api capability fetch apiName fetch globalName window permission network adapterRequired evidence artifact_todo_title_probe
  constraint callable-boundary saveUser @id("callable_boundary_save_user") role source kind method-call callableKind function functionName saveUser parameterCount 2 parameterOrder user|options returnKind promise asyncKind async evidence artifact_todo_title_probe
  constraint adt-pattern resultShape @id("adt_pattern_result") role source kind tagged-union adtKind union typeName UserResult variantNames Ok|Err payloadFieldNames value|error exhaustivenessKinds total evidence artifact_todo_title_probe
  constraint numeric-semantics amountNumber @id("numeric_semantics_amount") role source kind integer numericKind int width 53 overflowMode safe-integer specialValues nan|infinity evidence artifact_todo_title_probe
  constraint text-semantics titleText @id("text_semantics_title") role source kind string encoding utf-16 normalizationForm nfc boundaryKinds grapheme|word evidence artifact_todo_title_probe
  constraint collection-semantics todoList @id("collection_semantics_todos") role source kind array collectionKind array elementKind Todo iterationOrder insertion duplicatePolicy allow evidence artifact_todo_title_probe
  constraint serialization-semantics todoJson @id("serialization_semantics_todo_json") role source kind json format json codec JSON.stringify schemaName TodoPayload deterministic evidence artifact_todo_title_probe
  constraint dependency-semantics npmReact @id("dependency_semantics_react") role source kind package packageManager npm packageName react versionRange ^19.0.0 lockfile package-lock.json integrity sha512-demo evidence artifact_todo_title_probe
  constraint protocol serializable @id("protocol_serializable") role target kind trait-bound protocolKind trait traitName Serializable requirementNames serialize|deserialize evidence artifact_todo_title_probe
}
```

`sourceRuntime` and `targetRuntime` become runtime maps. `runtimeRequirement` rows become proof obligations for host/runtime capabilities, including authored `requiredSignals` denominators such as source hashes, target hashes, probe ids, runtime commands, telemetry hashes, and capability-specific trace hashes. `proofEvidence` and `evidence` attach evidence ids, but the compiler still requires bound evidence records before a proof obligation is satisfied. `dialect` and `extern` rows preserve dialect-specific constructs, projection readiness, loss/evidence ids, and binding metadata without requiring the authored Frontier file to drop down to raw JSON.

`constraint` rows accept every universal conversion constraint family used by route admission, including hyphenated spellings such as `module-constraint`, `scope-binding`, `memory-model`, `effect-constraint`, `control-flow`, `borrow-scope`, `borrow-checker`, `host-environment`, `callable-boundary`, `adt-pattern`, `data-layout`, `numeric-semantics`, `text-semantics`, `collection-semantics`, `serialization-semantics`, `dependency-semantics`, `object-model`, and `protocol`. The parser preserves family-specific fields such as module specifiers, package conditions, binding/reference ids, memory ordering, locks, capabilities, host permissions, callable signatures, pattern exhaustiveness, ABI/layout hints, numeric/text/collection behavior, wire formats, dependency lockfile evidence, and effect adapters as authored evidence inputs. Record-level targets use explicit labels such as `effectTarget` so `role target` rows cannot be mistaken for an authored target field. These rows do not prove translation equivalence; they make the required proof surface explicit for downstream gates and admission records.

## Authored dialect registry syntax

`.frontier` files can carry reusable dialect registries with `dialectRegistry` or `universalDialectRegistry` blocks. These blocks describe language-specific constructs that should stay visible during translation instead of being silently collapsed into generic stubs.

```frontier
dialectRegistry RuntimeDialects @id("dialect_registry_runtime") {
  language javascript
  sourcePath src/runtime.ts
  dialect nodeProcess @id("dialect_registry_node_process") dialect node.runtime kind runtime name process.env target rust disposition unsupported readiness blocked loss loss_node_process_projection evidence evidence_node_runtime sourceMap sourcemap_todo_ts
  extern viteRoutes @id("dialect_registry_vite_routes") dialect vite.plugin.virtual-module externKind generatorArtifact target rust disposition runtime-required readiness needs-review evidence evidence_vite_routes_manifest bindingSymbol virtual:routes module vite
}
```

The parser projects these rows into `metadata.dialects` as a `frontier.lang.universalDialectRegistry`-shaped object. `dialect` rows become universal dialect records, `extern` rows become universal extern records, and projection fields preserve target disposition, readiness, evidence ids, loss ids, source-map ids, and binding metadata. Registry records are evidence for route scoring, not proof of equivalent behavior: authored metadata keeps `autoMergeClaim` and `semanticEquivalenceClaim` false.

## Authored possibility spaces

`.frontier` files can describe a governed space of valid implementations with `constraintSpace` or `possibilitySpace` blocks. These blocks are metadata-only: they do not add kernel nodes, but they preserve the variables, hard constraints, preferences, collapse strategies, and admission rules that let tools reason about semantic merge, translation, refactoring, and runtime projection as constraint satisfaction.

```frontier
possibilitySpace CheckoutSurface @id("space_checkout_surface") {
  subject action_checkout
  scope mod_checkout
  target react
  target swiftui
  variable surface @id("space_variable_surface") kind projection domain react|swiftui|html-css-js default react preserve identity|event-flow
  hard identity @id("space_constraint_identity") kind semantic-identity family identity subject action_checkout requires action|state|effect failClosed
  soft bundleSize @id("space_constraint_bundle_size") kind bundle-budget family runtime target react predicate "bundle < 50kb"
  preference nativeControls @id("space_preference_native_controls") kind platform-idiom target swiftui weight 0.8 reason "prefer native controls on iOS"
  collapse mobileCheckout @id("space_collapse_mobile_checkout") strategy evidence-first target swiftui requires identity|runtime-proof produces view_checkout_mobile
  admission mergeSafe @id("space_admission_merge_safe") kind semantic-merge status open requires hardConstraints|runtimeProof decision review failClosed
}
```

The parser projects these blocks into `metadata.constraintSpaces`. Hard and soft constraints remain separate from preferences: hard constraints define validity, while preferences help choose among several valid shapes. `collapse` rows describe how a tool may choose a concrete projection, and `admission` rows describe what proof is required before a generated or merged shape should be accepted.

## Authored native source evidence

`nativeSource` blocks can also carry source-bound merge evidence. This keeps parser/source-map/merge-candidate facts in `.frontier` text instead of requiring a raw JSON sidecar for the first authored program slice.

```frontier
nativeSource TodoTs @id("native_todo_ts") {
  language typescript
  parser typescript
  sourcePath src/todo.ts
  sourceHash sha256:example
  frontierNodes ent_todo, action_add
  evidence todoTitleProbe @id("artifact_todo_title_probe") kind test status passed path reports/todo-title.json
  sourceMap todoProjection @id("sourcemap_todo_ts") target typescript targetPath src/generated/todo.ts evidence artifact_todo_title_probe
  mapping todoTitle @id("map_todo_title") sourceMap sourcemap_todo_ts semanticNode field_title sourceSpan src/todo.ts:1:1-1:12 generatedSpan src/generated/todo.ts:1:1-1:20 precision exact evidence artifact_todo_title_probe
  mergeCandidate todoTitle @id("candidate_todo_title") symbol symbol:Todo.title semanticNode field_title conflictKey symbol:Todo.title readiness ready sourceMap sourcemap_todo_ts sourceMapMapping map_todo_title
}
```

The parser projects these rows into `metadata.universalAst.sourceMaps`, `metadata.universalAst.mergeCandidates`, and `metadata.universalAst.evidence`. `nativeSource` nodes keep id links through `sourceMapIds`, `mergeCandidateIds`, and `evidenceIds`. Runtime/browser equivalence still requires separate proof artifacts.

## Benchmarks

Run the package-local benchmark with:

```sh
npm run bench
```

These are Frontier-only package measurements for @shapeshift-labs/frontier-lang-parser. They exercise the package's own parser, checker, compiler, projection, CLI, fuzz, or semantic-kernel surface without making competitor comparison claims.

## License

MIT.
