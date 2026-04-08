# Collision and Physics `[GEA §12 / p.647]`

## First question: do you actually need physics? `[GEA §12.1 / p.648]`

Honestly answer:

- **Just need to know if things touch?** → Collision detection only. No rigid body dynamics. No middleware.
- **Need objects to fall, bounce, stack, push each other?** → Rigid body dynamics. Use middleware unless you have a specific reason not to.
- **Need cloth, fluid, soft body, destruction?** → Specialized systems. Probably middleware.

Writing a physics engine from scratch is a multi-year project. Most engines use a middleware (PhysX, Jolt, Bullet, Box2D for 2D) and write a thin wrapper. **Default recommendation: Jolt** for modern 3D engines (open source, modern, performant). Box2D for 2D.

## If you use middleware `[GEA §12.5 / p.722]`

The integration challenge is making the physics world and the game world stay in sync without coupling them tightly.

### Pattern

- Game object owns a `RigidBodyHandle` that points into the physics world.
- Each frame, *after* physics steps, copy transforms back from physics → game object.
- Gameplay-driven movement (player input, scripted motion) goes through the physics world (kinematic body, character controller), not direct transform writes — otherwise collision is incorrect.
- Physics callbacks (contact events, triggers) are queued and processed in gameplay update, not in the middleware's callback (which may be on a worker thread).

### Anti-patterns

- **Two sources of truth for position.** The physics body and the game object both store position and they drift. Pick one as authoritative per body type (dynamic = physics, kinematic = game, static = both, set once).
- **Calling middleware functions from arbitrary threads.** Most physics engines have specific threading rules. Read the docs.
- **Stepping physics with variable dt.** Same as gameplay sim — fixed step.
- **Mixing physics scales.** Physics engines are tuned for ~1 unit = 1 meter. A unit = 1 cm world will integrate poorly.

## If you implement collision yourself `[GEA §12.3 / p.655]`

For a learning engine or a 2D engine, hand-rolling is reasonable. The structure:

### Two phases

1. **Broad phase** — quickly find pairs of objects that *might* collide. Output is a list of candidate pairs.
2. **Narrow phase** — for each candidate pair, do exact intersection tests, compute contact points and normals.

### Broad-phase options

| Structure | When |
|---|---|
| **Sweep and prune (SAP)** | Worlds where objects don't move much frame-to-frame. Coherent. |
| **Spatial hash / grid** | Roughly uniform object distribution and size. Cheap. |
| **Dynamic AABB tree (BVH)** | General purpose, default for most middleware (Bullet, Jolt). |
| **Loose octree** | Large worlds, varied object sizes. |

Default: **dynamic AABB tree** for general use, **grid** for 2D/uniform.

### Narrow-phase shapes

Support, in order of usefulness: sphere, AABB, OBB, capsule, convex hull, triangle mesh (static only). Sphere/capsule/AABB cover ~80% of game collision.

- **Sphere–sphere**: trivial.
- **AABB–AABB**: trivial.
- **OBB–OBB**: SAT (separating axis theorem).
- **Convex–convex**: GJK + EPA.
- **Anything vs triangle mesh**: only for static geometry (terrain, level). Build a BVH over the triangles offline.

## Rigid body dynamics `[GEA §12.4 / p.684]`

If you're integrating bodies yourself:

- **Semi-implicit (symplectic) Euler** — `v += a*dt; x += v*dt`. Simple, stable enough for games. Default. **Not** explicit Euler (`x += v*dt; v += a*dt`), which is energy-unstable.
- **Constraint solver** — sequential impulse (Erin Catto's approach, used by Box2D and Bullet). Iterative, fast, good enough.
- **Penetration resolution** — split into velocity solve and position solve (Baumgarte stabilization or position-based correction).
- **Sleeping** — bodies at rest are deactivated; reactivate on contact or impulse. Critical for performance in stacked scenes.

## Character controllers

A character (player, NPC) usually does **not** use a rigid body. Use a kinematic capsule controller:

- Capsule shape, no dynamics, you set velocity directly.
- Each step, sweep the capsule, slide along contact normals, handle stairs by bumping up.
- Gravity is applied manually; ground check is a downward sweep.
- Interact with dynamic bodies via explicit forces, not collision response.

This is what shipped games do. Trying to make a player feel right with a fully dynamic body is a tarpit.

## Triggers vs solid colliders

- **Solid**: generates contacts, blocks motion.
- **Trigger**: generates overlap events, doesn't block motion. Use for pickups, zones, kill volumes.

Both go through the same broad phase; flag determines which.

## Layers and filtering

A collision filter (matrix of layer × layer → bool) prevents unnecessary tests. Players don't collide with player projectiles, NPCs don't collide with each other in crowds, etc. Set up layers early; retrofit is painful.

## Anti-patterns

- **Per-frame rebuild of broad-phase structures.** Use incremental updates.
- **One huge static mesh for all level geometry.** Chunk it for streaming and culling.
- **Floating-point comparisons without epsilon.** Always use a tolerance.
- **Ignoring continuous collision detection (CCD).** Fast small objects (bullets, balls) tunnel through walls without it. Enable CCD selectively for small fast bodies.
- **Solving constraints for too few iterations.** 4–10 iterations of sequential impulse is typical. Below that, stacks jitter.

## Quick decisions

| Question | Default |
|---|---|
| Build vs middleware? | Middleware (Jolt for 3D, Box2D for 2D) |
| Broad phase (if rolling your own)? | Dynamic AABB tree |
| Integrator? | Semi-implicit Euler |
| Character controller? | Kinematic capsule, manual gravity |
| Physics step? | Fixed, same as sim step or a multiple |
| World scale? | 1 unit = 1 meter |
| CCD? | On for small fast bodies, off otherwise |
| Sleeping? | On, with low velocity threshold |
