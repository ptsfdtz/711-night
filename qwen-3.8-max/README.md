# 雨夜のコンビニ街角 · Rainy-Night Konbini Street-Corner Diorama

A self-contained, toon-shaded (cel / "三渲二") 3D miniature diorama of a Japanese
convenience-store street corner on a rainy night. Built with **Three.js** (ES modules
from CDN). No UI — just a collectible-model scene you can freely orbit, rotate and zoom.

## Run

The scene uses ES modules, so serve the folder over HTTP (opening `index.html`
directly from `file://` is blocked by browser CORS for modules):

```bash
# any static server works, e.g.
python -m http.server 8123
#   or
npx serve .
```

Then open <http://localhost:8123/> in a modern browser (WebGL2 recommended).

## Controls

- **Drag** — orbit / rotate the model
- **Scroll / pinch** — zoom
- A very slow auto-rotate showcases the model until you first interact, then full
  manual control takes over.

## What's inside

- **Square plinth base** — the whole corner sits on one collectible display base.
- **Konbini building** — fascia sign (flickering), canopy with dripping edge,
  automatic sliding doors (open/close on a timer), big display window with rain
  running down the glass, entrance mat.
- **Rich interior** (visible through the glass): gondola shelves, drink cooler,
  bento/onigiri cases, checkout counter + register + coffee machine, oden counter,
  magazine rack, posters, ceiling light boxes, lockers + staff door, floor guidance.
- **Street corner**: vending machines, bicycle, umbrella stand, trash bins, street
  lamp, utility poles + sagging wires, road sign, guardrail, traffic light (cycling)
  + pedestrian signal, A/C outdoor units (spinning fans), notice board, alley mouth,
  parking bays, drainage gutter, zebra crossing, puddles.
- **Weather / motion**: continuous rain streaks, expanding ground ripples, canopy
  drips, wet-ground light reflections, neon flicker, low mist.

## Structure

```
index.html          importmap + canvas + vignette
src/main.js         renderer, camera, OrbitControls, bloom post, animation loop
src/environment.js  plinth, ground, roads, crossing, curbs, gutters, puddles, lights
src/store.js        building shell, façade, sign, doors, full interior
src/props.js        street furniture (vending, bike, poles, traffic light, …)
src/weather.js      rain, ripples, drips, mist
src/materials.js    toon gradient ramps, palette, procedural canvas textures
src/util.js         geometry/outline helpers, canvas-texture helpers
```

Rendering uses `MeshToonMaterial` with a discrete gradient ramp (cel shading),
inverted-hull outlines, and an `UnrealBloomPass` so neon and warm interiors glow
against the cool rainy night.
