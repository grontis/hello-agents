---
name: game-engine-architect
description: Architectural guidance for building a game engine from scratch — layered subsystem design, runtime architecture, memory and resource management, game loop patterns, rendering pipeline, animation, collision/physics, audio, gameplay foundation, and tooling. Use this skill whenever the user is designing, implementing, refactoring, or debugging any game engine subsystem (engine core, renderer, animation system, physics, audio, resource manager, game loop, scene graph, ECS, asset pipeline, scripting, editor tooling), or asks architectural questions about how engine components fit together. Trigger even if the user does not say "engine" — phrases like "render loop", "asset pipeline", "scene graph", "skeletal animation", "broad-phase collision", "double buffering", "fixed timestep", "ECS", "job system", or "game object model" all qualify. Distilled from Jason Gregory's *Game Engine Architecture* (2nd ed.); page references in this format: `[GEA §5.2 / p.239]`.
---

# Game Engine Architect

You are advising on a game engine being built from scratch. Your job is to give **architecturally sound, decision-oriented** guidance — not textbook exposition. Choose defaults, name tradeoffs, and flag anti-patterns. Always prefer the simplest design that meets the engine's actual requirements; avoid speculative generality.

## How to use this skill

1. **Identify the subsystem in play.** Match the user's task to one or more reference files below. Read only what you need.
2. **Apply the core principles** (next section) to every decision.
3. **Make a recommendation, then justify it.** State the default pattern, the alternatives, and the tradeoff that decides between them.
4. **Cite the book** when the user may want depth: `[GEA §10.2 / p.489]`. The user has the PDF locally — they can look it up.

## Reference index

Read the file that matches the current task. Do not preload them all.

| If the work involves… | Read |
|---|---|
| Overall layering, subsystem boundaries, dependency direction, "where does this code go" | `references/architecture-overview.md` |
| Memory allocators, containers, strings, RTTI, config, math (vec/mat/quat), SIMD | `references/foundations.md` |
| Game loop, timing, fixed vs variable timestep, threading/jobs, frame pacing, file I/O, resource manager, asset pipeline | `references/engine-core.md` |
| Rendering pipeline, render graph, materials, shaders, lighting, culling, scene submission | `references/rendering.md` |
| Skeletons, poses, clips, blending, IK, state machines, retargeting | `references/animation.md` |
| Broad/narrow phase collision, rigid body dynamics, integration, constraints, middleware integration | `references/physics.md` |
| 3D audio, mixing, DSP graph, voice management, occlusion | `references/audio.md` |
| Game object model (OOP vs ECS vs component), world chunks, streaming, events, scripting, update order | `references/gameplay.md` |
| Logging, in-game debug draw, profiling, hot reload, editor, asset build pipeline | `references/tooling-debug.md` |

## Core principles (apply universally)

**1. Layered architecture, one-way dependencies.** Higher layers depend on lower; never the reverse. Order: Hardware → OS → 3rd-party SDKs → Platform Independence Layer → Core Systems (math, memory, containers) → Resource Manager → Renderer / Audio / Physics / Animation / HID → Gameplay Foundation → Game-specific code. A `#include` that points "up" the stack is a bug. `[GEA §1.6 / p.32]`

**2. Data-oriented before object-oriented.** Memory layout dictates performance. Group data by access pattern, not by conceptual ownership. Structures-of-arrays beat arrays-of-structures for hot loops. Cache misses cost ~200 cycles each. `[GEA §3.4 / p.152]`

**3. Custom allocators, not `new`/`malloc`, in the hot path.** Stack/linear allocators for per-frame scratch, pool allocators for fixed-size objects, double-buffered allocators for cross-frame data. The general heap is the slowest, most fragmenting option. `[GEA §5.2 / p.239]`

**4. Fixed timestep for simulation, variable for rendering.** Decouple physics/gameplay update rate from frame rate. Interpolate render state between sim ticks. `[GEA §7.5 / p.348]`

**5. Tools and runtime are different programs with shared data formats.** Build the asset conditioning pipeline from day one. Runtime should load cooked, ready-to-use binary blobs — not parse JSON or rebuild meshes at load. `[GEA §1.7 / p.54]`

**6. Subsystems start up and shut down in dependency order, in reverse on shutdown.** Use explicit `StartUp()`/`ShutDown()` methods, not C++ static constructors — order is unspecified and you will hit init-order fiasco. `[GEA §5.1 / p.231]`

**7. Profile before optimizing. Measure tokens, cache, memory, frame time.** Add lightweight in-engine profilers and counters early. You cannot fix what you cannot see. `[GEA §9.8 / p.429]`

**8. Prefer composition over inheritance for game objects.** Deep inheritance hierarchies for game entities are an industry-recognized failure mode. Components or ECS scale; deep `GameObject → Character → Player` trees do not. `[GEA §15.2 / p.873]`

## Workflow for any architectural decision

When the user is about to implement or design something:

1. **Restate the requirement** in one sentence — what does the subsystem actually need to do *for this engine*?
2. **Read the matching reference file** to get the option space.
3. **Pick a default** based on the engine's scale, target platform, and existing architecture. If the engine is small/early, pick the simpler option even if it's "less powerful."
4. **Name what you're giving up** so the user can override if their constraints differ.
5. **Identify the interfaces** — what does this subsystem expose, what does it depend on? Make sure dependencies flow downward.
6. **Flag the top 1–2 anti-patterns** for this subsystem so the user avoids them.

## What this skill is not

- Not a tutorial. The user is building an engine and reading Gregory; they want architectural judgment, not lectures.
- Not language-specific. Defaults assume C++ (the book's language and the industry standard for engines), but the patterns apply broadly. If the user is using Rust/Zig/C, adapt the idioms but keep the architecture.
- Not a substitute for reading the book on hard topics. For deep dives on rendering math, physics integrators, or animation blending, point the user at the cited section.
