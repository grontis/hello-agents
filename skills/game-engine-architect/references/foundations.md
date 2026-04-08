# Foundations: Math, Memory, Containers, Strings

These are the core systems every other subsystem depends on. Get them right early — they are extremely painful to retrofit.

## Memory management `[GEA §5.2 / p.239]`

**Default rule: never call `new`/`malloc` in the per-frame hot path.** General heap allocators are slow (~hundreds of ns minimum, often more) and fragment over time. Instead, choose an allocator that matches the lifetime pattern.

### Allocator menu

| Allocator | Lifetime | Use for | Cost |
|---|---|---|---|
| **Linear / stack** | Reset every frame (or scope) | Per-frame scratch, command buffers, temporary strings | ~5 ns alloc, free is free |
| **Double-buffered linear** | 2-frame lifetime | Data produced this frame, consumed next frame (e.g., render commands) | Same as linear |
| **Pool** | Long, fixed-size objects | Particles, entities, components of one type | O(1), no fragmentation |
| **Small-block** | Many tiny varied allocs | Strings, small game data | Slightly more than pool |
| **General heap** | Anything, any lifetime | Tools, asset loading, init only | Slow + fragments. Last resort. |

**Default policy for new code:** declare which allocator the subsystem uses. If you don't know, you're using the general heap and you'll regret it.

### Anti-patterns

- **Allocating in the middle of a frame from the general heap.** Profile any subsystem doing this; replace with a linear or pool allocator.
- **One big global heap for everything.** Per-subsystem heaps make leaks attributable and let you cap memory budgets.
- **Manual `delete` everywhere with raw pointers.** Use ownership-clear smart pointers (`unique_ptr`) at boundaries, raw pointers inside performance-critical containers.
- **Forgetting alignment.** SIMD types need 16-byte alignment. Cache lines are 64 bytes. Pack hot data accordingly.

### Memory budgets

Set per-subsystem memory budgets at startup. When a subsystem exceeds its budget, *fail loudly*. Discovering a 200 MB texture leak in week 12 is much worse than blowing the budget on day 1.

## Containers `[GEA §5.3 / p.254]`

**Default to a custom dynamic array (your `Vector<T>`) and a custom hash map.** STL works but: STL allocates from the general heap by default, has poor debug performance, and bloats binary size with templates. Most engines roll their own with allocator-aware versions.

### When to use what

- **Dynamic array (`Vector<T>`)** — your default container. Cache-friendly, simple. ~90% of cases.
- **Fixed-size array** — when max count is known. Zero allocation, fully on stack/in struct.
- **Linked list** — almost never. Cache-hostile. Use only for intrusive lists where elements own their links and you need O(1) splice.
- **Hash map** — string-keyed lookups, sparse ID tables. Always pre-size. Default to open-addressing (better cache behavior than chained).
- **Sorted array + binary search** — beats a tree or hash map when reads dominate writes and N is small (< few thousand).
- **Bit array** — flags, occupancy grids, free lists.

### Anti-patterns

- **`std::map`** (red-black tree). Cache-hostile, slow. Use a hash map or sorted array.
- **`std::list`** for game data. As above.
- **Templates that take an allocator type but always default to the global one.** Make the allocator parameter mandatory at construction.

## Strings `[GEA §5.4 / p.274]`

Strings are surprisingly expensive. Most game engines have **three** distinct string types — pick one per use case, do not let them mix:

1. **Hashed string IDs** (`StringId`, sometimes called `StringHash` or interned string). 32- or 64-bit hash of the string. Comparison is one int compare. **Use for all engine-internal identifiers**: asset names, animation events, script function names, entity tags. Hash at compile time where possible (`SID("player_jump")`).
2. **Localized strings** for player-facing UI. Loaded from a localization table, never hard-coded, never concatenated.
3. **Mutable C-style strings** for tools, debug logs, file paths. Stack-allocated fixed buffers preferred over `std::string` in shipped builds.

**Anti-pattern:** using `std::string` as a map key in a hot path. Hash it once to a `StringId` and key on that.

## 3D math `[GEA §4 / p.165]`

You need: vector (2/3/4), matrix (3×3 and 4×4), quaternion, AABB, sphere, plane, ray. SIMD-aligned versions for the renderer/physics hot paths. `[GEA §4.7 / p.218]`

### Decisions

- **Row-major vs column-major.** Pick one and document it. Crossing conventions silently transposes everything. Most graphics math (and the book) is column-vector / right-multiply. DirectX historically used row-vectors. Just be consistent.
- **Handedness.** Left-handed (DirectX default) or right-handed (OpenGL/Vulkan default). Pick one engine-wide.
- **Quaternions for rotation, not Euler angles.** Euler angles have gimbal lock, interpolate badly, and compose ambiguously. Convert to/from Euler only at the editor boundary. `[GEA §4.4 / p.200]`
- **Matrices for transforms, quaternions for orientation, separate translation as a vec3.** A `Transform { vec3 position; quat rotation; vec3 scale; }` is the universal currency of engine code. Convert to a matrix only when the GPU or a math operation needs it.
- **SIMD wrapper.** Wrap intrinsics in your own `vec4` so the same code compiles on multiple platforms. Don't write raw `_mm_*` calls in subsystem code.

### Anti-patterns

- **Storing rotations as Euler angles in the runtime.** They're fine for the editor UI; convert to quat on save.
- **Mixing handedness or major-ness across subsystems.** Pick once, enforce in code review.
- **Recomputing a matrix every frame from a transform that didn't change.** Cache and dirty-flag.

## RNG `[GEA §4.8 / p.227]`

Use a fast non-cryptographic PRNG (xorshift, PCG, Mersenne Twister at most). `rand()` is bad — short period, poor distribution, often locked behind a global mutex. Seed deterministically for replay/debug.

## Configuration `[GEA §5.5 / p.290]`

Config in the runtime should be a struct loaded from a binary blob. Tools edit text (JSON/TOML/INI), the asset pipeline cooks it to binary. Runtime never parses text. Same rule as all assets.

## Quick decisions

| Question | Default |
|---|---|
| Allocator for a new per-frame system? | Linear, scoped to frame |
| Allocator for entities/components? | Pool |
| Container for a list of things? | `Vector<T>` |
| Container for ID → object? | Hash map (open-addressing), pre-sized |
| Identifier type? | `StringId` (hashed) |
| Rotation storage? | Quaternion |
| Float type? | `float` (32-bit). `double` only when needed (large worlds, physics integrators) |
| Vector type for SIMD path? | 16-byte aligned `vec4`, even if only 3 components used |
