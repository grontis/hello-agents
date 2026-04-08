# Engine Core: Game Loop, Time, Threading, Files, Resources

The beating heart of the engine. Get the loop and resource model right; everything else hangs off them.

## The game loop `[GEA §7.2 / p.340]`

A game loop is: read input → update simulation → render → present. The interesting decisions are *how* you update and *how* you decouple update rate from frame rate.

### Loop architectures `[GEA §7.3 / p.343]`

- **Single-threaded, fixed Hz.** Simplest. Update at the same rate you render. Fine for prototypes; struggles when frames go long.
- **Variable timestep.** `update(dt)` where `dt` is the last frame duration. Easy, but physics becomes non-deterministic and explodes at long frames.
- **Fixed timestep with accumulator (recommended default).** Sim runs at a fixed rate (e.g., 60 Hz). Each frame, accumulate real elapsed time and run as many fixed sim steps as fit. Render once per frame, interpolating between the last two sim states. Deterministic, stable, smooth. `[GEA §7.5 / p.348]`
- **Decoupled multithreaded.** Render thread and sim thread run in lockstep but in parallel; render uses last frame's sim output. Doubles latency by one frame, doubles throughput.

### The fixed-timestep accumulator pattern

```
const float DT = 1.0f / 60.0f;
float accumulator = 0;
State previous, current;

while (running) {
    float frameTime = clock.tick();          // real elapsed
    if (frameTime > 0.25f) frameTime = 0.25f; // spiral-of-death cap
    accumulator += frameTime;

    while (accumulator >= DT) {
        previous = current;
        simulate(current, DT);
        accumulator -= DT;
    }

    float alpha = accumulator / DT;
    State renderState = lerp(previous, current, alpha);
    render(renderState);
}
```

This is the default. Memorize it. `[GEA §7.5 / p.358]`

### Anti-patterns

- **Variable `dt` passed into physics.** Determinism gone, replays broken, multiplayer impossible.
- **Spiral of death.** When sim takes longer than `DT`, accumulator grows, you do more sim, it takes longer, repeat. Always cap `frameTime`.
- **Rendering inside the simulate step.** Sim and render must be separable.
- **Sleeping for "the rest of the frame" to hit a target FPS without measuring.** Use the OS timer; budget against it.

## Time `[GEA §7.5 / p.348]`

- **Real time clock** — wall clock, advances regardless.
- **Game time clock** — scaleable, pausable, what gameplay reads.
- **Animation clock** — usually game time, sometimes its own scale.
- **Profiling clock** — high-resolution, never paused.

Have multiple clock objects, not one global "time." Pause/slow-mo means scaling game time without touching real time. `[GEA §7.4 / p.346]`

## Threading and the job system `[GEA §7.6 / p.361]`

Modern engines run on a **job system**, not a fixed set of named threads. You have N worker threads (N ≈ hardware cores - 1), and you submit small units of work (jobs) that the scheduler distributes.

### Decisions

- **Job system vs explicit threads.** Job system. Always. Explicit threads (a "physics thread", an "audio thread") underutilize cores and create rigid coupling.
- **Job granularity.** Aim for hundreds of microseconds to a few ms per job. Smaller → scheduling overhead dominates. Larger → load imbalance.
- **Synchronization.** Prefer fork-join (kick a batch of jobs, wait on the batch) over fine-grained mutexes. Lock-free is for experts on data structures that demand it; do not default to it.
- **Main thread is special.** Some APIs (HID on most platforms, GL contexts, certain OS calls) must run on the main thread. Document which.

### Anti-patterns

- **Mutexes in hot loops.** Restructure to avoid sharing instead.
- **Spawning OS threads at runtime.** Pre-allocate the worker pool at startup.
- **Assuming job order.** Jobs in a batch may run in any order. If you need order, that's a dependency edge in the graph, not a hope.

## File system `[GEA §6.1 / p.298]`

Wrap the platform file API. The engine never calls `fopen` directly.

Requirements:
- Async I/O (issue read, get callback or check status). Blocking I/O on the main thread is a frame-time bug waiting to happen.
- Path abstraction — `engine://textures/foo.dds` resolves to whatever real path on whatever platform.
- Bundles/packfiles for shipping (one big file > thousands of tiny ones; better seek behavior, smaller patch deltas).

## Resource manager `[GEA §6.2 / p.308]`

The single source of truth for all loaded assets. The most important rule: **one copy of each asset in memory, ever.**

### Core responsibilities

- **Lookup by ID** (StringId of the asset path is the natural key).
- **Reference counting** so assets unload when nothing uses them.
- **Async loading** that doesn't stall the frame.
- **Streaming** — load chunks of the world as the player moves, unload distant ones.
- **Hot reload** in development — re-cook and re-load when the source asset changes.
- **Type-specific loaders** registered at startup (texture loader, mesh loader, anim loader, etc.).

### Interface sketch

```
ResourceHandle<Texture> tex = resources.Load<Texture>("env/grass_diffuse");
// returns immediately; tex.IsReady() goes true when loaded
// tex auto-unloads when last handle drops
```

### Anti-patterns

- **Loading by file path string everywhere.** Hash to a `ResourceId` once.
- **Synchronous load on the game thread mid-level.** Causes hitches. Stream or preload.
- **Loaders that parse source formats (PNG, FBX, WAV) at runtime.** All assets are cooked to engine-native binary by the asset pipeline. Runtime loaders just `memcpy` or page in.
- **No reference counting.** Either you leak memory or you free assets that other systems still hold.

## Asset pipeline `[GEA §1.7 / p.54]`

Tools program (offline) reads source files (.fbx, .png, .wav) and produces runtime-ready binary blobs. Runtime never sees source formats.

Pipeline must:
- Be **deterministic** (same input → same output). Required for caching and version control.
- Be **incremental** (only re-cook what changed).
- Produce **versioned** binaries so loaders can detect mismatch.
- Be **scriptable from CLI** (CI builds it, not just artists clicking buttons).

Build this *early*. The pain of retrofitting an asset pipeline onto a year-old engine is enormous.

## HID (input) `[GEA §8 / p.381]`

- Poll devices each frame, buffer events for multi-press detection.
- Abstract physical devices behind a logical input layer (`InputAction::Jump` not `Key::Space`). Allows remapping, multiple devices, replay.
- Dead zones on analog sticks. Always.
- Time-stamp events so you can do "press within last 100ms" buffering.

## Quick decisions

| Question | Default |
|---|---|
| Loop architecture? | Fixed-timestep accumulator with render interpolation |
| Sim Hz? | 60 Hz (30 if CPU-bound, 120 for fast-twitch) |
| Threading model? | Job system, one worker per hardware thread minus main |
| File I/O? | Async, wrapped, path-abstracted |
| Resource identity? | Hashed `ResourceId`, ref-counted |
| Asset loading at runtime? | Cooked binary only, never source formats |
| Hot reload? | Yes, in dev builds, gated behind a flag |
