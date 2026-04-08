# Audio `[GEA §13 / p.743]`

Audio is often deferred and underestimated. The architectural decisions are simpler than rendering, but the integration with gameplay is just as important.

## First question: build or middleware?

**Default: middleware.** FMOD Studio and Wwise are the industry standards. They handle DSP, mixing, 3D spatialization, format decoding, platform backends, and ship with content-creation tools that audio designers actually want to use. Rolling your own audio system is reasonable only for a learning engine or a 2D game with simple needs.

If rolling your own: at minimum you need a low-level mixer that pulls from voices, applies per-voice gain and pan, sums to a master bus, and pushes to the platform output (XAudio2, CoreAudio, ALSA, WASAPI, or via a portable layer like miniaudio / SoLoud / SDL_mixer).

## Architecture `[GEA §13.5 / p.806]`

```
Gameplay
   │ "play SFX 'footstep_grass' at position P"
   ▼
Sound Event System          (banks, events, parameters)
   │
   ▼
Voice Manager               (allocates voices, virtualization, priority)
   │
   ▼
DSP Graph / Mixer           (sources → effects → buses → master)
   │
   ▼
Platform Audio Output       (XAudio2 / CoreAudio / ALSA / etc)
```

Gameplay never names a file or a voice. It triggers a *sound event* by ID; the audio system decides what to play, where, with which variations.

## Voice management

You have a finite number of hardware/software voices (typically 32–256 active at once). The voice manager decides:

- **Priority** — important sounds (player gunshot) preempt unimportant ones (distant footsteps).
- **Virtualization** — sounds beyond the voice budget keep simulated time/state but don't actually mix; they pop back in if a voice frees up and they're still relevant.
- **Distance culling** — sounds beyond audible range don't allocate voices at all.

## 3D audio `[GEA §13.4 / p.786]`

Each 3D sound has a position, velocity (for Doppler), and an attenuation curve. The system computes:

- **Distance attenuation** — gain falls off with distance (typically inverse-square clamped to a min/max).
- **Panning** — based on direction relative to the listener. For headphones, HRTF gives convincing 3D placement.
- **Doppler** — pitch shift from relative velocity. Subtle but adds a lot.
- **Occlusion / obstruction** — geometry between source and listener attenuates and low-pass filters the sound. Cheap version: raycast, apply a filter if blocked. Expensive version: pathfinding through portals.
- **Reverb zones** — the listener's current zone determines reverb wet level.

## DSP graph

A directed graph of audio nodes: sources → effects → buses → master out. Sources feed sound buses (SFX bus, music bus, voice bus); buses feed sub-mixes; sub-mixes feed master. Allows global volume control, ducking (lower music when dialogue plays), and shared effect processing.

This is exactly what FMOD/Wwise build their tools around — buses, snapshots, and parameter automation. Don't reinvent unless you must.

## Gameplay integration

- **Sound events are data**, authored in the audio tool (or a JSON if you're DIY), with parameters (e.g., `surface_type`, `intensity`).
- **Game code calls `Audio::PostEvent("player_jump", entity)`**. The event picks the right variation, attaches to the entity for position/velocity tracking, applies the right bus, and handles the lifetime.
- **Real-time parameters** drive event behavior — engine RPM modulates a vehicle loop, health affects heartbeat. Set parameters from gameplay; the audio event responds.
- **3D events** follow an entity. When the entity is destroyed, the audio system either stops the event or lets it complete (one-shots).

## Music

Two patterns:

- **Linear playback** — a track plays start to finish. Fine for menus, simple games.
- **Interactive music** — vertical (stem-based, layers fade in/out for intensity) and horizontal (segments stitch with transitions on bar/beat boundaries). Wwise and FMOD do this beautifully; rolling your own is a project.

## Streaming vs in-memory

- **Short SFX** (< 100 KB after compression): load to memory.
- **Long SFX, music, dialogue**: stream from disk, decode on the fly, double-buffer.

## Anti-patterns

- **Loading WAV/OGG at runtime via a third-party library called from gameplay.** Cook to engine-native format, route through the audio system.
- **Game code holding raw voice handles.** Use sound event instances; the audio system manages voice mapping.
- **Listener attached to nothing (or to the player camera in cutscenes that are framed elsewhere).** Keep listener attached to the active camera explicitly.
- **No bus structure.** Without buses you cannot do master volume, ducking, or mixing — and you'll add it later anyway.
- **Per-frame allocation in the audio thread.** The audio thread has a hard real-time deadline; missing it pops audibly.
- **Holding a mutex the audio thread needs in the game thread.** Use lock-free queues for cross-thread events.

## Quick decisions

| Question | Default |
|---|---|
| Build or middleware? | Middleware (FMOD/Wwise) for shipping; miniaudio/SoLoud for learning |
| Gameplay interface? | Sound event IDs + parameters, never voices |
| 3D model? | Distance attenuation + panning (HRTF for headphones) + Doppler + occlusion raycast |
| Bus structure? | Master → (SFX, Music, Voice, UI) submixes |
| Streaming threshold? | Stream > ~100 KB or duration > a few seconds |
| Listener? | Attached to active camera, updated each frame |
