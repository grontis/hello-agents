# Gameplay Foundation `[GEA §14–15 / p.847–978]`

This is the layer that sits on top of the engine subsystems and defines *what a game object is*, *how the world is structured*, and *how gameplay code is organized*. It's the layer that varies most between engines and the layer most likely to be redesigned mid-project. Get it directionally right.

## The big decision: object model `[GEA §15.2 / p.873]`

Three dominant patterns. Pick deliberately.

### 1. Deep OOP inheritance — DO NOT USE

```
GameObject → Pawn → Character → Player
```

Every shipped engine that started here regretted it. Diamond problems, refactor pain, can't compose features. Mentioned only so you don't accidentally drift into it.

### 2. Component-based (composition)

A `GameObject` (or `Entity`) owns a set of `Component` objects. Components hold the data and behavior for one aspect (transform, mesh renderer, collider, audio source, AI brain). Unity, Godot, Unreal Actor/Component all use this.

- **Pros:** flexible, designer-friendly, mostly avoids inheritance hell.
- **Cons:** still heap-allocated objects with virtual calls; can be cache-hostile; "find all components of type X" is awkward without indexing.

### 3. ECS (Entity Component System)

An entity is just an ID. Components are plain data, stored in tightly packed arrays grouped by archetype. Systems are functions that iterate over components. (Bevy, Unity DOTS, EnTT, flecs.)

- **Pros:** maximum cache locality, naturally parallel, scales to enormous entity counts.
- **Cons:** higher learning curve, less obvious mapping to "an object," tooling is harder, queries can be tricky.

### Choosing

- **Small/medium engine, single-developer or small team, under ~10K active entities:** component-based. Familiar, productive, fast enough.
- **Large entity counts (RTS, simulation, bullet hell), heavy parallelism required:** ECS.
- **Learning project:** component-based first. ECS is a sharper tool but harder to wield well.

**Whichever you pick, commit.** Mixing is possible but the mental overhead is high.

## The world `[GEA §14.1 / p.848]`

The "world" is the container of all game objects currently active. Decisions:

- **Single world or multiple?** Multiple worlds (e.g., main world + UI world + cutscene world) make some things cleaner but complicate cross-world references. Default to one world unless you have a specific reason.
- **World partition / chunks** for large worlds — split the world into spatial cells, load/unload cells as the player moves. `[GEA §15.3 / p.892]`
- **Streaming** — chunks load asynchronously. Keep a buffer of cells around the player loaded, prefetch in the player's facing direction. `[GEA §15.4 / p.899]`

## Update order `[GEA §15.6 / p.916]`

The order in which systems update each frame is **architectural**, not arbitrary. A typical order:

1. Time advancement
2. Input sampling (HID)
3. Network receive
4. AI / decision-making
5. Gameplay update (player controllers, scripts, abilities)
6. Animation evaluation (state machines → poses)
7. Physics step
8. Post-physics gameplay (apply physics results to game state)
9. Animation post (IK, ragdolls)
10. Camera update
11. Audio update (positions, parameters)
12. Render submission
13. Network send

The key invariant: **a system that produces data must run before any system that consumes it**. Document the order; don't let it emerge accidentally.

### Update strategies

- **Update everything every frame.** Simple, predictable, wasteful for things that don't need it.
- **Update at multiple frequencies.** AI at 10 Hz, physics at 60 Hz, animation at 30 Hz for distant characters.
- **LOD updates.** Distant objects update less often or with simpler logic.

## Object references `[GEA §15.5 / p.909]`

How does object A refer to object B safely, when B might be destroyed?

- **Raw pointers** — fast, dangerous. Dangling pointers are crashes. Don't.
- **Handles** (ID + generation counter) — looking up returns null if the object was destroyed and the slot reused. Default for almost all references.
- **Smart pointers / shared ownership** — sometimes appropriate, but shared ownership of game objects often hides lifetime bugs.

A handle table is one of the first utilities to build. `Handle<Entity>` resolves through the entity manager; if the generation doesn't match, the entity is gone.

## Events and messaging `[GEA §15.7 / p.933]`

Three kinds of inter-object communication:

1. **Direct call.** A holds a handle to B and calls a method. Use when A genuinely knows about B.
2. **Typed events.** Publish/subscribe with strongly typed event structs. `Bus<DamageEvent>::Publish(...)`. Use when one producer has many unknown consumers.
3. **Tagged components / queries.** "Find all entities with `Health` and `OnFire`" — natural in ECS, awkward elsewhere.

**Avoid** untyped global event buses (`SendEvent("anything", payload)`). They become impossible to debug.

## Scripting `[GEA §15.8 / p.954]`

A scripting language lets designers and gameplay programmers iterate without recompiling C++. Decisions:

| Approach | Use when |
|---|---|
| **Embedded language** (Lua, Wren, AngelScript) | Hot-reload important, designers writing scripts, fast iteration |
| **Visual scripting** (Blueprint-style) | Non-programmers author behavior |
| **Code-only, all in C++** | Small team of programmers, willing to pay the recompile cost |
| **Domain-specific language** | Specific need, large team, willing to invest |

Default: **Lua** for embedded scripting. Mature, fast, easy to bind, well-known. Bind it to your gameplay layer, not to the engine internals.

### Anti-patterns

- **Exposing every C++ function to scripts.** Bind a curated, stable API; the binding is your contract.
- **Calling script from per-frame hot loops.** Script is for high-level logic, not per-vertex math.
- **Letting scripts allocate freely from the C heap.** Use a script-local allocator with a budget.

## Save and load

Two strategies:
- **State capture** — serialize all game object state. Flexible but slow and version-fragile.
- **Mission-restart with checkpoints** — save a small set of checkpoint variables; restart the level from that checkpoint with those vars set. Much simpler, used by many shipped games.

For a learning engine, checkpoints are dramatically easier.

## Anti-patterns

- **God components** that own logic from many concerns. Split.
- **Hidden coupling via singletons.** Pass dependencies explicitly.
- **Update functions that randomly read/write any object.** Define ownership: each system owns the writes to its components.
- **Branching deep into engine subsystems from gameplay.** If gameplay finds itself manipulating the renderer's command buffer, the abstraction is wrong.
- **No clear distinction between "static level data" and "dynamic game state."** One streams from disk and never mutates; the other mutates and goes in saves. They have different lifetimes.

## Quick decisions

| Question | Default |
|---|---|
| Object model? | Component-based (ECS if you have a reason) |
| Reference type? | `Handle<T>` with generation counter |
| Update order? | Fixed, documented, producers before consumers |
| Communication? | Direct call when known, typed events when not |
| Scripting language? | Lua, embedded, bound to a curated API |
| Save model? | Checkpoint variables for early dev; full state capture only when needed |
| World streaming? | Chunked cells, async loaded, with a buffer around the player |
