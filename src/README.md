# Exercise 5 – Bowling Alley Infrastructure with THREE.js

## Overview
This exercise focuses on implementing the static infrastructure of a bowling alley scene using THREE.js. You will create the lane, pins, and bowling ball, but WITHOUT physics, animation, or interactive controls. This is the foundation for the next exercise (HW06) which will add the interactive elements.

## Tasks - HW05 INFRASTRUCTURE ONLY
1. Add lane markings and gutters:
   - Foul line (white/red line across lane width)
   - Approach dots (two rows on approach area)
   - Lane arrows/targeting arrows (~15 units from foul line)
   - Gutters on both sides (slightly recessed channels)
   - Approach area (different shade, behind foul line)

2. Create bowling pins (static):
   - 10 pins in standard triangular formation (1-2-3-4 rows)
   - Each pin with proper shape (wide body, narrow neck, rounded top)
   - White with red stripe markings
   - Pin deck area behind the pins
   - Proper spacing (~1 unit center-to-center)

3. Implement a static bowling ball:
   - Sphere with glossy material
   - Three finger holes on the surface
   - Positioned on approach area
   - Proper size relative to lane and pins
   - NO physics or movement

4. Camera and lighting infrastructure:
   - Interactive camera controls (orbit) - toggle with 'O' key
   - Appropriate lighting with shadows
   - Proper initial camera positioning (bowler's perspective)

5. Basic UI framework preparation:
   - HTML containers for future bowling scorecard display
   - HTML containers for future controls display
   - Basic CSS styling for UI elements

## Technical Requirements
- All objects should cast and receive shadows
- Use appropriate meshes and materials for each object
- The scene should be responsive when the browser window is resized
- Bowling ball and pins must remain STATIC (no physics or movement)

## IMPORTANT NOTE
**Physics-based ball rolling, pin collision mechanics, interactive controls, and the scoring system will be implemented in the next exercise (HW06). Do NOT implement these features in HW05.**

## Getting Started
- The starter code already includes:
  - Basic THREE.js setup with a scene, camera, and renderer
  - A simple lane surface (light maple wood color)
  - Lighting setup with shadows enabled
  - Orbit controls for easy scene navigation (toggle with 'o' key)

- Examine the `createBowlingLane()` function and build upon it
- Use the `degrees_to_radians()` helper function for any rotation calculations
- Add all your code to the hw5.js file

## Reference
- Standard bowling lane: ~60ft long x 3.5ft wide (41.5 inches)
- Bowling pin height: ~15 inches, max width ~4.7 inches
- Bowling ball diameter: ~8.5 inches
- Pin spacing: 12 inches center-to-center in equilateral triangle
- Use different materials for different parts (MeshBasicMaterial for markings, MeshPhongMaterial for glossy surfaces)
