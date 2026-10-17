/**
 * BIM REFRIGERATED COLD STORAGE ROOM CC-301
 * Среднетемпературная холодильная камера хранения сырья (+2...+4 °C).
 * Непрерывный контур холодовой цепи HACCP кондитерского производства.
 * Стандарт: до 180 строк.
 */

function initBIMColdRoom(scene) {
  const coldRoomGroup = new THREE.Group();
  coldRoomGroup.position.set(19.2, 0, -8.6);
  coldRoomGroup.userData.system = 'cooling';

  // Materials
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xd8e2ed,
    roughness: 0.35,
    metalness: 0.3
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.6
  });
  const coldGlassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.45
  });
  const inoxMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.85
  });
  const coolAccentMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.4,
    metalness: 0.5
  });

  // 1. Isothermal Insulated Chamber Box (PUF Sandwich 100mm)
  // Main insulated enclosure: width 6.4, height 3.1, depth 4.8
  const chamberBox = createMesh(new THREE.BoxGeometry(6.4, 3.1, 4.8), panelMat);
  chamberBox.position.set(0, 1.55, 0);
  coldRoomGroup.add(chamberBox);

  // Plinth and corner trims
  const plinth = createMesh(new THREE.BoxGeometry(6.5, 0.14, 4.9), darkTrimMat);
  plinth.position.set(0, 0.07, 0);
  coldRoomGroup.add(plinth);

  const roofCap = createMesh(new THREE.BoxGeometry(6.5, 0.12, 4.9), darkTrimMat);
  roofCap.position.set(0, 3.16, 0);
  coldRoomGroup.add(roofCap);

  // 2. Heavy-Duty Cold Storage Swing Door
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-1.2, 0, 2.41);

  const doorLeaf = createMesh(new THREE.BoxGeometry(1.6, 2.3, 0.14), panelMat);
  doorLeaf.position.set(0, 1.15, 0);
  doorGroup.add(doorLeaf);

  const doorFrame = createMesh(new THREE.BoxGeometry(1.72, 2.42, 0.06), darkTrimMat);
  doorFrame.position.set(0, 1.21, -0.02);
  doorGroup.add(doorFrame);

  // Inspection Window on Cold Door
  const windowFrame = createMesh(new THREE.BoxGeometry(0.48, 0.72, 0.16), darkTrimMat);
  windowFrame.position.set(0, 1.45, 0);
  doorGroup.add(windowFrame);

  const windowGlass = createMesh(new THREE.BoxGeometry(0.38, 0.62, 0.08), coldGlassMat);
  windowGlass.position.set(0, 1.45, 0);
  doorGroup.add(windowGlass);

  // Heavy Stainless Steel Lever Latch
  const latch = createMesh(new THREE.BoxGeometry(0.06, 0.32, 0.16), inoxMat);
  latch.position.set(0.65, 1.15, 0.10);
  doorGroup.add(latch);

  coldRoomGroup.add(doorGroup);

  // 3. Monoblock Ceiling Evaporator / Air Cooler Unit
  const cooler = createMesh(new THREE.BoxGeometry(2.4, 0.55, 1.1), coolAccentMat);
  cooler.position.set(1.4, 2.7, 1.4);
  coldRoomGroup.add(cooler);

  for (let fx of [0.8, 2.0]) {
    const fanGrille = createMesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), darkTrimMat);
    fanGrille.rotation.x = Math.PI / 2;
    fanGrille.position.set(fx, 2.7, 1.96);
    coldRoomGroup.add(fanGrille);
  }

  // 4. Digital Temperature Controller (Eliwell / Danfoss)
  const ctrlBezel = createMesh(new THREE.BoxGeometry(0.34, 0.22, 0.04), darkTrimMat);
  ctrlBezel.position.set(0.65, 1.55, 2.42);
  coldRoomGroup.add(ctrlBezel);

  const ctrlScreen = createMesh(
    new THREE.BoxGeometry(0.26, 0.14, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
      roughness: 0.2
    })
  );
  ctrlScreen.position.set(0.65, 1.55, 2.44);
  coldRoomGroup.add(ctrlScreen);

  // Cold Chain Status Pilot
  const pilot = createMesh(
    new THREE.SphereGeometry(0.025, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 1.2
    })
  );
  pilot.position.set(0.85, 1.55, 2.44);
  coldRoomGroup.add(pilot);

  // 5. Refrigeration Pipe Risers to Overhead Loop
  for (let px of [-2.4, -2.1]) {
    const pipe = createMesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12), coolAccentMat);
    pipe.position.set(px, 3.7, -1.2);
    coldRoomGroup.add(pipe);
  }

  // SCADA Registration for Cold Room
  const coldRoomData = {
    system: 'cooling',
    interactive: true,
    rootGroup: coldRoomGroup,
    title: 'ХОЛОДИЛЬНАЯ КАМЕРА СЫРЬЯ CC-301 (HACCP)',
    zone: 'ЗОНА 3: СКЛАД МУКИ И СЫРЬЯ // ХОЛОДОВАЯ ЦЕПЬ',
    modbus: 'HR:0023 (Температура камеры хранения +2...+4 °C)',
    desc: 'Среднетемпературная модульная холодильная камера из сэндвич-панелей PIR 100 мм для хранения сливочного масла, шоколадной глазури и начинок. Работает непрерывно 24/7 как в дневную, так и в ночную смену.',
    telemetryFn: () => ({
      status: 'ХОЛОДОВАЯ ЦЕПЬ 24/7: НОРМА',
      statusColor: 'var(--blue-light)',
      text: 'Камера CC-301: +3.8 °C (норма +2.0...+4.0 °C) • Агрегат: Danfoss Optyma • Влажность: 65%'
    })
  };

  coldRoomGroup.userData = coldRoomData;
  coldRoomGroup.traverse((child) => {
    if (child.isMesh) {
      child.userData = coldRoomData;
      clickableObjects.push(child);
    }
  });

  scene.add(coldRoomGroup);
}
