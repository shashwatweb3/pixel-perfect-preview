# OFFSTAGE third-party asset record

All third-party models used by the /world route are stored locally under
public/assets/offstage/kenney/. The original pack license text is copied next
to each selected asset.

## Animated player character

- **Source:** [Kenney — Animated Characters Protagonists](https://kenney.nl/assets/animated-characters-protagonists)
- **Publisher:** Kenney
- **License:** Creative Commons CC0 1.0 Universal
- **Downloaded:** 2026-11-13
- **Files used:** characterMedium.fbx, idle.fbx, run.fbx, and the three
  selected character skin PNG files.
- **Local license:** public/assets/offstage/kenney/character/LICENSE-Kenney-Animated-Characters.txt
- **Integration:** the authored FBX rig is loaded once through Three.js's
  FBXLoader, cloned per player, and uses the pack's idle/run clips. The pack
  has no walk clip, so OFFSTAGE supplies its own skeletal walk cycle targeting
  the rig's arms, legs, and hips; the run clip is used only for sprinting.

## Vara Builders Hub building

- **Source:** [Kenney — City Kit (Suburban)](https://kenney.nl/assets/city-kit-suburban)
- **Publisher:** Kenney
- **License:** Creative Commons CC0 1.0 Universal
- **Downloaded:** 2026-11-13
- **Files used:** building-type-d.glb and its referenced
  Textures/colormap.png.
- **Local license:** public/assets/offstage/kenney/builders-hub/LICENSE-Kenney-City-Kit-Suburban.txt
- **Integration:** the model replaces only the visual mesh for Vara Builders
  Hub. Its shared collision volume uses the measured scaled GLB bounds
  (7.04 × 4.96 × 4.12 world units), and remains authoritative for local
  movement and Colyseus position validation.

CC0 does not require attribution, but this record and the in-package license
files are retained for provenance.
