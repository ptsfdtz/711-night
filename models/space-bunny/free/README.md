# 雨夜コンビニ — Rainy-Night Convenience Store Corner

A self-contained, freely-orbitable **miniature 3D diorama** of a Japanese
convenience store at a street corner on a rainy night, rendered in a
cel-shaded / 三渲二 anime style.

No build step, no bundler, no external assets — open `index.html` from any
static file server and it runs.

```
SpaceBunnyFree/
├─ index.html            importmap + <canvas>, nothing else
├─ styles.css
├─ vendor/
│  └─ three.module.min.js   three.js r160 (vendored, works offline)
└─ src/
   ├─ main.js            bootstrap: renderer, lights, passes, loop
   ├─ core/
   │  ├─ camera.js       orbit rig (drag / wheel / pinch, inertia, idle drift)
   │  ├─ materials.js    toon ramp, palette, self-lit + glow materials
   │  ├─ postfx.js       ink-outline + bloom + night grade
   │  ├─ reflection.js   planar mirror + wet-asphalt / wet-pavement shader
   │  ├─ textures.js     every texture, painted at runtime on a 2D canvas
   │  └─ utils.js        geometry helpers, seeded RNG
   ├─ world/
   │  ├─ layout.js       single source of truth for the footprint
   │  ├─ diorama.js      plinth, streets, sidewalk, road paint, alley, backdrop
   │  ├─ store.js        shop shell, glazing, sign, awning, door, roof
   │  ├─ interior.js     gondolas, coolers, deli, oden, checkout, coffee…
   │  └─ props.js        vending machines, bikes, bins, lamps, pole, wires…
   └─ fx/
      ├─ rain.js         GPU rain + ground-impact sprites
      ├─ drips.js        eave drips → splash rings
      ├─ glassrain.js    water running down the shop windows
      ├─ steam.js        oden steam
      └─ door.js         automatic sliding door + entry mat
```

## Running it

Any static server works (ES modules need `http://`, not `file://`):

```bash
cd SpaceBunnyFree
python -m http.server 8000
# → http://localhost:8000/
```

## Controls

There is deliberately **no UI** — the canvas is the whole interface.

| Input | Action |
| --- | --- |
| drag | orbit around the diorama |
| right-drag / shift-drag | pan the model |
| wheel / pinch | zoom (9–46 units) |
| two-finger drag | zoom + pan |

The camera eases with inertia and, until you touch it for the first time,
drifts slowly on its own like a turntable.

## How the look is achieved

**Cel shading.** Every surface uses `MeshToonMaterial` with a 4-step gradient
ramp (`core/materials.js`). Interior fixtures additionally use `toonLit()`,
which adds a small emissive floor so the shop stays the brightest thing in
frame from any angle without flooding the street with light.

**Ink lines.** A second half-resolution pass renders view-space normals into
its own render target *with its own depth attachment*. The composite pass runs
a Laplacian on that depth plus a normal-difference Sobel to produce the ink
outline. Because the line pass owns its depth, thin things that are excluded
from it — glass, rain, the overhead wires — never sprout a fat black halo.

**Wet ground.** `core/reflection.js` holds two things:

* `PlanarReflector` — renders a curated reflection layer (buildings, signs,
  lamps, neon) through a mirrored camera at 42 % resolution with a clip plane.
* the wet-surface shader — toon-banded asphalt, a world-space puddle mask,
  animated rain dimples, micro-chop distortion and a five-tap vertical smear of
  the mirror buffer. The same shader (with a paving-slab albedo) is reused for
  the wet pavement, so the neon smears run right up to the shop door.

**Grade.** Bright-pass → two separable blur octaves → composite with a soft
shoulder, split-toning, vignette and a touch of grain. Manual linear→sRGB at
the very end, since the composite is the only pass that writes to the canvas.

**Performance.** Draw calls are kept near ~2000 by instancing shelf products
and rain, excluding sub-5 cm props from the line and mirror passes, and
skipping shadow maps entirely (local light sources do the work instead).
An adaptive pixel-ratio controller scales between 0.7× and the device ratio to
hold framerate.

## Motion

Nothing ever loops in sync, so the scene never feels like an animation:

* continuous rain with wind slant and distance fade, plus impact rings
* eave drips off the awning, gutters, roof sign and vending machines
* puddle dimples and sparkle on the water surface
* the fascia / roof sign buzz and stutter like a tired transformer
* the blade sign and ceiling light boxes flicker on a slow beat
* the automatic door opens on its own every ~10 s, spilling warm light
* water runs down the shop windows in two scrolling layers
* wet zebra stripes glimmer faintly
* the far traffic signal cycles red → green → amber with a pedestrian head

## Determinism

All "random" values come from a seeded `mulberry32` RNG (`utils.js`), so the
diorama is byte-identical on every load — the kind of consistency you want
from something meant to look like a collectible model.