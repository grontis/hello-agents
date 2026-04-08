# Rendering

The largest subsystem in most engines, with the most decisions to make. Stay disciplined: the renderer's job is to turn a description of a scene into pixels, *not* to know what game objects are.

## The big architectural rule

**The renderer does not know about game objects.** Gameplay code submits *render packets* (mesh + material + transform + flags) to the renderer each frame. The renderer sorts, batches, and draws. This decoupling lets the renderer be threaded, lets you swap APIs, and prevents game code from leaking into shaders.

## Pipeline overview `[GEA §10.2 / p.489]`

Modern real-time pipeline (conceptual stages):

1. **Visibility / culling** — frustum cull, occlusion cull. Reduce the set of things to consider.
2. **Render packet generation** — for each visible object, emit `(mesh, material, transform, flags, sort_key)`.
3. **Sort** — by render pass, then by material/state to minimize state changes, then front-to-back for opaques (reduce overdraw), back-to-front for transparents (correct blending).
4. **Submit** — issue draw calls (or build a command buffer) per packet.
5. **Post-processing** — tonemap, bloom, AA, color grading. Full-screen passes that read the frame buffer.
6. **Present** — swap chain.

## API choice

| API | Use when |
|---|---|
| **Vulkan** | Cross-platform, modern, you accept the verbosity. Best long-term default for a from-scratch engine. |
| **DirectX 12** | Windows/Xbox only, similar model to Vulkan, slightly nicer tooling on Windows. |
| **Metal** | Apple platforms only. |
| **OpenGL / DX11** | Legacy. Easier to start, but you'll outgrow them and porting is hard. Acceptable for a learning engine. |
| **WebGPU** | Cross-platform including web, simpler than Vulkan, less mature. |

**For a from-scratch engine in 2026, default recommendation: WebGPU or Vulkan**, behind a thin abstraction (`RHI` — Render Hardware Interface). Never call the API directly from gameplay code.

## The RHI (Render Hardware Interface)

A thin layer that wraps the native API in engine-native types:

```
class RHI {
    BufferHandle  CreateBuffer(const BufferDesc&);
    TextureHandle CreateTexture(const TextureDesc&);
    PipelineHandle CreatePipeline(const PipelineDesc&);
    void          Submit(CommandBuffer&);
    // ...
};
```

Higher-level renderer code calls the RHI; the RHI has Vulkan/DX12/Metal backends. Keep it thin — leaky abstractions over modern APIs are worse than just exposing the API.

## Render graph (frame graph)

For anything beyond a basic forward renderer, use a **render graph**: declare the passes and their resource dependencies (this pass writes the depth buffer, this pass reads it), and let the system schedule them, allocate transient memory, and insert barriers.

Render graphs solve:
- Manual barrier/transition placement (the #1 source of Vulkan/DX12 bugs).
- Transient resource allocation — the same physical memory backs different temp targets across passes.
- Pass ordering and culling of unused passes.

If your renderer does more than 5 passes, you want a render graph.

## Forward vs deferred vs visibility buffer `[GEA §10.2 / p.489]`

| Approach | Strengths | Weaknesses | Default for |
|---|---|---|---|
| **Forward** | Simple, MSAA-friendly, transparent objects work, low memory bandwidth | Many lights × many objects = expensive | Mobile, simple scenes, VR |
| **Forward+ (clustered)** | Forward with light culling per screen tile/cluster | More complex than forward | Most modern engines, default for new work |
| **Deferred** | Decouples lighting from geometry, handles many lights well | Heavy bandwidth, MSAA hard, transparency requires a forward path | Console-style large scenes |
| **Visibility buffer** | Minimal overdraw, great for huge triangle counts | Complex, requires modern hardware features | Cutting edge (Nanite-style) |

For a from-scratch engine, **start with forward, plan for forward+**.

## Materials and shaders

A *material* is a shader + a set of parameter values. Materials should be **data**, not code — define them in a text format, cook to binary, load through the resource manager. Same shader + different params = different materials, same `Pipeline` object on the GPU.

### Decisions

- **Über-shader vs shader permutations.** Über-shaders branch on uniforms; permutations compile a separate shader for each feature combination. Permutations are faster but explode in count. Default: permutations for the major axes (skinned vs static, lit vs unlit, alpha vs opaque), über-style branching for minor toggles.
- **Shader language.** HLSL is the de facto industry standard; cross-compile to SPIR-V/MSL with DXC or `glslang`. Don't write GLSL by hand if you intend to ship anywhere but Vulkan.
- **Hot reload shaders in dev builds.** Non-negotiable for iteration speed.

## Lighting `[GEA §10.3 / p.519]`

- **Direct lighting**: physically based BRDF (Cook-Torrance / GGX). Do not invent your own model in 2026.
- **Indirect lighting**: this is where engines differ enormously.
  - Static: lightmaps (baked offline).
  - Semi-dynamic: light probes for dynamic objects in static scenes.
  - Dynamic: SSAO + screen-space reflections + (optionally) ray-traced GI for high-end.
- **Shadows**: shadow maps with cascades for directional, cube maps for point, perspective for spot. PCF or PCSS for softening.

Pick the simplest lighting model that meets the visual bar. GI is a huge undertaking; defer it.

## Culling `[GEA §10.1 / p.444]`

- **Frustum culling** — required, cheap, do this first. AABB-vs-frustum per object.
- **Occlusion culling** — only when overdraw is actually a problem. Hardware queries, software rasterization, or HZB approaches.
- **Distance culling / LOD** — switch mesh LODs by screen-space size, not raw distance.
- **Spatial partitioning** — BVH for static geometry, loose octree or grid for dynamic. Start with brute-force frustum check; partition only when profiling demands it.

## Anti-patterns

- **Game code calling graphics API directly.** Always go through the RHI / submission interface.
- **Per-frame allocation in the render thread.** Linear allocator per frame.
- **One draw call per object with unique state.** Sort by state, batch by instance buffer where possible.
- **Loading textures from PNG at runtime.** Cook to GPU-ready compressed formats (BC7, ASTC) offline.
- **Assuming the depth buffer's range / z-direction.** Reverse-Z is the modern default for better precision; pick once and stick to it.
- **Skipping the abstraction layer "to save time."** The day you port to a new platform you'll redo everything.

## Quick decisions

| Question | Default |
|---|---|
| API? | Vulkan (or WebGPU for a learning engine) |
| Architecture? | Forward+, scaling to clustered |
| Lighting model? | PBR / GGX |
| Shader source? | HLSL → DXC → SPIR-V/DXIL/MSL |
| Materials? | Data, cooked from text, parameterized |
| Pass scheduling? | Render graph once you exceed ~5 passes |
| Culling? | Frustum first, LOD second, occlusion only when needed |
| Sort key? | Pass → pipeline → material → depth |
