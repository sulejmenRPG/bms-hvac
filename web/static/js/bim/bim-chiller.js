/**
 * BIM CHILLER PLANT & HYDRAULIC PIPING
 * Модуль прецизионного чиллера AC-201 и контура хладоносителя к глазировочной линии.
 * Стандарт: до 300 строк.
 */

function initBIMChiller(scene) {
  // =======================================================================
  // PRECISION PACKAGED CHILLER AC-201 & PIPING LOOP
  // =======================================================================
  const chillerGroup = new THREE.Group();
  chillerGroup.position.set(-0.8, 0, -11.2);
  chillerGroup.userData.system = 'cooling';

  const chillerPlinthMat = new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.9 });
  const chillerFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e2736, roughness: 0.55, metalness: 0.35 });
  const chillerPanelMat = new THREE.MeshStandardMaterial({ color: 0xc8cfd8, roughness: 0.45, metalness: 0.25 });
  const chillerDarkMetal = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.7 });
  const chillerGrilleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.4 });
  const chillerAccentMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.4,
    metalness: 0.5,
    side: THREE.DoubleSide
  });
  const fanBladeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.5 });
  const pipeSupplyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.3 });
  const pipeReturnMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.3 });
  const pipeSteelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.7 });

  // 1. Foundation Plinth & Anti-Vibration Mounts
  const plinth = createMesh(new THREE.BoxGeometry(3.6, 0.12, 1.6), chillerPlinthMat);
  plinth.position.set(0, 0.06, 0);
  chillerGroup.add(plinth);

  for (let vx of [-1.55, 1.55]) {
    for (let vz of [-0.65, 0.65]) {
      const isolator = createMesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 12), chillerDarkMetal);
      isolator.position.set(vx, 0.16, vz);
      chillerGroup.add(isolator);
    }
  }

  // 2. Base Structural Skid Frame
  const baseSkid = createMesh(new THREE.BoxGeometry(3.4, 0.15, 1.45), chillerFrameMat);
  baseSkid.position.set(0, 0.275, 0);
  chillerGroup.add(baseSkid);

  // 3. Lower Compressor Compartment
  const lowerCasing = createMesh(new THREE.BoxGeometry(3.3, 1.15, 1.35), chillerFrameMat);
  lowerCasing.position.set(0, 0.925, 0);
  chillerGroup.add(lowerCasing);

  // Front Service Double Doors (Upper half of lower compartment, y: 0.72..1.44)
  for (let dx of [-0.8, 0.8]) {
    const doorPanel = createMesh(new THREE.BoxGeometry(1.55, 0.72, 0.04), chillerPanelMat);
    doorPanel.position.set(dx, 1.08, 0.69);
    chillerGroup.add(doorPanel);

    const handle = createMesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), chillerDarkMetal);
    handle.position.set(dx + (dx < 0 ? 0.62 : -0.62), 1.08, 0.73);
    chillerGroup.add(handle);

    const lock = createMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), chillerAccentMat);
    lock.rotation.x = Math.PI / 2;
    lock.position.set(dx + (dx < 0 ? 0.62 : -0.62), 1.36, 0.72);
    chillerGroup.add(lock);
  }

  // Suction air intake louver strictly below doors (y: 0.35..0.65)
  const intakeLouver = createMesh(new THREE.BoxGeometry(3.1, 0.30, 0.04), chillerGrilleMat);
  intakeLouver.position.set(0, 0.50, 0.695);
  chillerGroup.add(intakeLouver);

  // 4. Upper Condenser Section
  const upperCasing = createMesh(new THREE.BoxGeometry(3.3, 0.7, 1.35), chillerPanelMat);
  upperCasing.position.set(0, 1.85, 0);
  chillerGroup.add(upperCasing);

  for (let sx of [-1.67, 1.67]) {
    const sideGrille = createMesh(new THREE.BoxGeometry(0.02, 0.55, 1.15), chillerGrilleMat);
    sideGrille.position.set(sx, 1.85, 0);
    chillerGroup.add(sideGrille);
  }

  // Top Twin Condenser Fan Cowls & Rotating Blades
  chillerFanBlades = [];
  for (let fx of [-0.85, 0.85]) {
    const cowl = createMesh(new THREE.CylinderGeometry(0.52, 0.48, 0.16, 24, 1, false), chillerAccentMat);
    cowl.position.set(fx, 2.26, 0);
    chillerGroup.add(cowl);

    const guardRing = createMesh(new THREE.TorusGeometry(0.48, 0.02, 8, 24), chillerDarkMetal);
    guardRing.rotation.x = Math.PI / 2;
    guardRing.position.set(fx, 2.34, 0);
    chillerGroup.add(guardRing);

    const fanImpeller = new THREE.Group();
    fanImpeller.position.set(fx, 2.24, 0);

    const hub = createMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), chillerDarkMetal);
    fanImpeller.add(hub);

    for (let b = 0; b < 4; b++) {
      const blade = createMesh(new THREE.BoxGeometry(0.38, 0.02, 0.1), fanBladeMat);
      blade.rotation.y = (b * Math.PI) / 2;
      blade.rotation.z = 0.18;
      blade.position.set(Math.cos((b * Math.PI) / 2) * 0.22, 0, Math.sin((b * Math.PI) / 2) * 0.22);
      fanImpeller.add(blade);
    }

    chillerGroup.add(fanImpeller);
    chillerFanBlades.push(fanImpeller);
  }

  // 5. Digital HMI Controller Panel
  const hmiBezel = createMesh(new THREE.BoxGeometry(0.44, 0.28, 0.04), chillerDarkMetal);
  hmiBezel.position.set(0.9, 1.55, 0.69);
  chillerGroup.add(hmiBezel);

  const hmiScreen = createMesh(
    new THREE.BoxGeometry(0.36, 0.18, 0.015),
    new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -1.0
    })
  );
  hmiScreen.position.set(0.9, 1.55, 0.72);
  chillerGroup.add(hmiScreen);

  const chillerPilot = createMesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.85
    })
  );
  chillerPilot.rotation.x = Math.PI / 2;
  chillerPilot.position.set(1.22, 1.55, 0.72);
  chillerGroup.add(chillerPilot);

  // 6. Refrigerant R410A High / Low Gauges
  for (let gi = 0; gi < 2; gi++) {
    const gx = 0.35 + gi * 0.22;
    const gaugeBody = createMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), chillerFrameMat);
    gaugeBody.rotation.x = Math.PI / 2;
    gaugeBody.position.set(gx, 1.55, 0.70);
    chillerGroup.add(gaugeBody);

    const gaugeDial = createMesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.012, 16),
      new THREE.MeshStandardMaterial({
        color: gi === 0 ? 0xef4444 : 0x38bdf8,
        roughness: 0.3,
        polygonOffset: true,
        polygonOffsetFactor: -1.0,
        polygonOffsetUnits: -1.0
      })
    );
    gaugeDial.rotation.x = Math.PI / 2;
    gaugeDial.position.set(gx, 1.55, 0.728);
    chillerGroup.add(gaugeDial);
  }

  // 7. Chilled Water Nozzles and Flanges
  for (let fi = 0; fi < 2; fi++) {
    const flangeX = -1.25 + fi * 0.35;
    const nozzle = createMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 16), chillerDarkMetal);
    nozzle.position.set(flangeX, 2.25, -0.3);
    chillerGroup.add(nozzle);

    const flangeRing = createMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), fi === 0 ? pipeSupplyMat : pipeReturnMat);
    flangeRing.position.set(flangeX, 2.34, -0.3);
    chillerGroup.add(flangeRing);
  }

  // SCADA Registration for Chiller
  const chillerData = {
    system: 'cooling',
    interactive: true,
    rootGroup: chillerGroup,
    title: 'ПРЕЦИЗИОННЫЙ ЧИЛЛЕР AC-201',
    zone: 'ЗОНА 2: ШОКОЛАД [HACCP ККТ-1]',
    modbus: 'HR:0012 (Плавное инверторное охлаждение 0..100%)',
    desc: 'Прецизионный моноблочный водоохлаждающий чиллер с инверторным спиральным компрессором, ЕС-вентиляторами конденсатора и встроенным гидромодулем. Поддерживает точную температуру глазировочного туннеля (+16...+18 °C).',
    telemetryFn: (d) => {
      const acPower = (d.zones && d.zones.glazing) ? (d.zones.glazing.ac || 0) : 0;
      const tGlaze = (d.zones && d.zones.glazing) ? (d.zones.glazing.temp || 0) : 0;
      const tTarget = (d.zones && d.zones.glazing) ? (d.zones.glazing.target_temp || 19.0) : 19.0;
      const deltaT = (tGlaze - tTarget).toFixed(2);
      return {
        status: acPower > 0 ? `ОХЛАЖДЕНИЕ ${acPower}%` : 'ДЕЖУРНЫЙ РЕЖИМ',
        statusColor: acPower > 0 ? 'var(--blue-light)' : 'var(--green-light)',
        text: `Компрессор: ${acPower}% • Дельта T: ${deltaT} °C • Хладоноситель: +7.2 °C`
      };
    }
  };
  chillerGroup.userData = chillerData;

  chillerGroup.traverse((child) => {
    if (child.isMesh) {
      child.userData = chillerData;
      clickableObjects.push(child);
    }
  });
  scene.add(chillerGroup);

  // 8. Chilled Water Overhead Piping Loop to Cooling Tunnel
  const pipeGroup = new THREE.Group();
  pipeGroup.userData.system = 'cooling';
  const pipeRadius = 0.06;
  const pipeConfigs = [
    { mat: pipeSupplyMat, chillerLocalX: -1.25 },
    { mat: pipeReturnMat, chillerLocalX: -0.90 }
  ];

  for (let p = 0; p < pipeConfigs.length; p++) {
    const cfg = pipeConfigs[p];
    const worldX0 = chillerGroup.position.x + cfg.chillerLocalX;
    const worldZ0 = chillerGroup.position.z - 0.3;
    const riserH = 3.8 - 2.34;

    const riser = createMesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, riserH, 16), cfg.mat);
    riser.position.set(worldX0, 2.34 + riserH / 2, worldZ0);
    pipeGroup.add(riser);

    const valve = createMesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), pipeSteelMat);
    valve.position.set(worldX0, 2.7, worldZ0);
    pipeGroup.add(valve);

    const lever = createMesh(new THREE.BoxGeometry(0.24, 0.03, 0.05), pipeSupplyMat);
    lever.position.set(worldX0 + 0.12, 2.75, worldZ0);
    pipeGroup.add(lever);

    const runZLength = 2.5 - worldZ0;
    const horizZRun = createMesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, runZLength, 16), cfg.mat);
    horizZRun.rotation.x = Math.PI / 2;
    horizZRun.position.set(worldX0, 3.8, worldZ0 + runZLength / 2);
    pipeGroup.add(horizZRun);

    const targetTunnelX = p === 0 ? 2.1 : 2.5;
    const runXLength = targetTunnelX - worldX0;
    const horizXRun = createMesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, runXLength, 16), cfg.mat);
    horizXRun.rotation.z = Math.PI / 2;
    horizXRun.position.set(worldX0 + runXLength / 2, 3.8, 2.5);
    pipeGroup.add(horizXRun);

    const dropH = 3.8 - 2.15;
    const drop = createMesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, dropH, 16), cfg.mat);
    drop.position.set(targetTunnelX, 2.15 + dropH / 2, 2.5);
    pipeGroup.add(drop);

    const tunnelFlange = createMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16), pipeSteelMat);
    tunnelFlange.position.set(targetTunnelX, 2.18, 2.5);
    pipeGroup.add(tunnelFlange);
  }

  for (let hz of [-8.5, -4.5, -0.5]) {
    const hangerRod1 = createMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8), pipeSteelMat);
    hangerRod1.position.set(chillerGroup.position.x - 1.4, 4.12, hz);
    pipeGroup.add(hangerRod1);

    const hangerRod2 = createMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8), pipeSteelMat);
    hangerRod2.position.set(chillerGroup.position.x - 0.7, 4.12, hz);
    pipeGroup.add(hangerRod2);

    const crossStrut = createMesh(new THREE.BoxGeometry(0.85, 0.04, 0.06), pipeSteelMat);
    crossStrut.position.set(chillerGroup.position.x - 1.05, 3.75, hz);
    pipeGroup.add(crossStrut);
  }

  const pipeMetadata = {
    system: 'cooling',
    interactive: true,
    title: 'ТРАССА ХЛАДОНОСИТЕЛЯ (ПОДАЧА И ОБРАТКА)',
    zone: 'ЗОНА 2: ШОКОЛАД // КОНТУР ЧИЛЛЕРА AC-201',
    modbus: 'HR:0012 (Контур чиллера AC-201)',
    desc: 'Теплоизолированные стальные трубопроводы циркуляции пропиленгликоля (хладоноситель +4 °C) от чиллера AC-201 к секциям охлаждающего туннеля глазировочной линии.',
    telemetryFn: (d) => ({
      status: d.zones.glazing.ac > 0 ? `ЦИРКУЛЯЦИЯ (${d.zones.glazing.ac}%)` : 'ДЕЖУРНЫЙ ПОДПОР',
      statusColor: d.zones.glazing.ac > 0 ? 'var(--blue-light)' : 'var(--green-light)',
      text: `Подача: +4.0 °C • Обратка: +8.2 °C • Расход: ${(d.zones.glazing.ac * 0.14).toFixed(1)} м³/ч • P=2.8 бар`
    })
  };
  pipeGroup.userData = pipeMetadata;
  pipeGroup.traverse(c => {
    if (c.isMesh) {
      c.userData = pipeMetadata;
      clickableObjects.push(c);
    }
  });

  scene.add(pipeGroup);
}
