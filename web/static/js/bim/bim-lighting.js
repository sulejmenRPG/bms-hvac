/**
 * BIM LIGHTING & OVERHEAD TRUSSES
 * Модуль освещения, потолочных ферм и High-Bay светильников с диммированием.
 * Стандарт: до 300 строк.
 */

function initBIMLighting(scene) {
  // 1. Scene Ambient & Directional Sun Lighting
  bimAmbientLight = new THREE.AmbientLight(0xf1f5f9, 0.75);
  scene.add(bimAmbientLight);

  bimSunLight = new THREE.DirectionalLight(0xffffff, 1.15);
  bimSunLight.position.set(22, 45, 24);
  bimSunLight.castShadow = true;
  bimSunLight.shadow.mapSize.width = 2048;
  bimSunLight.shadow.mapSize.height = 2048;
  bimSunLight.shadow.camera.near = 0.5;
  bimSunLight.shadow.camera.far = 120;
  const d = 32;
  bimSunLight.shadow.camera.left = -d;
  bimSunLight.shadow.camera.right = d;
  bimSunLight.shadow.camera.top = d;
  bimSunLight.shadow.camera.bottom = -d;
  bimSunLight.shadow.bias = -0.0003;
  bimSunLight.shadow.normalBias = 0.025;
  scene.add(bimSunLight);

  bimFillLight = new THREE.DirectionalLight(0xe2e8f0, 0.40);
  bimFillLight.position.set(-25, 22, -18);
  scene.add(bimFillLight);

  // 2. Reactive Equipment Lights
  ovenLight = new THREE.PointLight(0xf97316, 0.9, 16);
  ovenLight.position.set(-16.5, 2.4, -5.8);
  scene.add(ovenLight);

  chillerLight = new THREE.PointLight(0x38bdf8, 0.5, 18);
  chillerLight.position.set(-0.8, 2.6, -10.0);
  scene.add(chillerLight);

  storageLight = new THREE.PointLight(0x2dd4bf, 0.5, 16);
  storageLight.position.set(16, 2.5, 4);
  scene.add(storageLight);

  // 3. Overhead Structural Trusses (Стальные фермы перекрытия цеха)
  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x222c3d,
    roughness: 0.6,
    metalness: 0.55
  });

  const trussZPositions = [-10.5, -5.2, 0.0, 5.2, 10.5];
  for (let tz of trussZPositions) {
    const trussBeam = createMesh(new THREE.BoxGeometry(52.6, 0.35, 0.22), trussMat);
    trussBeam.position.set(0, 4.45, tz);
    scene.add(trussBeam);

    const lowerChord = createMesh(new THREE.BoxGeometry(52.6, 0.15, 0.18), trussMat);
    lowerChord.position.set(0, 4.05, tz);
    scene.add(lowerChord);

    for (let tx = -24; tx <= 24; tx += 6) {
      const strut = createMesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), trussMat);
      strut.position.set(tx, 4.25, tz);
      scene.add(strut);
    }
  }

  // 4. Industrial Linear High-Bay LED Luminaire Builder
  function createLinearLuminaire(x, z, length, zoneId, zoneName, lightColorHex) {
    const lumGroup = new THREE.Group();
    lumGroup.position.set(x, 4.05, z);

    // Aluminium Housing
    const housingGeo = new THREE.BoxGeometry(0.24, 0.1, length);
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 });
    const housing = createMesh(housingGeo, housingMat);
    lumGroup.add(housing);

    // End caps
    const capGeo = new THREE.BoxGeometry(0.26, 0.11, 0.04);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const capFront = createMesh(capGeo, capMat);
    capFront.position.set(0, 0, length / 2);
    lumGroup.add(capFront);
    const capBack = createMesh(capGeo, capMat);
    capBack.position.set(0, 0, -length / 2);
    lumGroup.add(capBack);

    // Glowing Diffuser Lens
    const lensGeo = new THREE.PlaneGeometry(0.2, length * 0.94);
    const lensMat = new THREE.MeshStandardMaterial({
      color: lightColorHex,
      emissive: lightColorHex,
      emissiveIntensity: 0.95,
      roughness: 0.2
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, -0.052, 0);
    lens.userData.origMaterial = lensMat;
    lens.userData.system = 'lighting';
    lumGroup.add(lens);

    // Downward Industrial Spotlight
    const lumSpot = new THREE.SpotLight(lightColorHex, 0.85, 14, Math.PI / 3.2, 0.45, 1.2);
    lumSpot.position.set(0, -0.1, 0);
    lumSpot.target.position.set(0, -4.0, 0);
    lumGroup.add(lumSpot);
    lumGroup.add(lumSpot.target);

    // Volumetric Translucent Light Cone (Visible light beam in air)
    const coneGeo = new THREE.CylinderGeometry(0.2, length * 0.72, 3.8, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: lightColorHex,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(0, -1.95, 0);
    coneMesh.userData.isLightCone = true;
    coneMesh.userData.origMaterial = coneMat;
    coneMesh.userData.system = 'lighting';
    lumGroup.add(coneMesh);
    if (!window.lightCones) window.lightCones = [];
    window.lightCones.push({ mesh: coneMesh, mat: coneMat, lensMat: lensMat });

    // Suspension Steel Drop Cables
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    for (let cz of [-length * 0.4, length * 0.4]) {
      const dropCable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 6), cableMat);
      dropCable.position.set(0, 0.25, cz);
      dropCable.userData.origMaterial = cableMat;
      dropCable.userData.system = 'lighting';
      lumGroup.add(dropCable);
    }

    lumGroup.userData = {
      system: 'lighting',
      interactive: true,
      title: 'LED СВЕТИЛЬНИК HIGH-BAY IP65',
      zone: zoneName,
      modbus: 'HR:0030..0032 (Линия ' + zoneId.toUpperCase() + ')',
      desc: 'Промышленный линейный светодиодный светильник пищевого цеха (IP65, 5000K, 120 Лм/Вт, DALI диммирование).',
      telemetryFn: (d) => {
        const l = d.lighting || { bakery: 100, glazing: 100, storage: 100 };
        const key = zoneId === 'z1' ? 'bakery' : zoneId === 'z2' ? 'glazing' : 'storage';
        const val = l[key] ?? 100;
        return {
          status: val > 30 ? 'РАБОЧИЙ РЕЖИМ (100%)' : 'ДЕЖУРНОЕ ОСВЕЩЕНИЕ (30%)',
          statusColor: val > 30 ? 'var(--green-light)' : 'var(--blue-light)',
          text: `Линия ${zoneId.toUpperCase()}: ${val}% яркости • DALI адрес: OK`
        };
      }
    };

    scene.add(lumGroup);
    clickableObjects.push(housing);
    overheadLuminaires.push(lumGroup);
    overheadLights.push(lumSpot);

    const fixtureRecord = { group: lumGroup, light: lumSpot, lens: lens, baseColor: lightColorHex };
    if (zoneLightingGroups[zoneId]) {
      zoneLightingGroups[zoneId].push(fixtureRecord);
    }
  }

  // Zone 1: Bakery Luminaires
  createLinearLuminaire(-16.8, -6.5, 5.0, 'z1', 'Зона 1: Выпечка (Печной зал)', 0xfff4e6);
  createLinearLuminaire(-16.8, 3.5, 5.0, 'z1', 'Зона 1: Выпечка (Технологический проход)', 0xfff4e6);

  // Zone 2: Chocolate / Glazing Luminaires
  createLinearLuminaire(0.0, -6.0, 5.2, 'z2', 'Зона 2: Шоколад (Чиллерная зона)', 0xf0f6fc);
  createLinearLuminaire(0.0, 0.0, 5.8, 'z2', 'Зона 2: Шоколад (Конвейер глазировки)', 0xf8fafc);
  createLinearLuminaire(0.0, 6.0, 5.2, 'z2', 'Зона 2: Шоколад (Выход туннеля)', 0xf0f6fc);

  // Zone 3: Flour Storage Luminaires
  createLinearLuminaire(16.8, -5.0, 5.2, 'z3', 'Зона 3: Склад (Стеллажи муки)', 0xf1f5f9);
  createLinearLuminaire(16.8, 4.0, 5.2, 'z3', 'Зона 3: Склад (Док-рампа)', 0xf1f5f9);
}
