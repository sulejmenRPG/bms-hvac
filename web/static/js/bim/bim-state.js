/**
 * BIM STATE & SHARED RUNTIME CONTEXT
 * Модуль глобального состояния 3D BIM-сцены завода.
 * Стандарт: до 300 строк.
 */

// Core Three.js Engine Variables
let bimScene = null;
let bimCamera = null;
let bimRenderer = null;
let bimControls = null;

// Equipment & Structural Meshes
let ovenDoor1 = null;
let ovenDoor2 = null;
let dockDoorMesh = null;
let conveyorCakes = [];
let chillerFanBlades = [];

// Reactive & Scene Environment Lights
let bimAmbientLight = null;
let bimSunLight = null;
let bimFillLight = null;
let ovenLight = null;
let chillerLight = null;
let storageLight = null;
let overheadLuminaires = [];
let overheadLights = [];
let zoneLightingGroups = { z1: [], z2: [], z3: [] };

// Interaction & Raycasting
let clickableObjects = [];
let selectedObject = null;
let selectedBoxHelper = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Camera Positioning & Interpolation
const camTargetPos = new THREE.Vector3(28, 22, 32);
const camTargetLook = new THREE.Vector3(0, 1.2, 0);
let isTransitioningCam = true;

// Standard Industrial Camera Presets
const cameraPresets = {
  iso: { pos: [28, 22, 32], target: [0, 1.2, 0] },
  panels: { pos: [-2, 8, 9], target: [-8.0, 1.4, -4.5] },
  z1: { pos: [-16, 12, 18], target: [-16, 1.5, -2] },
  z2: { pos: [0, 12, 18], target: [0, 1.5, 0] },
  z3: { pos: [16, 12, 18], target: [16, 1.5, 0] },
  top: { pos: [0, 44, 0.1], target: [0, 0, 0] }
};

// Helper function to create shadow-casting meshes
function createMesh(geo, mat, cast = true, receive = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  m._origMaterial = mat;
  m.userData.origMaterial = mat;
  return m;
}
