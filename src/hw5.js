// ============================================================================
//  HW05 — Static 3D Bowling Alley (infrastructure only)
//  Three.js r160 (>= r150) via import map, WebGL renderer, OrbitControls.
//
//  Coordinate system (right-handed):
//    • Foul line at Z = 0
//    • Pins at negative Z (down the lane)
//    • Lane runs along Z, width along X, up is +Y
//    • Approach area is on the +Z side of the foul line (where the bowler stands)
//
//  This file builds ONLY static infrastructure: lane + markings, gutters,
//  ten pins, one ball, lights/shadows, camera + orbit controls, camera
//  presets. No physics, rolling, collision, aiming, or scoring (those are HW06).
// ============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ----------------------------------------------------------------------------
//  Scene constants — single source of truth for all dimensions.
// ----------------------------------------------------------------------------
const LANE_LENGTH    = 60;                 // foul line (Z=0) to pin end (Z=-60)
const LANE_WIDTH     = 3.5;                // ~17:1 length:width ratio
const LANE_HALF_W    = LANE_WIDTH / 2;     // 1.75
const LANE_THICKNESS = 0.3;                // slab depth in Y
const SURFACE_Y      = 0;                  // world Y of the playing surface (lane top)

const APPROACH_LENGTH = 15;                // run-up area on +Z side of foul line

const GUTTER_WIDTH = 0.6;                  // channel width on each side
const GUTTER_DROP  = 0.12;                 // how far gutter top sits below lane top

const PIN_HEIGHT = 1.25;                   // classic regulation-scaled pin height
const BALL_RADIUS = 0.45;                  // ~8.5" diameter scaled to lane

// Standard 1-2-3-4 triangular formation. Y = 0 base (sits on lane top).
// Exact positions are dictated by the assignment spec.
const PIN_POSITIONS = [
  { id: 1,  x:  0.0, z: -57.000 },         // head pin (closest to bowler)
  { id: 2,  x: -0.5, z: -57.866 },
  { id: 3,  x:  0.5, z: -57.866 },
  { id: 4,  x: -1.0, z: -58.732 },
  { id: 5,  x:  0.0, z: -58.732 },
  { id: 6,  x:  1.0, z: -58.732 },
  { id: 7,  x: -1.5, z: -59.598 },
  { id: 8,  x: -0.5, z: -59.598 },
  { id: 9,  x:  0.5, z: -59.598 },
  { id: 10, x:  1.5, z: -59.598 },
];

// ----------------------------------------------------------------------------
//  Helper (kept for parity with starter code / rotation math).
// ----------------------------------------------------------------------------
function degrees_to_radians(degrees) {
  return degrees * (Math.PI / 180);
}

// ============================================================================
//  Renderer
// ============================================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;                 // shadow maps ON
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // soft shadow edges
document.body.appendChild(renderer.domElement);

// ============================================================================
//  Scene
// ============================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1116);      // dark alley ambiance
scene.fog = new THREE.Fog(0x0e1116, 50, 130);      // subtle depth falloff down lane

// ============================================================================
//  Camera
// ============================================================================
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
// Initial: bowler's perspective, standing on the approach looking down the lane.
camera.position.set(0, 5, 12);

// ============================================================================
//  Lighting (with shadow-casting key light)
// ============================================================================
function setupLights() {
  // Soft sky/ground fill so shadowed sides are not pure black.
  const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x202024, 0.55);
  scene.add(hemi);

  // Low ambient lift.
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  // Key directional light — casts the scene's shadows.
  const key = new THREE.DirectionalLight(0xfff2e0, 1.05);
  key.position.set(10, 28, 14);
  key.castShadow = true;

  // Aim the light down the middle of the lane.
  key.target.position.set(0, 0, -28);
  scene.add(key.target);

  // Shadow frustum must be generous: the lane is ~80 units along Z.
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 200;
  key.shadow.camera.left = -45;
  key.shadow.camera.right = 45;
  key.shadow.camera.top = 45;
  key.shadow.camera.bottom = -45;
  key.shadow.bias = -0.0004;                 // reduce shadow acne
  scene.add(key);

  // A warm overhead fill above the pin deck for that "alley glow".
  // decay=0: r160 uses physical lighting by default, so any decay>0 would make
  // this ~18-units-distant spot effectively invisible. No falloff keeps it visible.
  const pinSpot = new THREE.SpotLight(0xfff0d8, 0.7, 80, degrees_to_radians(50), 0.4, 0.0);
  pinSpot.position.set(0, 18, -58);
  pinSpot.target.position.set(0, 0, -58);
  scene.add(pinSpot.target);
  scene.add(pinSpot);
}

// ============================================================================
//  Lane surface (glossy light-maple)
// ============================================================================
function createLane() {
  const geo = new THREE.BoxGeometry(LANE_WIDTH, LANE_THICKNESS, LANE_LENGTH);
  const mat = new THREE.MeshPhongMaterial({
    color: 0xd9a564,        // light maple
    shininess: 90,          // glossy lane finish
    specular: 0x553311,
  });
  const lane = new THREE.Mesh(geo, mat);
  // Centered between Z=0 and Z=-60; top of slab flush with SURFACE_Y.
  lane.position.set(0, SURFACE_Y - LANE_THICKNESS / 2, -LANE_LENGTH / 2);
  lane.receiveShadow = true;
  scene.add(lane);
}

// ============================================================================
//  Approach area (+Z side, subtly different/darker shade than the lane)
// ============================================================================
function createApproach() {
  const geo = new THREE.BoxGeometry(LANE_WIDTH, LANE_THICKNESS, APPROACH_LENGTH);
  const mat = new THREE.MeshPhongMaterial({
    color: 0xb6884a,        // slightly darker maple
    shininess: 55,
    specular: 0x442a11,
  });
  const approach = new THREE.Mesh(geo, mat);
  approach.position.set(0, SURFACE_Y - LANE_THICKNESS / 2, APPROACH_LENGTH / 2);
  approach.receiveShadow = true;
  scene.add(approach);
}

// ============================================================================
//  Gutters (both sides, full lane length, recessed below lane top)
// ============================================================================
function createGutters() {
  const geo = new THREE.BoxGeometry(GUTTER_WIDTH, LANE_THICKNESS, LANE_LENGTH);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x33373d,        // dark recessed channel
    shininess: 25,
  });
  const offsetX = LANE_HALF_W + GUTTER_WIDTH / 2;
  const topY = SURFACE_Y - GUTTER_DROP;     // gutter top sits below lane top

  for (const side of [-1, 1]) {
    const gutter = new THREE.Mesh(geo, mat);
    gutter.position.set(side * offsetX, topY - LANE_THICKNESS / 2, -LANE_LENGTH / 2);
    gutter.receiveShadow = true;
    scene.add(gutter);
  }
}

// ============================================================================
//  Pin deck (distinct darker surface behind the pins)
// ============================================================================
function createPinDeck() {
  // Thin overlay slab covering the pin area, sitting a hair above the lane top
  // so it reads as a visually distinct surface.
  const deckDepth = 7;
  const geo = new THREE.BoxGeometry(LANE_WIDTH, 0.06, deckDepth);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x6e6157,        // muted, distinct from maple lane
    shininess: 40,
  });
  const deck = new THREE.Mesh(geo, mat);
  // Top face sits a hair above the lane (Y≈+0.003) so it reads as a distinct
  // surface while staying flush with the pin bases at Y=0 (no sunk-in pins).
  deck.position.set(0, SURFACE_Y - 0.027, -58.4);   // spans roughly Z=-55 to -62
  deck.receiveShadow = true;
  scene.add(deck);
}

// ============================================================================
//  Lane markings — all use unlit MeshBasicMaterial and float just above the
//  surface (Y small epsilon) to avoid z-fighting with the lane.
// ============================================================================
const MARK_Y = SURFACE_Y + 0.012;

// Foul line: thin bright band across the full lane width at Z = 0.
function createFoulLine() {
  const geo = new THREE.PlaneGeometry(LANE_WIDTH, 0.18);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide });
  const line = new THREE.Mesh(geo, mat);
  line.rotation.x = -Math.PI / 2;           // lay flat
  line.position.set(0, MARK_Y, 0);
  scene.add(line);

  // A thin white edge just behind it for the classic white/red look.
  const whiteGeo = new THREE.PlaneGeometry(LANE_WIDTH, 0.06);
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const white = new THREE.Mesh(whiteGeo, whiteMat);
  white.rotation.x = -Math.PI / 2;
  white.position.set(0, MARK_Y, 0.13);
  scene.add(white);
}

// Approach dots: two rows of small guide dots on the approach (+Z) area.
function createApproachDots() {
  const dotGeo = new THREE.CircleGeometry(0.05, 16);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  // Standard arrangement: 7 dots per row, evenly spread across the lane width.
  const xs = [-1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5];
  const rowZ = [3, 6];                       // two rows on the approach

  for (const z of rowZ) {
    for (const x of xs) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(x, MARK_Y, z);
      scene.add(dot);
    }
  }
}

// Targeting arrows: 7 arrows embedded in the lane ~15 units from the foul line,
// fanning out in the classic chevron (center arrow deepest down the lane).
function createTargetingArrows() {
  const mat = new THREE.MeshBasicMaterial({ color: 0x3a2a16 });

  // Build a small triangle pointing toward -Z (down the lane).
  function makeArrow() {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.30);                  // tip (toward pins, -Z after rotation)
    shape.lineTo(0.12, 0.18);
    shape.lineTo(-0.12, 0.18);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    const arrow = new THREE.Mesh(geo, mat);
    arrow.rotation.x = -Math.PI / 2;         // lay flat on the lane
    return arrow;
  }

  // Lateral offset, and how far down-lane each arrow sits (center is deepest).
  const arrows = [
    { x:  0.0, z: -15.0 },
    { x: -0.5, z: -14.4 },
    { x:  0.5, z: -14.4 },
    { x: -1.0, z: -13.8 },
    { x:  1.0, z: -13.8 },
    { x: -1.5, z: -13.2 },
    { x:  1.5, z: -13.2 },
  ];

  for (const a of arrows) {
    const arrow = makeArrow();
    arrow.position.set(a.x, MARK_Y, a.z);
    scene.add(arrow);
  }
}

// ============================================================================
//  Bowling pin — classic silhouette via LatheGeometry (wide body, narrow
//  neck, rounded top) plus red neck stripes. Returns a positioned Group.
// ============================================================================
// Pin profile: Vector2(radius, height) from base (y=0) to crown (y=PIN_HEIGHT).
// Hand-tuned to read as a regulation pin: foot -> belly -> neck -> head -> top.
const PIN_PROFILE = [
  [0.000, 0.000],
  [0.090, 0.000],   // base/foot edge
  [0.100, 0.040],
  [0.120, 0.110],
  [0.155, 0.250],
  [0.180, 0.380],   // widest belly
  [0.172, 0.480],
  [0.140, 0.580],
  [0.100, 0.680],
  [0.082, 0.760],   // narrowest neck
  [0.092, 0.840],
  [0.108, 0.930],   // head bulge
  [0.104, 1.010],
  [0.082, 1.110],
  [0.045, 1.200],
  [0.000, 1.250],   // rounded crown
].map(([r, y]) => new THREE.Vector2(r, y));

const pinBodyMat = new THREE.MeshPhongMaterial({
  color: 0xfafafa,
  shininess: 70,
  specular: 0x999999,
});
const pinStripeMat = new THREE.MeshPhongMaterial({
  color: 0xd11e1e,
  shininess: 70,
  specular: 0x661010,
});

function createPin(x, z) {
  const pin = new THREE.Group();

  // Body via lathe (revolve the profile around the Y axis).
  const bodyGeo = new THREE.LatheGeometry(PIN_PROFILE, 32);
  const body = new THREE.Mesh(bodyGeo, pinBodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  pin.add(body);

  // Two classic red stripes around the neck. Thin open cylinders that hug the
  // profile radius (a hair larger) so they sit on the surface as visible bands.
  const stripeData = [
    { y: 0.86, r: 0.100 },
    { y: 0.98, r: 0.112 },
  ];
  for (const s of stripeData) {
    const stripeGeo = new THREE.CylinderGeometry(s.r, s.r, 0.05, 32, 1, true);
    const stripe = new THREE.Mesh(stripeGeo, pinStripeMat);
    stripe.position.y = s.y;
    stripe.castShadow = true;
    pin.add(stripe);
  }

  pin.position.set(x, SURFACE_Y, z);         // base sits on the lane top
  return pin;
}

function createAllPins() {
  for (const p of PIN_POSITIONS) {
    scene.add(createPin(p.x, p.z));
  }
}

// ============================================================================
//  Bowling ball factory — glossy sphere with three finger holes (two adjacent
//  + one offset thumb), rendered as dark cylinders bored slightly into the
//  surface. Returns an UNpositioned Group so it can be reused for both the
//  static lane ball and the colored balls on the rack.
// ============================================================================
function makeBowlingBall(radius, color, shininess = 130) {
  const ball = new THREE.Group();

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 48),
    new THREE.MeshPhongMaterial({ color, shininess, specular: 0xffffff })
  );
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  ball.add(sphere);

  // Finger-hole directions (unit vectors from center toward the upper surface).
  const holeMat = new THREE.MeshPhongMaterial({ color: 0x060606, shininess: 20 });
  const holeDirs = [
    new THREE.Vector3( 0.18, 1.0,  0.30),    // index finger
    new THREE.Vector3(-0.18, 1.0,  0.30),    // middle finger (adjacent pair)
    new THREE.Vector3( 0.00, 1.0, -0.42),    // thumb (offset)
  ];
  const holeLen = radius * 0.36;             // scale hole depth with ball size
  const holeR = radius * 0.11;
  for (const dir of holeDirs) {
    dir.normalize();
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(holeR, holeR, holeLen, 20),
      holeMat
    );
    // Place the dark cap a hair PROUD of the surface (capDistance > radius) so
    // the opaque sphere never occludes it. With no CSG, a fully recessed cap is
    // hidden INSIDE the sphere — which is what made the holes invisible before.
    // 0.005 clears the curvature recession at the cap's rim (~holeR^2/2r) so the
    // whole dark disc stays visible as a finger-hole opening, while the
    // protrusion is far too small to read as a peg/stub.
    const capDistance = radius + 0.005;
    const seat = capDistance - holeLen / 2;
    hole.position.copy(dir.clone().multiplyScalar(seat));
    // Orient the cylinder's +Y axis along the hole direction (pointing outward).
    hole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    ball.add(hole);
  }

  return ball;
}

// The static lane ball: rests on the approach area, centered on the lane (X=0).
function createBall() {
  const ball = makeBowlingBall(BALL_RADIUS, 0x1c2c8c, 140);   // deep glossy blue
  ball.position.set(0, SURFACE_Y + BALL_RADIUS, 8);
  scene.add(ball);
}

// ============================================================================
//  BONUS infrastructure (no physics): back masking wall, ball-return rail,
//  and a simple bench behind the approach.
// ============================================================================
function createBackWall() {
  const geo = new THREE.BoxGeometry(LANE_WIDTH + 2 * GUTTER_WIDTH + 1.5, 6, 0.4);
  const mat = new THREE.MeshPhongMaterial({ color: 0x161a22, shininess: 10 });
  const wall = new THREE.Mesh(geo, mat);
  wall.position.set(0, 3 - LANE_THICKNESS, -63);
  wall.receiveShadow = true;
  scene.add(wall);
}

function createBallReturn() {
  // A simple raised rail running alongside the right gutter back toward the bowler.
  const railMat = new THREE.MeshPhongMaterial({ color: 0x2b2f36, shininess: 60 });
  const railGeo = new THREE.BoxGeometry(0.35, 0.4, LANE_LENGTH * 0.6);
  const rail = new THREE.Mesh(railGeo, railMat);
  const x = LANE_HALF_W + GUTTER_WIDTH + 0.5;
  rail.position.set(x, SURFACE_Y + 0.1, -LANE_LENGTH * 0.3);
  rail.castShadow = true;
  rail.receiveShadow = true;
  scene.add(rail);
}

function createBench() {
  const bench = new THREE.Group();
  const woodMat = new THREE.MeshPhongMaterial({ color: 0x5a3a1e, shininess: 30 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.8), woodMat);
  seat.position.set(0, 0.6, 18.5);
  seat.castShadow = true;
  seat.receiveShadow = true;
  bench.add(seat);

  for (const sx of [-1.3, 1.3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.6), woodMat);
    leg.position.set(sx, 0.3, 18.5);
    leg.castShadow = true;
    leg.receiveShadow = true;
    bench.add(leg);
  }
  scene.add(bench);
}

// ============================================================================
//  Ball rack (BONUS) — a freestanding two-tier rack to the LEFT of the lane
//  (negative X, the bowler's left) holding six bowling balls in different
//  colors, each seated in a cradle ring.
// ============================================================================
function createBallRack() {
  const rack = new THREE.Group();

  const rackX = -4.8;        // well left of the left gutter (outer edge ~ -2.35)
  const rackZ = 5.0;         // alongside the approach, on the bowler's side
  const ballR = 0.4;
  const width = 1.2;
  const depth = 3.6;
  const lowerTop = 0.9;      // Y of the lower shelf's top surface
  const upperTop = 1.9;      // Y of the upper shelf's top surface

  const frameMat = new THREE.MeshPhongMaterial({ color: 0x3a3f47, shininess: 60 });
  const cradleMat = new THREE.MeshPhongMaterial({ color: 0x15171c, shininess: 30 });

  // Four corner posts from the floor up to the upper shelf.
  const postH = upperTop + 0.05;
  for (const px of [rackX - width / 2, rackX + width / 2]) {
    for (const pz of [rackZ - depth / 2, rackZ + depth / 2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, postH, 0.1), frameMat);
      post.position.set(px, postH / 2, pz);
      post.castShadow = true;
      post.receiveShadow = true;
      rack.add(post);
    }
  }

  // Two shelves.
  for (const topY of [lowerTop, upperTop]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, depth), frameMat);
    shelf.position.set(rackX, topY - 0.04, rackZ);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    rack.add(shelf);
  }

  // Three colored balls per shelf, each seated in a dark cradle ring.
  const ballZ = [rackZ - 1.0, rackZ, rackZ + 1.0];
  const shelves = [
    { top: lowerTop, colors: [0xc0392b, 0x2980b9, 0x27ae60] }, // red, blue, green
    { top: upperTop, colors: [0xf1c40f, 0x8e44ad, 0xe67e22] }, // yellow, purple, orange
  ];
  for (const shelf of shelves) {
    for (let i = 0; i < ballZ.length; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 12, 24), cradleMat);
      ring.rotation.x = -Math.PI / 2;          // lay flat as a cradle
      ring.position.set(rackX, shelf.top + 0.02, ballZ[i]);
      rack.add(ring);

      const ball = makeBowlingBall(ballR, shelf.colors[i], 120);
      ball.position.set(rackX, shelf.top + ballR, ballZ[i]);
      ball.rotation.y = i * 1.3 + shelf.top;   // vary so holes don't all align
      rack.add(ball);
    }
  }

  scene.add(rack);
}

// ============================================================================
//  Lane bumpers (BONUS) — a thin light-grey rail raised high on regularly
//  spaced support columns of the same color, on both sides of the lane,
//  running from the foul line nearly to the pins (real bumper-bowling rail).
// ============================================================================
function createLaneBumpers() {
  const railR = 0.12;                        // slim tube (reduced girth)
  const railY = 0.55;                        // raised rail height (top ~0.67)
  const reach = 56;                          // foul line (Z=0) toward the pins
  const mat = new THREE.MeshPhongMaterial({
    color: 0xcfd3d8,                         // light grey (rail + columns share it)
    shininess: 45,
    specular: 0x555a60,
  });

  // Rounded rail (CapsuleGeometry => rounded tube + end caps). Total axial
  // length = (reach - 2*railR) + 2*railR = reach.
  const railGeo = new THREE.CapsuleGeometry(railR, reach - 2 * railR, 8, 18);
  const xOffset = LANE_HALF_W + railR;       // inner surface flush with the lane edge
  const centerZ = -reach / 2;                // spans Z = 0 (foul line) to ~ -56

  // Vertical support columns rise from the gutter lip up to the rail.
  const base = SURFACE_Y - GUTTER_DROP;      // gutter top (Y = -0.12)
  const postH = railY - base;                // column height
  const postGeo = new THREE.CylinderGeometry(0.05, 0.05, postH, 12);
  const numPosts = 8;

  for (const side of [-1, 1]) {
    // Raised rail.
    const rail = new THREE.Mesh(railGeo, mat);
    rail.rotation.x = Math.PI / 2;           // lie the capsule along the Z axis
    rail.position.set(side * xOffset, railY, centerZ);
    rail.castShadow = true;
    rail.receiveShadow = true;
    scene.add(rail);

    // Evenly spaced columns connecting the rail down to the gutter.
    for (let i = 0; i < numPosts; i++) {
      const t = (i + 0.5) / numPosts;        // fraction along the reach
      const post = new THREE.Mesh(postGeo, mat);
      post.position.set(side * xOffset, base + postH / 2, -t * reach);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
    }
  }
}

// ============================================================================
//  Build the scene
// ============================================================================
setupLights();
createLane();
createApproach();
createGutters();
createPinDeck();
createFoulLine();
createApproachDots();
createTargetingArrows();
createAllPins();
createBall();
// Bonus elements:
createBackWall();
createBallReturn();
createBench();
createBallRack();
createLaneBumpers();

// ============================================================================
//  Orbit controls + camera presets
// ============================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, -28);            // look toward the pins by default
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.update();

let isOrbitEnabled = true;

// Named camera presets (BONUS): position + look-at target.
const CAMERA_PRESETS = {
  bowler:   { pos: [0, 5, 12],     target: [0, 0.5, -28] },
  overhead: { pos: [0, 48, -26],   target: [0, 0, -28] },
  pinEnd:   { pos: [0, 4, -68],    target: [0, 1, -58] },
  side:     { pos: [14, 7, -28],   target: [0, 1, -28] },
  rack:     { pos: [-2.6, 2.5, 11], target: [-4.8, 1.3, 5.0] },  // inspect ball rack
};

function applyPreset(name) {
  const p = CAMERA_PRESETS[name];
  if (!p) return;
  camera.position.set(p.pos[0], p.pos[1], p.pos[2]);
  controls.target.set(p.target[0], p.target[1], p.target[2]);
  // Clear any residual orbit momentum (damping) so the camera lands exactly on
  // the preset instead of drifting for a few frames afterward.
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = damping;
}

// ============================================================================
//  Keyboard: 'O' toggles orbit controls; 1-4 switch camera presets (bonus).
// ============================================================================
function handleKeyDown(e) {
  switch (e.key.toLowerCase()) {
    case 'o':
      isOrbitEnabled = !isOrbitEnabled;
      break;
    case '1': applyPreset('bowler');   break;
    case '2': applyPreset('overhead'); break;
    case '3': applyPreset('pinEnd');   break;
    case '4': applyPreset('side');     break;
    case '5': applyPreset('rack');     break;
  }
}
document.addEventListener('keydown', handleKeyDown);

// ============================================================================
//  Responsive resize
// ============================================================================
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// ============================================================================
//  Render loop (static scene — no physics; only controls/damping update)
// ============================================================================
function animate() {
  requestAnimationFrame(animate);
  controls.enabled = isOrbitEnabled;
  controls.update();                          // needed for damping
  renderer.render(scene, camera);
}
animate();
