/**
 * HIGH-FIDELITY 3D INDUSTRIAL EDGE INSTALLATION
 * Детализированная 3D-модель контроллера Advantech Edge IPC на DIN-рейке
 * с модулями I/O, перфорированными кабель-каналами, проводкой и студийным светом.
 * Стандарт: до 350 строк.
 */

(function () {
  'use strict';

  let edge3DScene = null;
  let edge3DCamera = null;
  let edge3DRenderer = null;
  let edge3DControls = null;
  const edgeHotspots = {};
  let activeEdgeHotspot = null;
  let viewerLedRx = null;
  let viewerLedTx = null;
  let isEdgeCamTransition = false;
  const edgeCamTargetPos = new THREE.Vector3();
  const edgeCamTargetLook = new THREE.Vector3();

  function flyEdgeCamera(pos, target) {
    if (!edge3DCamera || !edge3DControls) return;
    edgeCamTargetPos.set(...pos);
    edgeCamTargetLook.set(...target);
    isEdgeCamTransition = true;
  }

  function initEdge3DViewer(containerId = 'edge-3d-canvas-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const w = container.clientWidth || 700;
    const h = container.clientHeight || 480;

    // 1. Scene & Cinematic Perspective Camera
    edge3DScene = new THREE.Scene();
    edge3DScene.background = new THREE.Color(0x060911);

    edge3DCamera = new THREE.PerspectiveCamera(36, w / h, 0.1, 50);
    edge3DCamera.position.set(0.0, 0.35, 7.6);

    // 2. WebGL Renderer with High-DPI and Shadows
    edge3DRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    edge3DRenderer.setSize(w, h);
    edge3DRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    edge3DRenderer.shadowMap.enabled = true;
    edge3DRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(edge3DRenderer.domElement);

    // 3. Smooth Free OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      edge3DControls = new THREE.OrbitControls(edge3DCamera, edge3DRenderer.domElement);
      edge3DControls.enableDamping = true;
      edge3DControls.dampingFactor = 0.06;
      edge3DControls.target.set(0.0, 0.05, 0);
      edge3DControls.minDistance = 0.8;
      edge3DControls.maxDistance = 25.0;
      edge3DControls.maxPolarAngle = Math.PI - 0.05;
      edge3DControls.minPolarAngle = 0.05;
      edge3DControls.enablePan = true;
      edge3DControls.addEventListener('start', () => {
        isEdgeCamTransition = false;
      });
    }

    // 4. Industrial Studio 4-Point Lighting (Neutral White 4500K)
    const ambLight = new THREE.AmbientLight(0xf1f5f9, 0.72);
    edge3DScene.add(ambLight);

    // Key Light (Main frontal studio beam)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(3.5, 4.5, 5.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    edge3DScene.add(keyLight);

    // Fill Light (Soft neutral fill from left)
    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.65);
    fillLight.position.set(-3.5, 2.5, 4.0);
    edge3DScene.add(fillLight);

    // Front-Bottom Light (Illuminates bottom ports, terminals and wiring)
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.4);
    bottomLight.position.set(0, -3.0, 3.5);
    edge3DScene.add(bottomLight);

    // Rim Light (Sharp backlight defining metallic bevels of heatsink and rails)
    const rimLight = new THREE.DirectionalLight(0xf8fafc, 1.0);
    rimLight.position.set(0, 4.5, -3.0);
    edge3DScene.add(rimLight);

    // 5. Build High-Detail Industrial Assembly from edge-3d-models.js
    if (typeof window.buildDetailedCabinetAssembly === 'function') {
      const leds = window.buildDetailedCabinetAssembly(edge3DScene, edgeHotspots);
      if (leds) {
        viewerLedRx = leds.ledRx;
        viewerLedTx = leds.ledTx;
      }
    }

    // 6. Raycasting Interaction (Distinguish drag from click, empty space deselects)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerStartX = 0;
    let pointerStartY = 0;

    edge3DRenderer.domElement.addEventListener('pointerdown', (e) => {
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
    });

    edge3DRenderer.domElement.addEventListener('pointerup', (e) => {
      const dx = Math.abs(e.clientX - pointerStartX);
      const dy = Math.abs(e.clientY - pointerStartY);
      // If dragged more than 5px, it is free rotation: do not switch part!
      if (dx > 5 || dy > 5) return;

      const rect = edge3DRenderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, edge3DCamera);
      const clickable = Object.values(edgeHotspots);
      const intersects = raycaster.intersectObjects(clickable, true);

      if (intersects.length > 0) {
        let top = intersects[0].object;
        while (top && !top.userData?.partId && top.parent) {
          top = top.parent;
        }
        if (top && top.userData?.partId) {
          const clickedId = top.userData.partId;
          if (activeEdgeHotspot === clickedId) {
            triggerSelectEdgePart('overview');
          } else {
            triggerSelectEdgePart(clickedId);
          }
          return;
        }
      }

      // Clicked on empty space or non-interactive parts -> drop focus to overview
      if (activeEdgeHotspot && activeEdgeHotspot !== 'overview') {
        triggerSelectEdgePart('overview');
      }
    });

    // Escape key drops focus to overview
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeEdgeHotspot && activeEdgeHotspot !== 'overview') {
        triggerSelectEdgePart('overview');
      }
    });

    // 7. Render Loop with Smooth Cinematic LERP
    function animate() {
      requestAnimationFrame(animate);

      if (isEdgeCamTransition && edge3DCamera && edge3DControls) {
        edge3DCamera.position.lerp(edgeCamTargetPos, 0.08);
        edge3DControls.target.lerp(edgeCamTargetLook, 0.08);
        if (edge3DCamera.position.distanceTo(edgeCamTargetPos) < 0.03 && edge3DControls.target.distanceTo(edgeCamTargetLook) < 0.03) {
          isEdgeCamTransition = false;
        }
      }

      if (edge3DControls) edge3DControls.update();

      // Pulse RX/TX LEDs
      const isTick = Math.floor(Date.now() / 250) % 2 === 0;
      if (viewerLedRx) viewerLedRx.material.color.setHex(isTick ? 0xf59e0b : 0x451a03);
      if (viewerLedTx) viewerLedTx.material.color.setHex(!isTick ? 0x22c55e : 0x052e16);

      edge3DRenderer.render(edge3DScene, edge3DCamera);
    }
    animate();

    // Resize Observer
    window.addEventListener('resize', () => {
      if (!container || !edge3DRenderer || !edge3DCamera) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      edge3DCamera.aspect = nw / nh;
      edge3DCamera.updateProjectionMatrix();
      edge3DRenderer.setSize(nw, nh);
    });
  }


  function highlightEdgePart(partId) {
    activeEdgeHotspot = partId;
    Object.keys(edgeHotspots).forEach((id) => {
      const grp = edgeHotspots[id];
      if (!grp) return;
      grp.traverse((child) => {
        if (!child.isMesh || !child.material || !child.material.emissive) return;
        if (child._origEmissive === undefined) child._origEmissive = child.material.emissive.getHex();
        const shouldGlow = (id === partId && partId !== 'overview');
        child.material.emissive.setHex(shouldGlow ? 0x1e3a8a : child._origEmissive);
      });
    });
  }

  function triggerSelectEdgePart(partId) {
    highlightEdgePart(partId);
    if (typeof window.onEdgePartActivated === 'function') {
      window.onEdgePartActivated(partId);
    }
  }

  window.initEdge3DViewer = initEdge3DViewer;
  window.highlightEdgePart = highlightEdgePart;
  window.triggerSelectEdgePart = triggerSelectEdgePart;
  window.flyEdgeCamera = flyEdgeCamera;
})();
