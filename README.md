# Computer Graphics — Exercise 5 — WebGL Bowling Alley

A static 3D bowling alley scene built with **Three.js r160** (ES modules via
import map), WebGL, and OrbitControls. This is the **HW05 infrastructure**
stage: lane, markings, pins, ball, lighting, camera, and UI scaffolding — **no
physics, rolling, collision, or scoring** (those come in HW06).

## Group Members
- Yotam Markman (ID: 322632266)

## How to Run
1. Make sure you have Node.js installed.
2. Install dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the local web server:
   ```bash
   node index.js
   ```
4. Open your browser at **http://localhost:8000**.

> Three.js and OrbitControls load from a CDN (`unpkg.com`) via an import map,
> so an internet connection is required on first load.

## Controls
| Key | Action |
| --- | --- |
| `O` | Toggle orbit camera controls on/off |
| `1` | Bowler view (down the lane) |
| `2` | Overhead view |
| `3` | Pin-end view |
| `4` | Side view |
| `5` | Ball-rack view (inspect the colored balls) |

## Coordinate System
- Foul line at **Z = 0**; pins at **negative Z**; approach on the **+Z** side.
- Lane runs along **Z**, width along **X**, up is **+Y**.
- The playing surface (lane top) is at **Y = 0**; pin bases sit at Y = 0.

## Project Structure
```
index.html      Page shell, import map, and UI scaffolding (scorecard + controls)
style.css       UI overlay styling (non-blocking panels)
index.js        Express static server (port 8000)
src/hw5.js      The full scene: lane, markings, pins, ball, lights, camera
src/OrbitControls.js   Legacy r128 vendored controls (unused — kept for reference)
```

## Implemented Features

### Required infrastructure
- **Lane & markings** — glossy light-maple lane (~60 × 3.5, ≈17:1); white/red
  foul line across the full width at Z = 0; darker approach area (~15 long) on
  the +Z side; two rows of approach dots; seven targeting arrows embedded ~15
  units down-lane; recessed gutters both sides full length; distinct pin-deck
  surface behind the pins.
- **Ten pins** — classic profile via `THREE.LatheGeometry` (wide body, narrow
  neck, rounded crown), white with two red neck stripes, in the exact 1-2-3-4
  triangular formation specified (head pin at Z = -57).
- **Bowling ball** — radius 0.45 glossy high-shininess sphere with three finger
  holes (two adjacent + one offset thumb) as dark cylinders bored into the
  surface, resting static on the approach area.
- **Camera & lighting** — shadow-casting directional key light (4096² shadow
  map) plus hemisphere/ambient fill and a pin-deck spot; all pins and the ball
  cast and receive shadows; OrbitControls toggle with **O**; initial bowler's
  perspective looking down the lane.
- **UI scaffolding** — HTML/CSS-only 10-frame scorecard placeholder and a
  controls panel, positioned as non-blocking overlays (`pointer-events: none`).

### Bonus features
- Multiple camera presets (bowler / overhead / pin-end / side / ball-rack) on keys 1-5.
- **Ball rack** to the left of the lane: a two-tier rack holding six bowling
  balls in different colors, each seated in a cradle ring (key `5` inspects it).
- **Lane bumpers** — a slim light-grey rail raised on regularly spaced support
  columns of the same color, both sides, from the foul line nearly to the pins
  (bumper-bowling style).
- Ball-return rail alongside the lane.
- Seating bench behind the approach.
- Back masking wall behind the pins for depth.

## Known Limitations
- No physics, ball motion, pin collision, aiming, or scoring (reserved for HW06).
- Finger holes are visually embedded dark cylinders, not true CSG-subtracted
  cavities, so they read as holes only from the upper hemisphere.
- Three.js loads from a CDN; the scene will not render fully offline.

## Asset Sources
- **Three.js r160** and **OrbitControls** — https://unpkg.com/three@0.160.0/
- No external textures, models, or images are used; all geometry and materials
  are generated procedurally in code.
