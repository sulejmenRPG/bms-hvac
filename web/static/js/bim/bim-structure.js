/**
 * BIM STRUCTURE & ARCHITECTURAL ENVELOPE
 * Модуль строительных конструкций (фундамент, полы, стены, перегородки, док-ворота).
 * Стандарт: до 300 строк.
 */

function initBIMStructure(scene) {
  // 1. Foundation Slab (Монолитная железобетонная плита цеха)
  const slabMat = new THREE.MeshStandardMaterial({
    color: 0x111622,
    roughness: 0.85,
    metalness: 0.15
  });
  const slab = createMesh(new THREE.BoxGeometry(54, 0.8, 28), slabMat, false, true);
  slab.position.y = -0.4;
  scene.add(slab);

  // 2. Floor Zone Decals (Санитарные наливные полы с polygonOffset)
  const floorZ1Mat = new THREE.MeshStandardMaterial({
    color: 0x222634,
    roughness: 0.65,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0
  });
  const floorZ1 = createMesh(new THREE.PlaneGeometry(16.8, 24.8), floorZ1Mat, false, true);
  floorZ1.rotation.x = -Math.PI / 2;
  floorZ1.position.set(-16.8, 0.035, 0);
  scene.add(floorZ1);

  const floorZ2Mat = new THREE.MeshStandardMaterial({
    color: 0x182438,
    roughness: 0.35,
    metalness: 0.22,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0
  });
  const floorZ2 = createMesh(new THREE.PlaneGeometry(16.8, 24.8), floorZ2Mat, false, true);
  floorZ2.rotation.x = -Math.PI / 2;
  floorZ2.position.set(0, 0.035, 0);
  scene.add(floorZ2);

  const floorZ3Mat = new THREE.MeshStandardMaterial({
    color: 0x1a212e,
    roughness: 0.7,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0
  });
  const floorZ3 = createMesh(new THREE.PlaneGeometry(16.8, 24.8), floorZ3Mat, false, true);
  floorZ3.rotation.x = -Math.PI / 2;
  floorZ3.position.set(16.8, 0.035, 0);
  scene.add(floorZ3);

  // 3. Forklift Safety Traffic Lines (Zone 3)
  const yellowLineMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0
  });
  const trackLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 18), yellowLineMat);
  trackLine1.rotation.x = -Math.PI / 2;
  trackLine1.position.set(19.5, 0.055, 2);
  scene.add(trackLine1);

  const trackLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 18), yellowLineMat);
  trackLine2.rotation.x = -Math.PI / 2;
  trackLine2.position.set(23.5, 0.055, 2);
  scene.add(trackLine2);

  // 4. Architectural Cutaway Sandwich Walls (Сэндвич-панели цеха)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x263346, roughness: 0.65, metalness: 0.2 });

  // North Back Wall
  const northWall = createMesh(new THREE.BoxGeometry(52, 3.2, 0.6), wallMat);
  northWall.position.set(0, 1.6, -12.7);
  scene.add(northWall);

  // South Front Wall
  const southWall = createMesh(new THREE.BoxGeometry(52, 0.9, 0.6), wallMat);
  southWall.position.set(0, 0.45, 12.7);
  scene.add(southWall);

  // West Wall
  const westWall = createMesh(new THREE.BoxGeometry(0.6, 2.2, 26), wallMat);
  westWall.position.set(-25.5, 1.1, 0);
  scene.add(westWall);

  // East Wall with Dock Door cutout
  const eastWallBack = createMesh(new THREE.BoxGeometry(0.6, 2.2, 17), wallMat);
  eastWallBack.position.set(25.5, 1.1, -4.5);
  scene.add(eastWallBack);

  const eastWallTop = createMesh(new THREE.BoxGeometry(0.6, 0.8, 9), wallMat);
  eastWallTop.position.set(25.5, 2.7, 8.5);
  scene.add(eastWallTop);

  // 5. Sanitary Partition Walls (Перегородки между зонами)
  // Partition Wall 1-2 (Выпечка / Глазировка)
  const part1Back = createMesh(new THREE.BoxGeometry(0.4, 2.4, 9), wallMat);
  part1Back.position.set(-8.4, 1.2, -8.0);
  scene.add(part1Back);
  const part1Front = createMesh(new THREE.BoxGeometry(0.4, 2.4, 9), wallMat);
  part1Front.position.set(-8.4, 1.2, 8.0);
  scene.add(part1Front);
  const part1Lintel = createMesh(new THREE.BoxGeometry(0.4, 0.4, 7), wallMat);
  part1Lintel.position.set(-8.4, 2.2, 0);
  scene.add(part1Lintel);

  // Partition Wall 2-3 (Глазировка / Склад)
  const part2Back = createMesh(new THREE.BoxGeometry(0.4, 2.4, 9), wallMat);
  part2Back.position.set(8.4, 1.2, -8.0);
  scene.add(part2Back);
  const part2Front = createMesh(new THREE.BoxGeometry(0.4, 2.4, 9), wallMat);
  part2Front.position.set(8.4, 1.2, 8.0);
  scene.add(part2Front);
  const part2Lintel = createMesh(new THREE.BoxGeometry(0.4, 0.4, 7), wallMat);
  part2Lintel.position.set(8.4, 2.2, 0);
  scene.add(part2Lintel);

  // 6. Sectional Loading Dock Door & Warehouse Dock Shelter
  const dockGateMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.5,
    metalness: 0.4
  });
  dockDoorMesh = createMesh(new THREE.BoxGeometry(0.12, 2.3, 4.8), dockGateMat);
  dockDoorMesh.position.set(25.12, 1.15, 8.5);
  dockDoorMesh.userData = {
    interactive: true,
    title: 'СЕКЦИОННЫЕ ДОК-ВОРОТА РАМПЫ',
    zone: 'ЗОНА 3: СКЛАД МУКИ // ЗОНА РАЗГРУЗКИ',
    modbus: 'DI:0005 (Концевик положения полотна)',
    desc: 'Подъемно-секционные герметичные ворота погрузочного дока. При открытии в дождливую погоду контроллер предиктивно включает осушитель DH-301.',
    action: { label: 'Тест: Открыть/Закрыть ворота', fnName: 'toggleBay' },
    telemetryFn: (d) => ({
      status: d.bay_door_open ? 'ВОРОТА ОТКРЫТЫ (Разгрузка)' : 'ГЕРМЕТИЧНО ЗАКРЫТЫ',
      statusColor: d.bay_door_open ? 'var(--red)' : 'var(--green)',
      text: `Положение: ${d.bay_door_open ? 'ПОДНЯТЫ (+25% влажности)' : 'ОПУЩЕНЫ (Изоляция)'}`
    })
  };
  scene.add(dockDoorMesh);
  clickableObjects.push(dockDoorMesh);

  // Exterior Dock Shelter Frame (Фасадное уплотнение)
  const shelterMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.2 });
  const shelterTop = createMesh(new THREE.BoxGeometry(0.35, 0.22, 5.2), shelterMat);
  shelterTop.position.set(25.95, 2.36, 8.5);
  scene.add(shelterTop);

  for (let sz of [5.95, 11.05]) {
    const shelterPost = createMesh(new THREE.BoxGeometry(0.35, 2.36, 0.22), shelterMat);
    shelterPost.position.set(25.95, 1.18, sz);
    scene.add(shelterPost);
  }

  // Steel Dock Leveler Plate (Перегрузочный мост)
  const levelerMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0
  });
  const dockLeveler = createMesh(new THREE.BoxGeometry(1.8, 0.04, 3.8), levelerMat);
  dockLeveler.position.set(26.1, 0.02, 8.5);
  scene.add(dockLeveler);

  // Concrete Outdoor Truck Apron / Ramp
  const rampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
  const outdoorRamp = createMesh(new THREE.BoxGeometry(5.2, 0.5, 6.2), rampMat);
  outdoorRamp.position.set(29.65, -0.25, 8.5);
  scene.add(outdoorRamp);

  // Parked Freight Delivery Truck at Dock Shelter
  const truckGroup = new THREE.Group();
  truckGroup.position.set(31.5, 0.0, 8.5);
  const trailerBody = createMesh(new THREE.BoxGeometry(6.8, 2.7, 3.1), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 }));
  trailerBody.position.set(0, 1.45, 0);
  truckGroup.add(trailerBody);
  const wheelsMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
  for (let wx of [-1.8, -0.6, 1.8]) {
    for (let wz of [-1.55, 1.55]) {
      const wheel = createMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 14), wheelsMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.38, wz);
      truckGroup.add(wheel);
    }
  }
  scene.add(truckGroup);

  // 7. Overhead Structural Steel Columns and Roof Trusses (Каркас перекрытия)
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e2736, roughness: 0.55, metalness: 0.75 });
  const columnPositions = [
    [-16.8, -12.4], [-16.8, 12.4],
    [0.0, -12.4],   [0.0, 12.4],
    [16.8, -12.4],  [16.8, 12.4]
  ];
  columnPositions.forEach(([cx, cz]) => {
    const col = createMesh(new THREE.BoxGeometry(0.32, 4.6, 0.32), steelMat);
    col.position.set(cx, 2.3, cz);
    scene.add(col);
  });

  // Transverse Roof I-Beam Trusses at height y = 4.45m
  for (let tx of [-16.8, 0.0, 16.8]) {
    const truss = createMesh(new THREE.BoxGeometry(0.24, 0.45, 25.2), steelMat);
    truss.position.set(tx, 4.45, 0);
    scene.add(truss);
  }

  // Longitudinal Roof Tie-Beams (Продольные связевые балки)
  for (let lz of [-12.4, 12.4]) {
    const tieBeam = createMesh(new THREE.BoxGeometry(50.4, 0.22, 0.24), steelMat);
    tieBeam.position.set(0, 4.45, lz);
    scene.add(tieBeam);
  }

  // 8. Industrial Safety Floor Markings (HACCP Safe Walkway & Hazard Zones)
  const hazardMat = new THREE.MeshBasicMaterial({ color: 0xeab308, polygonOffset: true, polygonOffsetFactor: -2.0, polygonOffsetUnits: -2.0 });
  const safeWalkMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.28, polygonOffset: true, polygonOffsetFactor: -2.0, polygonOffsetUnits: -2.0 });

  // Green Safe Pedestrian Corridor across plant along z = 5.2
  const walkCorridor = new THREE.Mesh(new THREE.PlaneGeometry(48.0, 1.2), safeWalkMat);
  walkCorridor.rotation.x = -Math.PI / 2;
  walkCorridor.position.set(0, 0.045, 5.2);
  scene.add(walkCorridor);

  // Yellow Hazard Perimeter Box around Bakery Ovens (-16.5, -5.8)
  const ovenPerim = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.4, 4), hazardMat);
  ovenPerim.rotation.x = -Math.PI / 2;
  ovenPerim.rotation.z = Math.PI / 4;
  ovenPerim.position.set(-16.5, 0.048, -5.8);
  scene.add(ovenPerim);

  // Yellow Hazard Perimeter Box around Precision Chiller AC-201 (-0.8, -11.2)
  const chillerPerim = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.25, 4), hazardMat);
  chillerPerim.rotation.x = -Math.PI / 2;
  chillerPerim.rotation.z = Math.PI / 4;
  chillerPerim.position.set(-0.8, 0.048, -11.2);
  scene.add(chillerPerim);
}
