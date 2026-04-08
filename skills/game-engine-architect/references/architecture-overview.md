# Architecture Overview

The single most important question in engine work: **where does this code go, and what is it allowed to depend on?**

## The standard layer cake

Bottom to top. A layer may depend only on layers below it.

```
┌─────────────────────────────────────────────┐
│  Game-Specific Subsystems                   │  weapons, AI, vehicles, HUD
├─────────────────────────────────────────────┤
│  Gameplay Foundation                        │  object model, world editor,
│                                             │  events, scripting, update loop
├─────────────────────────────────────────────┤
│  Front End                                  │  HUD, in-game GUI, full-motion
│                                             │  video, in-game cinematics
├─────────────────────────────────────────────┤
│  Renderer │ Animation │ Physics │ Audio │   │  the "big four" + HID
│  HID      │ Profiling │ Networking          │
├─────────────────────────────────────────────┤
│  Resources (resource manager + asset DB)    │  one source of truth per asset
├─────────────────────────────────────────────┤
│  Core Systems                               │  math, memory, containers,
│                                             │  strings, RTTI, asserts, RNG
├─────────────────────────────────────────────┤
│  Platform Independence Layer                │  thin wrapper over OS/SDKs
├─────────────────────────────────────────────┤
│  3rd-Party SDKs │ OS │ Drivers │ Hardware   │
└─────────────────────────────────────────────┘
```
`[GEA §1.6 / p.32]`

## Decision: where does this new code go?

Ask in order:

1. **Does it depend on game content (specific weapons, levels, characters)?** → Game-specific layer.
2. **Does it manipulate game objects or define their behavior generically?** → Gameplay foundation.
3. **Is it one of: rendering, animation, physics, audio, input?** → That subsystem.
4. **Does it load, manage, or reference an asset?** → Resources.
5. **Is it a generic data structure, math primitive, or memory utility?** → Core systems.
6. **Does it touch the OS, filesystem, threads, or a vendor SDK directly?** → Platform Independence Layer.

If the answer is "two of these," you're probably mixing concerns. Split it.

## Anti-patterns

- **Upward dependencies.** A "core" math library that includes a game header is broken. Caught early, this is a 5-minute fix; caught late, it's a 2-week refactor.
- **God subsystems.** A `World` class that owns rendering, physics, audio, and gameplay state. Split by concern; have a thin coordinator.
- **Singletons everywhere.** Singletons hide dependencies and break startup ordering. Prefer explicit subsystem objects passed in (or accessed via a single `Engine` context) so the dependency graph is visible. `[GEA §5.1 / p.231]`
- **Static initialization for engine state.** C++ static constructor order across translation units is undefined. Use explicit `StartUp()`/`ShutDown()`. `[GEA §5.1 / p.234]`
- **Cross-subsystem `#include` chains.** Renderer should not include physics headers. If renderer needs a physics-derived transform, physics writes to a shared transform buffer that renderer reads.

## Subsystem startup order (reference)

Forward at boot, exact reverse at shutdown:

1. Memory + core asserts
2. Logging
3. Timer / clock
4. Math (RNG seeding)
5. File system + resource manager (registers loaders only — does not load yet)
6. Job system / thread pool
7. HID
8. Renderer (creates device, swap chain)
9. Audio
10. Physics
11. Animation
12. Gameplay foundation
13. Game-specific systems

If subsystem B uses subsystem A, A must already be running. `[GEA §5.1 / p.231]`

## Communication patterns between subsystems

Choose deliberately — these are the joints where engines get tangled.

- **Direct call** (e.g., gameplay calls `Renderer::Submit(mesh)`). Simplest, fine for one-way submission from higher to lower layers.
- **Shared data buffer** (e.g., physics writes transforms, animation writes pose, renderer reads both). Best for per-frame state flowing downward.
- **Event/message bus**. Use sparingly and with a typed schema. Untyped global event buses become impossible to reason about. `[GEA §15.7 / p.933]`
- **Polling** (gameplay reads input state each frame). Fine for HID, bad for things that fire rarely.

Default: shared buffers for high-frequency data, direct calls for one-shot commands, events only when the producer genuinely doesn't know the consumer.

## Sanity checks

Before merging an architectural change, verify:

- [ ] No new upward `#include`.
- [ ] New subsystem (if any) has explicit `StartUp()`/`ShutDown()` slotted into the boot sequence.
- [ ] No new global singleton; if one was added, justified in writing.
- [ ] Hot-path data (touched every frame) does not allocate from the general heap.
- [ ] New cross-subsystem coupling uses one of the four patterns above, named explicitly.
