# Animation `[GEA §11 / p.543]`

The animation system turns authored data into per-frame skeletal poses that the renderer skins onto meshes. It is one of the more layered subsystems — keep the layers separate.

## Layered architecture

```
Action State Machine        (gameplay says "play jump")
        │
        ▼
Blend Tree / Network        (combines clips, transitions)
        │
        ▼
Clip Sampler                (evaluates an animation clip at time t)
        │
        ▼
Pose                        (per-bone local transforms)
        │
        ▼
Local→Model→World transforms (build matrix palette)
        │
        ▼
Skinning (GPU)              (apply palette to mesh vertices)
```
`[GEA §11.9 / p.604]`

Each layer should be independently testable. Gameplay only talks to the top.

## Core data types `[GEA §11.2-11.4 / p.548-556]`

- **Skeleton** — array of joints, each with a parent index and a bind pose. Sorted parents-before-children so a single linear pass builds world transforms.
- **Pose** — for one skeleton at one moment, an array of `Transform` (local to parent). Three flavors: bind pose, local pose, global/model pose.
- **Clip** — an animation: per-joint tracks of (translation, rotation, scale) sampled over time, plus events.
- **Skinning matrices / matrix palette** — what the GPU consumes: one matrix per joint, in model space, ready to multiply vertices.

**Joint count budget**: typical character ~50–150 joints. Each joint costs CPU sampling time and GPU palette memory.

## Sampling a clip `[GEA §11.4 / p.556]`

- Find the two keyframes around the current time per track.
- Linear interpolate translation/scale.
- **Slerp** rotations (or nlerp + normalize for speed). Never lerp quaternions component-wise without renormalizing.
- Compression matters: raw 60Hz keys for a 50-joint character at 30s = megabytes. Use curve fitting, key reduction, or quantization. `[GEA §11.8 / p.597]`

## Blending `[GEA §11.6 / p.575]`

Blending combines two or more poses. The fundamental operation is per-joint:

```
out.translation = lerp(a.t, b.t, alpha);
out.rotation    = slerp(a.r, b.r, alpha);
out.scale       = lerp(a.s, b.s, alpha);
```

Higher-level patterns:
- **Cross-fade** — smoothly transition between clips.
- **Additive blending** — layer a "delta" pose on top of a base (e.g., breathing on top of idle, aim offset on top of locomotion). Additive clips are authored as deltas from a reference pose.
- **Partial blending / masking** — apply a clip only to certain joints (upper body shoots while lower body runs).
- **Blend trees** — directed graph of blends parameterized by gameplay variables (speed, direction). Locomotion is the canonical use case.

## State machines `[GEA §11.11 / p.621]`

The action state machine (ASM) is what gameplay drives. States contain blend trees or clips; transitions have conditions and durations.

Decisions:
- **Hierarchical state machines** scale better than flat ones for complex characters.
- **Transitions are first-class data**, not code branches. They have duration, blend curve, and target state.
- **Events on clips** (footstep, weapon-fire, hit-frame) fire as the clip's playhead crosses the event's time. The animation system *publishes* events; gameplay subscribes. Don't let gameplay poll the animation playhead.

## IK (inverse kinematics) `[GEA §11.7 / p.594]`

Run after the regular animation pass, before final matrix palette generation.

- **Two-bone IK** — solve a single joint chain (foot, hand). Analytic, fast. Default for limbs.
- **CCD / FABRIK** — iterative, handles longer chains. Use for tails, tentacles, lookat chains.
- **Foot IK** — raycast down from the foot's animated position to the ground; offset the foot to the hit; bend the leg with two-bone IK to reach. Prevents foot-sliding and floating on uneven terrain.

## Skinning `[GEA §11.5 / p.570]`

Default: linear blend skinning (LBS) on the GPU. Each vertex has up to 4 (joint index, weight) pairs and is transformed by `sum(weight_i * matrix_palette[joint_i])`. Dual-quaternion skinning fixes LBS's volume loss in extreme bends but costs more.

The CPU's job is just to update the matrix palette each frame and hand it to the GPU as a uniform buffer or storage buffer.

## Animation pipeline `[GEA §11.10 / p.605]`

Animators export from DCC tools (Maya/Blender) → asset pipeline cooks to engine clip format with key reduction → resource manager loads at runtime. Same rules as all assets: source formats never touch the runtime.

## Anti-patterns

- **Lerping quaternions component-wise.** Use slerp or nlerp+normalize.
- **Letting gameplay code touch joint matrices directly.** Gameplay sets ASM parameters; the animation system decides poses.
- **Per-frame allocation for poses.** Pose buffers are pool/scratch allocated.
- **Updating animation in update order before physics, then physics overwriting transforms.** Decide once: who owns the root motion, who owns the transform after IK, in what order.
- **Foot sliding because animation rate ≠ movement rate.** Drive movement from root motion in the clip, or scale the playback rate to match speed.
- **Re-cooking entire animation library when one clip changes.** Cook per asset.

## Quick decisions

| Question | Default |
|---|---|
| Skinning method? | Linear blend, GPU, 4 weights/vertex |
| Joint count target? | 50–150 per character |
| Pose representation? | Local TRS (translation + quat + scale per joint) |
| Blending primitive? | Per-joint lerp (T,S) + slerp (R) |
| Locomotion structure? | Blend tree parameterized by speed + direction |
| State management? | Hierarchical state machine with data-driven transitions |
| Limb IK? | Two-bone analytic |
| Foot IK? | Raycast + two-bone, applied post-anim, pre-skinning |
| Clip events? | Published from animation, subscribed by gameplay |
