# Tooling, Debugging, and the Asset Pipeline `[GEA §2, §9 / p.63, p.411]`

The tools you build for *yourself* during engine development are as important as the engine. Skipping them feels faster on day 1 and is dramatically slower by day 30.

## Logging `[GEA §9.1 / p.411]`

Required from day one. Not `printf`. A real logger with:

- **Channels** — `LOG_RENDER`, `LOG_PHYSICS`, `LOG_AI`. Filter at runtime.
- **Levels** — `TRACE`, `INFO`, `WARN`, `ERROR`, `FATAL`. Filter at runtime.
- **Sinks** — console, file, in-game overlay, remote (network) sink for connected debug tools.
- **Cheap when off** — disabled levels should compile to nothing or branch out in ~one cycle. Don't format the string if you're not going to log it.
- **Thread-safe** — the audio thread, render thread, and game thread will all log.

## Asserts `[GEA §3.3 / p.144]`

Three assert macros, used distinctly:

- `ASSERT(cond)` — debug builds only, removed in shipping. For invariants you're confident about. Crashes hard with file/line/message.
- `VERIFY(cond)` — like assert, but the expression always evaluates (so `VERIFY(InitFoo())` works). Useful for return values.
- `CHECK(cond)` — present in *all* builds. For invariants whose violation must never silently corrupt state. Use sparingly.

Assert messages should print enough to diagnose without a debugger: variable values, not just the expression text.

## Debug drawing `[GEA §9.2 / p.416]`

A drawing API gameplay can call from anywhere to render lines, spheres, capsules, text, axis triads — without touching the renderer directly.

```
DebugDraw::Line(a, b, color, durationSeconds = 0);
DebugDraw::Sphere(center, radius, color);
DebugDraw::Text3D(position, "hp=%d", hp);
DebugDraw::AABB(aabb, color);
```

Implementation: gameplay calls append to a queue (per-frame, double-buffered). The renderer drains and draws the queue at the end of the frame. Lifetime > 0 keeps the primitive alive across frames.

This is the single most useful debugging tool you will build. Build it early.

## In-game console and menus `[GEA §9.3–9.4 / p.423–426]`

A drop-down console for typing commands at runtime: spawn things, teleport, toggle flags, dump state. Tied to a registry of commands and CVars (named runtime variables). Dear ImGui makes the menu/HUD/inspector side trivial in C++ — use it for engine dev tools, do not ship it as the player UI.

## Profiling `[GEA §9.8 / p.429]`

Two layers:

1. **External profilers** — Tracy, Superluminal, RenderDoc, RGP, PIX, Nsight. Use them. They're vastly better than anything you'll build.
2. **In-engine profiler** — lightweight scoped timers with named blocks, an in-game flame graph. Always-on counters for frame time, draw calls, triangles, voices, allocated memory per subsystem.

The scoped timer macro is a one-liner that pushes a sample on enter and pops on exit:

```cpp
{
    PROFILE_SCOPE("PhysicsStep");
    physics.Step(dt);
}
```

Hook this to Tracy with one `#define`; you get full timeline visualization for free.

## Memory tracking `[GEA §9.9 / p.436]`

Per-subsystem memory counters tied to per-subsystem allocators. Display them in a debug overlay. When a subsystem exceeds its budget, log a warning. When something leaks, you can see *which* subsystem grew.

## Hot reload

What to hot-reload, in order of payoff:

1. **Shaders** — easiest, highest payoff. File watcher recompiles on save.
2. **Textures, meshes, audio clips** — through the resource manager. The pipeline re-cooks, the manager re-loads in place.
3. **Scripts** — Lua reloads naturally. C# (Mono) and Rust crates are harder.
4. **C++ code** — possible (Live++, RemedyBG), nontrivial. Worth it on big projects.

Don't reload everything, but pick the iteration loops that hurt and shorten them.

## Asset pipeline `[GEA §1.7 / p.54]`

Already covered in `engine-core.md`, but the tooling angle:

- **Single command-line tool** that conditions assets. Same tool runs in CI, on the dev's laptop, and on the build farm.
- **Dependency tracking** — touching a texture re-cooks materials that reference it; touching a shader re-cooks pipelines.
- **Determinism** — same source + same tool version = same output bytes. Required for caching.
- **Version embedded in cooked output** — runtime loaders refuse mismatched versions with a clear error, not a crash.
- **Separation of "what changed" from "what to rebuild"** — file mtimes are not enough; hash content.

## Editor

The world editor is the largest single tool you'll build. For a learning engine, you can put this off for a long time by editing levels as text/JSON files. For anything bigger, the editor becomes its own application that loads the engine as a library and adds:

- Scene graph view
- Property inspector
- Asset browser
- Viewport with gizmos for translate/rotate/scale
- Play-in-editor

`[GEA §14.4 / p.857]`

Default: build the editor on top of Dear ImGui as a Phase 2 effort. Don't write a custom UI framework.

## Crash handling

In shipping builds, a crash should:

- Capture a minidump
- Capture the recent log buffer
- Capture the last few frames of profiler data
- Write all of it to a known location
- Optionally, upload to a crash service (Sentry, Backtrace, Bugsnag)

Set this up before you have crashes you can't reproduce.

## Anti-patterns

- **`printf` debugging.** Build the logger.
- **Recompiling the whole engine to tweak a value.** Use a CVar.
- **Tools as GUI-only.** If you can't run it from the command line, CI can't run it.
- **No way to inspect game state at runtime.** Build the inspector.
- **Profiling only after a frame budget is missed.** Profile continuously; show frame time on screen always.
- **Optimizing without measuring.** Profile, change one thing, profile again.

## Quick decisions

| Question | Default |
|---|---|
| Logger? | Channels + levels + sinks, cheap-when-off, thread-safe |
| Asserts? | Three macros: `ASSERT`, `VERIFY`, `CHECK` |
| Debug draw? | Queue-based, lifetime-aware, drawn by renderer at end of frame |
| In-engine UI? | Dear ImGui for dev tools |
| Profiler? | Tracy + scoped-timer macros |
| Memory tracking? | Per-subsystem allocators with budgets and warnings |
| Hot reload priorities? | Shaders → assets → scripts → (maybe) C++ |
| Editor? | Phase 2, built on ImGui, engine-as-library |
| Crash handling? | Minidump + log + profiler trace, set up early |
