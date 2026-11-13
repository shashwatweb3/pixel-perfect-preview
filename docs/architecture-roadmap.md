# VARA [OFFSTAGE] — world architecture and roadmap

## Phase 0 boundary

The existing illustrated OFFSTAGE story remains the public landing experience.
The `/world` route is a self-contained low-poly neighborhood: OFFSTAGE Square,
Vara Builders Hub, Project Labs, PASS IT ON Square, Mumbai OFFSTAGE Room, and
an Open Studio. It includes local movement, collision, proximity discovery, a
builder profile interaction, and a small Colyseus presence room. It intentionally
contains no authentication, persistence, or large map.

The original VARA [OFFSTAGE] and PASS IT ON concepts came from @adityakrx.
That attribution must remain on world and story surfaces.

## Runtime design

```text
TanStack Start
├── /              illustrated long-form origin story
├── /world         lazy, client-mounted R3F scene
│   ├── scene      static primitive plaza + simplified Rapier colliders
│   ├── player     local input, kinematic avatar, camera-follow logic
│   ├── interaction proximity target and E-key profile event
│   └── HUD         React UI that updates only on discrete state changes
├── /world net
│   ├── Colyseus typed schema client
│   ├── remote-avatar interpolation adapter
│   └── bounded-rate move sender + connection status
├── server/offstage-server.ts
│   └── offstage_plaza room with join/leave and position validation
└── future Supabase
    ├── identity + public builder profiles
    └── avatar cosmetics, projects, and PASS IT ON resources
```

Frame-loop movement, camera smoothing, and distance checks remain in refs and
R3F `useFrame`; React state is used only for HUD and profile-panel changes.

## Extension contracts

```ts
type PresencePlayer = {
  id: string;
  displayName: string;
  position: [number, number, number];
  yaw: number;
  movement: "idle" | "walk" | "run";
};

type BuilderProfile = {
  id: string;
  displayName: string;
  role: string;
  skills: string[];
  passItOn: string;
};
```

The static profile remains local. Colyseus state supplies ephemeral player
presence without rewriting the visual components or HUD.

## Delivery roadmap

1. **Phase 0 — complete:** single playable plaza, original low-poly
   primitives, controls, collisions, one builder interaction, and responsive HUD.
2. **Phase 1 — current:** Colyseus local room, typed presence state, remote
   avatar interpolation, overhead names, join/leave synchronization, online
   count, and connection/reconnect status.
3. **Phase 2 — identity and spaces:** Supabase profiles and avatar cosmetics;
   Builders Hub, Project Labs, Mumbai OFFSTAGE Room, and PASS IT ON Square as
   streamed zones; searchable builders and projects.
4. **Phase 3 — social operations:** resource sharing, introductions, help and
   opportunities; moderation, privacy controls, performance tiers, and load
   testing.

## Performance and assets

- Use only original code-generated primitives in this slice: no external 3D
  models, textures, or unrecorded licenses.
- The town uses shared façade, tree, planter, bench, and streetlight components
  with simple low-segment geometry; it adds no network-fetched art assets.
- Clamp DPR to 1.5 and use one 1024px directional shadow map.
- Keep collider geometry cuboid and hand-authored.
- Local player movement is sent at most 20 times per second; remote positions
  interpolate inside R3F's frame loop rather than causing React HUD renders.

## Local multiplayer

Run the realtime room in one terminal and Vite in another:

```bash
npm run dev:realtime
npm run dev -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/world` in two separate browsers. The HUD should
reach two builders online, each avatar should have an overhead name, and moving
either avatar should be visible in the other session. `npm run test:multiplayer`
is a deterministic two-client protocol smoke test. `npm run test:multiplayer:browser`
is the two-independent-Chromium session check.

## Validation and current limitations

- The protocol smoke passed locally: two Colyseus clients joined the same room
  and one client's movement was received by the other.
- The automated two-browser attempt launched independent Chromium processes,
  but this execution environment cannot create a WebGL context (the renderer
  reports `BindToCurrentSequence failed`). It therefore could not complete the
  visual canvas assertion here. Run the browser command on a desktop GPU/WebGL
  environment before claiming visual two-browser verification.
- This is local-room development only: no authentication, persistence,
  matchmaking, reconnect resume, rate-limit policy, or production transport is
  configured. Server-side plaza clamping is present, but movement remains
  client-position authoritative; the production follow-up should send inputs
  and simulate movement on the server.
- The `/world` route is code-split, but its current R3F/Drei/Rapier bundle is
  approximately 1.15 MB gzip. Profile and reduce it before broad release.
