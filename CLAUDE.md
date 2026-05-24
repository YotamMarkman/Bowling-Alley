# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Computer Graphics course Exercise 5: a WebGL bowling alley scene built with THREE.js (r128 via CDN). Students implement static bowling alley infrastructure (lane markings, gutters, bowling pins, bowling ball) on top of provided starter code. This is HW05 — no physics, animation, or interactive controls beyond orbit camera. Those come in HW06.

## Running the Application

```bash
node index.js
# Open http://localhost:8000 in browser
```

No build step. Express serves `index.html` at root and static files from `/src`.

## Architecture

- `index.js` — Express server (port 8000), serves static files from `/src`
- `index.html` — Loads THREE.js from CDN, then `src/hw5.js` as ES module
- `src/hw5.js` — Main scene file. All student work goes here. Sets up scene, camera, renderer, lights, shadows, orbit controls, and the `animate()` loop
- `src/OrbitControls.js` — THREE.js OrbitControls (vendored, do not modify)

THREE.js is loaded globally via CDN `<script>` tag (not imported as a module), so `THREE` is available as a global. OrbitControls is imported as an ES module from the local file.

## Code Style

- ES modules (`import`/`export`)
- 2-space indentation
- camelCase for functions (e.g., `degreesToRadians`)
- THREE.js naming conventions for objects (Scene, Camera, Mesh, etc.)
- Helper: `degrees_to_radians()` already exists in hw5.js

## Key Interactions

- Press 'O' to toggle orbit camera controls
- All 3D objects should cast/receive shadows
- Scene should be responsive to window resize

## What NOT to Implement (reserved for HW06)

Physics, ball rolling, pin collision, aiming controls, power meter, scoring system.
