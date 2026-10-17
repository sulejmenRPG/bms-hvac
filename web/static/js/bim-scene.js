/**
 * BIM DIGITAL TWIN ENGINE (ORCHESTRATOR FACADE)
 * Точка входа 3D BIM-двойника завода.
 * Координирует специализированные модули из /static/js/bim/.
 * Стандарт: до 150 строк.
 */

const spongeCakeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
const chocCakeMat = new THREE.MeshStandardMaterial({ color: 0x2b1408, roughness: 0.3, metalness: 0.1 });

function initBIM() {
  const canvas = document.getElementById('bimCanvas') || document.getElementById('bim-canvas');
  const wrapper = document.querySelector('.bim-viewport-wrapper');
  if (!canvas || !wrapper) return;

  const width = wrapper.clientWidth || 1000;
  const height = wrapper.clientHeight || 640;

  // 1. WebGL Renderer with Logarithmic Depth Buffer
  bimRenderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    logarithmicDepthBuffer: true
  });
  bimRenderer.setSize(width, height, false);
  bimRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  bimRenderer.shadowMap.enabled = true;
  bimRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  bimRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  bimRenderer.toneMappingExposure = 1.15;

  // 2. Scene & Fog Setup
  bimScene = new THREE.Scene();
  bimScene.background = new THREE.Color(0x0c1017);
  bimScene.fog = new THREE.FogExp2(0x0c1017, 0.007);

  // 3. Perspective Camera (Frustum optimized for architectural views)
  bimCamera = new THREE.PerspectiveCamera(38, width / height, 0.5, 250);
  bimCamera.position.copy(camTargetPos);

  // 4. OrbitControls
  bimControls = new THREE.OrbitControls(bimCamera, bimRenderer.domElement);
  bimControls.enableDamping = true;
  bimControls.dampingFactor = 0.06;
  bimControls.target.copy(camTargetLook);
  bimControls.maxPolarAngle = Math.PI / 2.05;
  bimControls.minDistance = 10;
  bimControls.maxDistance = 85;

  // 5. Initialize Subsystems via Modules
  initBIMLighting(bimScene);
  initBIMStructure(bimScene);
  initBIMHVAC(bimScene);
  initBIMEquipment(bimScene);
  initBIMChiller(bimScene);
  initBIMCabinets(bimScene);
  if (typeof initBIMColdRoom === 'function') {
    initBIMColdRoom(bimScene);
  }
  if (typeof initBIMPersonnel === 'function') {
    initBIMPersonnel(bimScene);
  }

  // 6. Selected Object Bounding Box Helper
  selectedBoxHelper = new THREE.BoxHelper(new THREE.Mesh(), 0x38bdf8);
  selectedBoxHelper.visible = false;
  bimScene.add(selectedBoxHelper);

  // 7. User Interactions & Window Events
  initBIMInteraction(canvas, wrapper);

  // 8. Start Real-Time Render Loop
  animateBIM();
}

function animateBIM() {
  requestAnimationFrame(animateBIM);

  // Smooth Camera Transition LERP
  if (isTransitioningCam && bimCamera && bimControls) {
    bimCamera.position.lerp(camTargetPos, 0.05);
    bimControls.target.lerp(camTargetLook, 0.05);
    if (bimCamera.position.distanceTo(camTargetPos) < 0.08 && bimControls.target.distanceTo(camTargetLook) < 0.08) {
      isTransitioningCam = false;
    }
  }

  if (bimControls) bimControls.update();

  // Moving Chocolate Cakes Conveyor Loop with Enrobing Progression
  for (let i = 0; i < conveyorCakes.length; i++) {
    const cake = conveyorCakes[i];
    cake.position.x += 0.025;
    if (cake.position.x > 5.5) {
      cake.position.x = -5.5;
    }
    if (window.currentIsolationMode && window.currentIsolationMode !== 'all' && window.currentIsolationMode !== 'cooling') {
      cake.material = window.ghostMatSolid || spongeCakeMat;
    } else {
      cake.material = (cake.position.x < -3.5) ? spongeCakeMat : chocCakeMat;
    }
  }

  // Update Animated Personnel
  if (typeof updateBIMPersonnel === 'function') {
    const isNight = window.plantData ? !!window.plantData.night_mode : false;
    updateBIMPersonnel(isNight);
  }

  // Real-Time Hardware Synchronizations
  if (window.plantData) {
    const isGlobalOven = !!window.plantData.oven_open;
    const targetDoor1 = (isGlobalOven || window.ovenDoor1Open) ? 1.3 : 0.0;
    const targetDoor2 = (isGlobalOven || window.ovenDoor2Open) ? 1.3 : 0.0;
    if (ovenDoor1) ovenDoor1.rotation.y = THREE.MathUtils.lerp(ovenDoor1.rotation.y, targetDoor1, 0.08);
    if (ovenDoor2) ovenDoor2.rotation.y = THREE.MathUtils.lerp(ovenDoor2.rotation.y, targetDoor2, 0.08);

    const targetGateY = window.plantData.bay_door_open ? 3.4 : 1.15;
    if (dockDoorMesh) dockDoorMesh.position.y = THREE.MathUtils.lerp(dockDoorMesh.position.y, targetGateY, 0.08);

    if (ovenLight) {
      const targetOvenInt = window.plantData.oven_open ? 3.2 : 0.8;
      ovenLight.intensity = THREE.MathUtils.lerp(ovenLight.intensity, targetOvenInt, 0.06);
    }
    if (chillerLight && window.plantData.zones && window.plantData.zones.glazing) {
      const acVal = window.plantData.zones.glazing.ac || 0;
      const targetChillerInt = (acVal > 0) ? (0.5 + (acVal / 100) * 2.2) : 0.25;
      chillerLight.intensity = THREE.MathUtils.lerp(chillerLight.intensity, targetChillerInt, 0.06);

      if (chillerFanBlades && chillerFanBlades.length > 0 && acVal > 0) {
        const fanSpeed = 0.08 + (acVal / 100) * 0.35;
        for (let fi = 0; fi < chillerFanBlades.length; fi++) {
          chillerFanBlades[fi].rotation.y += fanSpeed;
        }
      }
    }

    // Dynamic Overhead LED High-Bay Dimming
    const l = window.plantData.lighting || {
      bakery: window.plantData.night_mode ? 30 : 100,
      glazing: window.plantData.night_mode ? 30 : 100,
      storage: window.plantData.night_mode ? 30 : 100
    };
    const zoneMap = { z1: l.bakery ?? 100, z2: l.glazing ?? 100, z3: l.storage ?? 100 };
    for (const zid of ['z1', 'z2', 'z3']) {
      const pct = (zoneMap[zid] !== undefined ? zoneMap[zid] : 100) / 100.0;
      const targetLumInt = 0.22 + pct * 0.93;
      const targetEmissive = 0.15 + pct * 0.85;
      const fixtures = zoneLightingGroups[zid] || [];
      for (let i = 0; i < fixtures.length; i++) {
        fixtures[i].light.intensity = THREE.MathUtils.lerp(fixtures[i].light.intensity, targetLumInt, 0.06);
        if (fixtures[i].lens && fixtures[i].lens.material) {
          fixtures[i].lens.material.emissiveIntensity = THREE.MathUtils.lerp(fixtures[i].lens.material.emissiveIntensity, targetEmissive, 0.06);
        }
      }
    }

    // Dynamic Sky / Sun / Ambient Lighting for Day/Night shift
    const isNight = !!window.plantData.night_mode;
    if (bimSunLight) {
      const targetSunInt = isNight ? 0.05 : 1.15;
      bimSunLight.intensity = THREE.MathUtils.lerp(bimSunLight.intensity, targetSunInt, 0.05);
    }
    if (bimFillLight) {
      const targetFillInt = isNight ? 0.04 : 0.40;
      bimFillLight.intensity = THREE.MathUtils.lerp(bimFillLight.intensity, targetFillInt, 0.05);
    }
    if (bimAmbientLight) {
      const targetAmbInt = isNight ? 0.10 : 0.75;
      bimAmbientLight.intensity = THREE.MathUtils.lerp(bimAmbientLight.intensity, targetAmbInt, 0.05);
      const targetColor = isNight ? new THREE.Color(0x0f1d36) : new THREE.Color(0xf1f5f9);
      bimAmbientLight.color.lerp(targetColor, 0.05);
    }
    if (bimScene && bimScene.background) {
      const targetBg = isNight ? new THREE.Color(0x04070e) : new THREE.Color(0x0c1017);
      bimScene.background.lerp(targetBg, 0.05);
      if (bimScene.fog) bimScene.fog.color.lerp(targetBg, 0.05);
    }

    if (selectedObject) {
      updateInspectorTelemetry(selectedObject);
    }
  }

  if (bimRenderer && bimScene && bimCamera) {
    bimRenderer.render(bimScene, bimCamera);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initBIM);
} else {
  initBIM();
}
