/**
 * BIM HVAC VENTILATION SYSTEM
 * Модуль общецеховой приточно-вытяжной вентиляции, VAV-клапанов и диффузоров.
 * Стандарт: до 300 строк.
 */

function initBIMHVAC(scene) {
  const hvacGroup = new THREE.Group();
  hvacGroup.userData.system = 'hvac';
  scene.add(hvacGroup);

  const ductMat = new THREE.MeshStandardMaterial({ color: 0x3b4454, roughness: 0.45, metalness: 0.6 });
  const vavMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.4 });
  const diffMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.4 });
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.7 });

  // 1. Main Supply Duct Trunk (Центральный приточный воздуховод)
  const mainDuct = createMesh(new THREE.BoxGeometry(48, 0.7, 0.9), ductMat);
  mainDuct.position.set(0, 3.8, -1.5);
  mainDuct.userData = {
    system: 'hvac',
    interactive: true,
    title: 'МАГИСТРАЛЬНЫЙ ВОЗДУХОВОД ПРИТОКА (AHU-1)',
    zone: 'ОБЩЕЦЕХОВАЯ ВЕНТИЛЯЦИЯ // ПРИТОЧНЫЙ ТРАКТ',
    modbus: 'HR:0002 / HR:0012 / HR:0022',
    desc: 'Центральный оцинкованный воздуховод сечением 900x700 мм с огнезащитным покрытием и виброизоляцией. Раздает кондиционированный приток по технологическим зонам.',
    telemetryFn: (d) => {
      const avgFan = Math.round((d.zones.bakery.fan + d.zones.glazing.ac + d.zones.storage.dehum) / 3);
      return {
        status: avgFan > 0 ? 'АКТИВНАЯ ПОДАЧА ВОЗДУХА' : 'ДЕЖУРНЫЙ ПОДПОР',
        statusColor: 'var(--green-light)',
        text: `Скорость потока: ${(3.2 + avgFan * 0.03).toFixed(1)} м/с • Давление: 240 Па • Приток: +19.5 °C`
      };
    }
  };
  hvacGroup.add(mainDuct);
  clickableObjects.push(mainDuct);

  for (let x = -22; x <= 22; x += 4) {
    const flange = createMesh(new THREE.BoxGeometry(0.12, 0.82, 1.02), jointMat);
    flange.position.set(x, 3.8, -1.5);
    flange.userData = mainDuct.userData;
    hvacGroup.add(flange);
    clickableObjects.push(flange);
  }

  // 2. VAV-101 (Зона 1: Выпечка)
  const vavZ1 = createMesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), vavMat);
  vavZ1.position.set(-16, 3.8, -1.5);
  vavZ1.userData = {
    system: 'hvac',
    interactive: true,
    title: 'VAV-ТЕРМИНАЛ VAV-101 (AHU)',
    zone: 'ЗОНА 1: ВЫПЕЧКА // ПРИТОЧНЫЙ КЛАПАН',
    modbus: 'HR:0002 (Приточный клапан 0..100%)',
    desc: 'Клапан переменного расхода воздуха (Variable Air Volume). Подает кондиционированный приток в цех выпечки для плавной компенсации конвективного тепла от ротационных печей.',
    telemetryFn: (d) => ({
      status: d.zones.bakery.fan > 0 ? 'АКТИВЕН' : 'ОЖИДАНИЕ',
      statusColor: 'var(--green-light)',
      text: `Приток: ${d.zones.bakery.fan}% • Расход: ~${Math.round(d.zones.bakery.fan * 48)} м³/ч`
    })
  };
  hvacGroup.add(vavZ1);
  clickableObjects.push(vavZ1);

  const ledZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
  ledZ1.position.set(-16, 4.2, -0.75);
  ledZ1.userData.origMaterial = ledZ1.material;
  hvacGroup.add(ledZ1);

  // 3. VAV-201 (Зона 2: Шоколад HACCP)
  const vavZ2 = createMesh(new THREE.BoxGeometry(1.8, 1.3, 1.5), vavMat);
  vavZ2.position.set(0, 3.8, -1.5);
  vavZ2.userData = {
    system: ['hvac', 'cooling'],
    interactive: true,
    title: 'VAV-ТЕРМИНАЛ VAV-201 (AHU ЧИСТОЙ ЗОНЫ)',
    zone: 'ЗОНА 2: ШОКОЛАД [HACCP КРИТИЧЕСКИЙ КОНТУР]',
    modbus: 'HR:0012, HR:0013 (Микроклимат чистой зоны)',
    desc: 'Центральный приточный агрегат чистой зоны. Поддерживает стерильный ламинарный подпор воздуха с фильтрацией F7/H13 для предотвращения конденсации на глазури.',
    telemetryFn: (d) => ({
      status: 'HACCP КОНТУР',
      statusColor: 'var(--blue-light)',
      text: `Уставка SP: ${d.zones.glazing.target_temp.toFixed(1)} °C • Факт: ${d.zones.glazing.temp.toFixed(1)} °C`
    })
  };
  hvacGroup.add(vavZ2);
  clickableObjects.push(vavZ2);

  const ledZ2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  ledZ2.position.set(0, 4.3, -0.7);
  ledZ2.userData.origMaterial = ledZ2.material;
  hvacGroup.add(ledZ2);

  // 4. VAV-301 (Зона 3: Склад муки)
  const vavZ3 = createMesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), vavMat);
  vavZ3.position.set(16, 3.8, -1.5);
  vavZ3.userData = {
    interactive: true,
    title: 'VAV-ТЕРМИНАЛ VAV-301 (AHU СКЛАДА)',
    zone: 'ЗОНА 3: СКЛАД МУКИ // СУХОЕ ХРАНЕНИЕ',
    modbus: 'HR:0022 (Вентканал осушителя)',
    desc: 'Вентиляционный агрегат сухого склада. Обеспечивает рециркуляцию и распределение сухого воздуха от адсорбционного осушителя DH-301 над рядами паллетного хранения.',
    telemetryFn: (d) => ({
      status: d.zones.storage.dehum > 0 ? 'ОСУШЕНИЕ' : 'ДЕЖУРНЫЙ',
      statusColor: d.zones.storage.dehum > 0 ? 'var(--teal-light)' : 'var(--green-light)',
      text: `Осушитель: ${d.zones.storage.dehum}% • Влажность склада: ${d.zones.storage.hum.toFixed(0)}% Rh`
    })
  };
  hvacGroup.add(vavZ3);
  clickableObjects.push(vavZ3);

  const ledZ3 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0x2dd4bf }));
  ledZ3.position.set(16, 4.2, -0.75);
  ledZ3.userData.origMaterial = ledZ3.material;
  hvacGroup.add(ledZ3);

  // 5. Branch Drop Ducts & Ceiling Swirl Diffusers
  const dropCoords = [
    [-19, 3.5], [-13, 3.5],
    [-4, 4.2],  [4, 4.2],
    [13, 3.0],  [19, 3.0]
  ];

  dropCoords.forEach(([x, z]) => {
    const branchLen = Math.abs(z - (-1.5));
    const branchZ = (z + (-1.5)) / 2;
    const branch = createMesh(new THREE.BoxGeometry(0.45, 0.45, branchLen), ductMat);
    branch.position.set(x, 3.8, branchZ);
    hvacGroup.add(branch);

    const dropPipe = createMesh(new THREE.BoxGeometry(0.45, 1.1, 0.45), ductMat);
    dropPipe.position.set(x, 3.25, z);
    hvacGroup.add(dropPipe);

    const diffuser = createMesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), diffMat);
    diffuser.position.set(x, 2.7, z);
    diffuser.userData = {
      system: 'hvac',
      interactive: true,
      title: 'ПОТОЛОЧНЫЙ ДИФФУЗОР ПРИТОКА',
      zone: 'СИСТЕМА HVAC // ВОЗДУХОРАСПРЕДЕЛИТЕЛЬ',
      modbus: 'HR:0002 / HR:0012',
      desc: 'Вихревой диффузор равномерного распределения воздушного потока. Формирует комфортную подвижность воздуха без сквозняков над рабочей зоной.',
      telemetryFn: (d) => ({
        status: 'ПОДАЧА ВОЗДУХА',
        statusColor: 'var(--blue-light)',
        text: 'Скорость истечения струи: 1.8 м/с'
      })
    };
    hvacGroup.add(diffuser);
    clickableObjects.push(diffuser);
  });
}
