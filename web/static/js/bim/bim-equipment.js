/**
 * BIM INDUSTRIAL PROCESS EQUIPMENT
 * Модуль технологического оборудования (печи, конвейер, осушитель, стеллажи).
 * Чиллер AC-201 вынесен в bim-chiller.js.
 * Стандарт: до 300 строк.
 */

function initBIMEquipment(scene) {
  // =======================================================================
  // 1. ZONE 1: BAKERY OVENS & EXHAUST HOOD
  // =======================================================================
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.8 });
  const exhaustHood = createMesh(new THREE.BoxGeometry(8.5, 0.6, 4.4), hoodMat);
  exhaustHood.position.set(-16.5, 2.9, -5.8);
  exhaustHood.userData = {
    system: ['thermal', 'hvac'],
    interactive: true,
    title: 'ВЫТЯЖНОЙ ЗОНТ ВЗ-101',
    zone: 'ЗОНА 1: ВЫПЕЧКА // ВЫТЯЖНОЙ КОНТУР',
    modbus: 'HR:0002 (Производительность вытяжки 0..100%)',
    desc: 'Промышленный зонт местного отсоса из нержавеющей стали AISI 304 со спаренными огнезадерживающими клапанами и вытяжными вентиляторами.',
    telemetryFn: (d) => ({
      status: 'ВЫТЯЖКА АКТИВНА',
      statusColor: 'var(--green-light)',
      text: `Тяга вентилятора: ${d.zones.bakery.fan}% • Скорость в сечении: ${(d.zones.bakery.fan * 0.12).toFixed(1)} м/с`
    })
  };
  scene.add(exhaustHood);
  clickableObjects.push(exhaustHood);

  const flueMeta = {
    system: ['thermal', 'hvac'],
    interactive: true,
    title: 'ГАЗООТВОДЯЩИЙ КАНАЛ ПЕЧИ (AISI 316)',
    zone: 'ЗОНА 1: ВЫПЕЧКА // ДЫМОУДАЛЕНИЕ',
    modbus: 'HR:0000 (Тепловой контур)',
    desc: 'Жаростойкий дымовой канал отвода горячих газов от ротационной печи в вытяжной зонт ВЗ-101.',
    telemetryFn: (d) => ({
      status: d.oven_open ? 'ПИКОВЫЙ СБРОС ТЕПЛА' : 'ТЯГА В НОРМЕ',
      statusColor: d.oven_open ? 'var(--red)' : 'var(--green-light)',
      text: `Температура дыма: ${d.oven_open ? '195 °C' : '145 °C'} • Тяга зонта: ${d.zones.bakery.fan}%`
    })
  };
  const flue1 = createMesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 16), hoodMat);
  flue1.position.set(-19, 3.9, -5.8);
  flue1.userData = flueMeta;
  scene.add(flue1);
  clickableObjects.push(flue1);

  const flue2 = createMesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 16), hoodMat);
  flue2.position.set(-14, 3.9, -5.8);
  flue2.userData = flueMeta;
  scene.add(flue2);
  clickableObjects.push(flue2);

  const ovenMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5, metalness: 0.5 });
  const ovenGlassMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });

  // Oven 1
  const oven1 = createMesh(new THREE.BoxGeometry(3.4, 2.7, 3.2), ovenMat);
  oven1.position.set(-19, 1.35, -5.8);
  oven1.userData = {
    system: 'thermal',
    interactive: true,
    title: 'РОТАЦИОННАЯ ПЕЧЬ №1 (L-200)',
    zone: 'ЗОНА 1: ВЫПЕЧКА // ТЕПЛОВОЙ УЗЕЛ',
    modbus: 'HR:0000..0001 (Тепловой контур выпечки)',
    desc: 'Промышленная ротационная печь со вращающейся тележкой. Рабочая температура 180-220 °C. Оснащена датчиком герметичности створок.',
    action: { label: 'Тест: Открыть/Закрыть печь', fnName: 'toggleOven' },
    telemetryFn: (d) => ({
      status: d.oven_open ? 'СТВОРКИ ОТКРЫТЫ' : 'РАБОТА ШТАТНО',
      statusColor: d.oven_open ? 'var(--red)' : 'var(--green-light)',
      text: `Температура: ${d.zones.bakery.temp.toFixed(1)} °C • Выброс тепла: ${d.oven_open ? '+5.0 °C' : 'НЕТ'}`
    })
  };
  scene.add(oven1);
  clickableObjects.push(oven1);

  ovenDoor1 = new THREE.Group();
  ovenDoor1.userData.system = 'thermal';
  ovenDoor1.position.set(-19 + 1.7, 1.35, -5.8 + 1.6);
  const doorMesh1 = createMesh(new THREE.BoxGeometry(1.8, 2.5, 0.12), ovenMat);
  doorMesh1.position.set(-0.9, 0, 0);
  const glass1 = createMesh(new THREE.BoxGeometry(1.2, 1.4, 0.14), ovenGlassMat);
  glass1.position.set(-0.9, 0.2, 0);
  const handle1 = createMesh(new THREE.BoxGeometry(0.08, 0.9, 0.1), handleMat);
  handle1.position.set(-1.6, 0.1, 0.1);
  doorMesh1.add(glass1);
  doorMesh1.add(handle1);
  ovenDoor1.add(doorMesh1);
  scene.add(ovenDoor1);

  // Oven 2
  const oven2 = createMesh(new THREE.BoxGeometry(3.4, 2.7, 3.2), ovenMat);
  oven2.position.set(-14, 1.35, -5.8);
  oven2.userData = {
    system: 'thermal',
    interactive: true,
    title: 'РОТАЦИОННАЯ ПЕЧЬ №2 (L-200)',
    zone: 'ЗОНА 1: ВЫПЕЧКА // ТЕПЛОВОЙ УЗЕЛ',
    modbus: 'HR:0000..0001 (Тепловой контур выпечки)',
    desc: 'Ротационная печь второй линии. При открытии створок нагретый воздух эвакуируется через вытяжной зонт ВЗ-101.',
    action: { label: 'Тест: Открыть/Закрыть печь', fnName: 'toggleOven' },
    telemetryFn: (d) => ({
      status: d.oven_open ? 'СТВОРКИ ОТКРЫТЫ' : 'РАБОТА ШТАТНО',
      statusColor: d.oven_open ? 'var(--red)' : 'var(--green-light)',
      text: `Температура: ${d.zones.bakery.temp.toFixed(1)} °C • ТЭНы активны`
    })
  };
  scene.add(oven2);
  clickableObjects.push(oven2);

  ovenDoor2 = new THREE.Group();
  ovenDoor2.userData.system = 'thermal';
  ovenDoor2.position.set(-14 + 1.7, 1.35, -5.8 + 1.6);
  const doorMesh2 = createMesh(new THREE.BoxGeometry(1.8, 2.5, 0.12), ovenMat);
  doorMesh2.position.set(-0.9, 0, 0);
  const glass2 = createMesh(new THREE.BoxGeometry(1.2, 1.4, 0.14), ovenGlassMat);
  glass2.position.set(-0.9, 0.2, 0);
  const handle2 = createMesh(new THREE.BoxGeometry(0.08, 0.9, 0.1), handleMat);
  handle2.position.set(-1.6, 0.1, 0.1);
  doorMesh2.add(glass2);
  doorMesh2.add(handle2);
  ovenDoor2.add(doorMesh2);
  scene.add(ovenDoor2);

  // =======================================================================
  // 2. ZONE 2: CONFECTIONERY CONVEYOR & COOLING TUNNEL
  // =======================================================================
  const stainlessMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.1 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.6 });

  const conveyorFrame = createMesh(new THREE.BoxGeometry(13.5, 0.25, 1.8), stainlessMat);
  conveyorFrame.position.set(0, 0.9, 2.5);
  conveyorFrame.userData = {
    system: 'cooling',
    interactive: true,
    title: 'КОНВЕЙЕРНАЯ ЛИНИЯ ГЛАЗИРОВКИ (HACCP ККТ-1)',
    zone: 'ЗОНА 2: ШОКОЛАД [HACCP]',
    modbus: 'HR:0010..0013 (Климат чистой зоны)',
    desc: 'Автоматическая линия глазирования бисквитных тортов с охлаждающим туннелем застывания шоколада. Требует строгого соблюдения +16..+18 °C.',
    telemetryFn: (d) => ({
      status: 'ЛИНИЯ В РАБОТЕ (НОРМА)',
      statusColor: 'var(--green-light)',
      text: `Скорость: 0.8 м/мин • Температура в туннеле: ${d.zones.glazing.temp.toFixed(1)} °C`
    })
  };
  scene.add(conveyorFrame);
  clickableObjects.push(conveyorFrame);

  const belt = createMesh(new THREE.BoxGeometry(13.2, 0.05, 1.4), beltMat);
  belt.position.set(0, 1.05, 2.5);
  belt.userData.system = 'cooling';
  scene.add(belt);

  for (let lx = -6.0; lx <= 6.0; lx += 3.0) {
    const leg1 = createMesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), stainlessMat);
    leg1.position.set(lx, 0.4, 1.7);
    leg1.userData.system = 'cooling';
    scene.add(leg1);
    const leg2 = createMesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), stainlessMat);
    leg2.position.set(lx, 0.4, 3.3);
    leg2.userData.system = 'cooling';
    scene.add(leg2);
  }

  const enrober = createMesh(new THREE.BoxGeometry(2.4, 1.8, 2.2), copperMat);
  enrober.position.set(-4.5, 1.7, 2.5);
  enrober.userData = conveyorFrame.userData;
  scene.add(enrober);
  clickableObjects.push(enrober);

  const tunnel = createMesh(new THREE.BoxGeometry(5.5, 1.3, 2.0), stainlessMat);
  tunnel.position.set(2.5, 1.5, 2.5);
  tunnel.userData = conveyorFrame.userData;
  scene.add(tunnel);
  clickableObjects.push(tunnel);

  // Moving Chocolate Cakes
  const cakeGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.22, 16);
  const cakeMat = new THREE.MeshStandardMaterial({ color: 0x2b1408, roughness: 0.3, metalness: 0.1 });
  conveyorCakes = [];
  for (let c = 0; c < 7; c++) {
    const cake = createMesh(cakeGeo, cakeMat);
    cake.position.set(-5.5 + c * 1.8, 1.18, 2.5);
    cake.userData.system = 'cooling';
    scene.add(cake);
    conveyorCakes.push(cake);
  }

  // =======================================================================
  // 3. ZONE 3: WAREHOUSE DEHUMIDIFIER & PALLET RACKS
  // =======================================================================
  const rackOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5, metalness: 0.3 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const sackMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 });

  function createPalletBay(bx, bz) {
    const bayGroup = new THREE.Group();
    for (let px of [-1.4, 1.4]) for (let pz of [-0.9, 0.9]) {
      const post = createMesh(new THREE.BoxGeometry(0.12, 3.2, 0.12), rackOrangeMat);
      post.position.set(px, 1.6, pz);
      bayGroup.add(post);
    }
    for (let tier of [0.8, 2.0]) {
      for (let side of [0.9, -0.9]) {
        const beam = createMesh(new THREE.BoxGeometry(2.9, 0.12, 0.08), rackOrangeMat);
        beam.position.set(0, tier, side);
        bayGroup.add(beam);
      }
      const pallet = createMesh(new THREE.BoxGeometry(2.6, 0.12, 1.6), woodMat);
      pallet.position.set(0, tier + 0.1, 0);
      bayGroup.add(pallet);
      for (let sx of [-0.7, 0.7]) for (let sz of [-0.4, 0.4]) {
        const sack = createMesh(new THREE.BoxGeometry(1.0, 0.35, 0.6), sackMat);
        sack.position.set(sx, tier + 0.32, sz);
        bayGroup.add(sack);
      }
    }
    bayGroup.position.set(bx, 0, bz);
    bayGroup.userData = {
      interactive: true,
      title: 'СТЕЛЛАЖИ ХРАНЕНИЯ СЫРЬЯ (МУКА И САХАР)',
      zone: 'ЗОНА 3: СКЛАД МУКИ // ХРАНЕНИЕ',
      modbus: 'HR:0021 (Датчик влажности сырья)',
      desc: 'Фронтальные паллетные стеллажи для сыпучего сырья в мешках по 50 кг. Предельный регламент хранения: не более 50% относительной влажности.',
      telemetryFn: (d) => ({
        status: d.zones.storage.hum > 50 ? 'ПРЕВЫШЕНИЕ ВЛАЖНОСТИ!' : 'НОРМА ХРАНЕНИЯ',
        statusColor: d.zones.storage.hum > 50 ? 'var(--red)' : 'var(--green-light)',
        text: `Текущая влажность: ${d.zones.storage.hum.toFixed(0)}% Rh • Лимит: < 50%`
      })
    };
    bayGroup.traverse((child) => {
      if (child.isMesh) {
        child.userData = bayGroup.userData;
        clickableObjects.push(child);
      }
    });
    scene.add(bayGroup);
  }

  createPalletBay(13.5, -6.5);
  createPalletBay(18.5, -6.5);

  // Dehumidifier DH-301
  const dehum = createMesh(new THREE.BoxGeometry(2.2, 1.8, 1.6), new THREE.MeshStandardMaterial({ color: 0x2dd4bf, roughness: 0.4, metalness: 0.5 }));
  dehum.position.set(13.5, 0.9, 4.0);
  dehum.userData = {
    system: 'hvac',
    interactive: true,
    title: 'КАНАЛЬНЫЙ ОСУШИТЕЛЬ ВОЗДУХА DH-301',
    zone: 'ЗОНА 1..3: СКЛАД МУКИ // СУХОЙ СКЛАД',
    modbus: 'HR:0022 (Осушитель воздуха 0..100%)',
    desc: 'Адсорбционный роторный осушитель промышленного типа. Автоматически форсируется контроллером при открытии ворот рампы для защиты сырья от сырости.',
    telemetryFn: (d) => ({
      status: d.zones.storage.dehum > 0 ? `ОСУШЕНИЕ ${d.zones.storage.dehum}%` : 'НОРМА (СУХО)',
      statusColor: d.zones.storage.dehum > 0 ? 'var(--teal-light)' : 'var(--green-light)',
      text: `Мощность ротора: ${d.zones.storage.dehum}% • Влажность склада: ${d.zones.storage.hum.toFixed(0)}% Rh`
    })
  };
  scene.add(dehum);
  clickableObjects.push(dehum);

  // =======================================================================
  // 4. PROCESS FURNITURE: DOUGH TABLE, RACK TROLLEY & PACKAGING POST
  // =======================================================================
  const inoxMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 });
  const goldCrustMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4 });
  const boxWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

  // Zone 1: Stainless Steel Dough Preparation Table
  const prepTable = new THREE.Group();
  prepTable.position.set(-18.5, 0, 1.5);
  const top = createMesh(new THREE.BoxGeometry(3.2, 0.1, 1.4), inoxMat);
  top.position.set(0, 0.9, 0);
  prepTable.add(top);
  for (let lx of [-1.4, 1.4]) for (let lz of [-0.6, 0.6]) {
    const leg = createMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.88), inoxMat);
    leg.position.set(lx, 0.44, lz);
    prepTable.add(leg);
  }
  const bowl = createMesh(new THREE.CylinderGeometry(0.3, 0.2, 0.22, 16), inoxMat);
  bowl.position.set(-0.8, 1.05, 0);
  prepTable.add(bowl);
  for (let bi = 0; bi < 3; bi++) {
    const spongeMold = createMesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16), goldCrustMat);
    spongeMold.position.set(0.1 + bi * 0.55, 1.02, 0);
    prepTable.add(spongeMold);
  }
  prepTable.userData = {
    system: 'thermal',
    interactive: true,
    title: 'СТОЛ ФОРМОВКИ БИСКВИТОВ (AISI 304)',
    zone: 'ЗОНА 1: ВЫПЕЧКА // ТЕХНОЛОГИЧЕСКИЙ СТОЛ',
    modbus: 'ТЕХКАРТА № B-12 (Замес и порционирование)',
    desc: 'Островной кондитерский стол из пищевой нержавеющей стали с дежой и формами для формовки бисквитного теста.',
    telemetryFn: () => ({ status: 'ФОРМОВКА ПАРТИИ', statusColor: 'var(--green-light)', text: 'Партия бисквитов: 120 шт/смена • Стандарт HACCP' })
  };
  prepTable.traverse(c => { if (c.isMesh) { c.userData = prepTable.userData; clickableObjects.push(c); } });
  scene.add(prepTable);

  // Zone 1: Sheet Pan Rack Trolley (Шпилька-тележка) for Cooling Sponges
  const rackTrolley = new THREE.Group();
  rackTrolley.position.set(-16.0, 0, -3.8);
  for (let rx of [-0.4, 0.4]) for (let rz of [-0.35, 0.35]) {
    const post = createMesh(new THREE.BoxGeometry(0.04, 1.7, 0.04), inoxMat);
    post.position.set(rx, 0.85, rz);
    rackTrolley.add(post);
  }
  for (let tier = 0.3; tier <= 1.5; tier += 0.3) {
    const tray = createMesh(new THREE.BoxGeometry(0.76, 0.03, 0.65), inoxMat);
    tray.position.set(0, tier, 0);
    rackTrolley.add(tray);
    const sponge = createMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 14), goldCrustMat);
    sponge.position.set(0, tier + 0.07, 0);
    rackTrolley.add(sponge);
  }
  rackTrolley.userData = {
    system: 'thermal',
    interactive: true,
    title: 'ШПИЛЬКА-ТЕЛЕЖКА ОХЛАЖДЕНИЯ БИСКВИТОВ',
    zone: 'ЗОНА 1: ВЫПЕЧКА // ТЕХНОЛОГИЧЕСКИЙ ТРАНСПОРТ',
    modbus: 'ОХЛАЖДЕНИЕ ПОСЛЕ ВЫЕМКИ ИЗ ПЕЧИ',
    desc: 'Многоярусная кондитерская шпилька для естественного остывания бисквитных заготовок перед подачей на глазировку.',
    telemetryFn: (d) => ({ status: 'ОСТЫВАНИЕ В НОРМЕ', statusColor: 'var(--green-light)', text: `Температура в зоне: ${d.zones.bakery.temp.toFixed(1)} °C` })
  };
  rackTrolley.traverse(c => { if (c.isMesh) { c.userData = rackTrolley.userData; clickableObjects.push(c); } });
  scene.add(rackTrolley);

  // Zone 2: Finished Cakes Inspection & Packaging Station
  const packTable = new THREE.Group();
  packTable.position.set(7.5, 0, 2.5);
  const pTop = createMesh(new THREE.BoxGeometry(2.4, 0.1, 1.4), inoxMat);
  pTop.position.set(0, 0.9, 0);
  packTable.add(pTop);
  for (let lx of [-1.0, 1.0]) for (let lz of [-0.6, 0.6]) {
    const leg = createMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.88), inoxMat);
    leg.position.set(lx, 0.44, lz);
    packTable.add(leg);
  }
  [[-0.5, 1.12, -0.2, boxMat], [-0.5, 1.43, -0.2, boxWhiteMat], [0.4, 1.12, 0.1, boxMat]].forEach(([bx, by, bz, bm]) => {
    const b = createMesh(new THREE.BoxGeometry(0.48, 0.32, 0.48), bm);
    b.position.set(bx, by, bz);
    packTable.add(b);
  });
  packTable.userData = {
    system: 'cooling',
    interactive: true,
    title: 'ПОСТ УПАКОВКИ И КОНТРОЛЯ ГОТОВОЙ ПРОДУКЦИИ',
    zone: 'ЗОНА 2: ШОКОЛАД // ВЫХОД ЛИНИИ',
    modbus: 'ФИНАЛЬНЫЙ КОНТРОЛЬ HACCP ККТ-2',
    desc: 'Участок визуальной отбраковки тортов после охлаждающего туннеля и упаковки в премиальные кондитерские коробки.',
    telemetryFn: (d) => ({
      status: d.zones.glazing.temp > 20.2 ? 'ОСТАНОВКА: БРАК ГЛАЗУРИ' : 'ВЫХОД ГОДНОЙ ПРОДУКЦИИ',
      statusColor: d.zones.glazing.temp > 20.2 ? 'var(--red)' : 'var(--green-light)',
      text: `Температура продукта: ${d.zones.glazing.temp.toFixed(1)} °C • Брак: ${d.zones.glazing.temp > 20.2 ? '100% (ОПЛАВЛЕНИЕ)' : '0.0%'}`
    })
  };
  packTable.traverse(c => { if (c.isMesh) { c.userData = packTable.userData; clickableObjects.push(c); } });
  scene.add(packTable);

  // Dynamic Logistics Floor Pallets
  function createFloorPallet(x, z, title) {
    const pGroup = new THREE.Group();
    pGroup.position.set(x, 0, z);
    const pal = createMesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), woodMat);
    pal.position.set(0, 0.06, 0);
    pGroup.add(pal);
    for (let sx of [-0.28, 0.28]) {
      for (let sz of [-0.28, 0.28]) {
        const sack = createMesh(new THREE.BoxGeometry(0.48, 0.22, 0.48), sackMat);
        sack.position.set(sx, 0.22, sz);
        pGroup.add(sack);
      }
    }
    pGroup.userData = {
      interactive: true,
      title: title,
      zone: 'ЛОГИСТИКА СЫРЬЯ',
      modbus: 'ПАЛЛЕТА МУКИ 50 КГ (В/С)',
      desc: 'Паллета с фасованной пшеничной мукой высшего сорта для бисквитного производства.',
      telemetryFn: () => ({ status: 'ГОТОВ К ПЕРЕМЕЩЕНИЮ', statusColor: 'var(--green-light)', text: 'Вес: 200 кг • Влажность: 12.8%' })
    };
    pGroup.traverse(c => { if (c.isMesh) { c.userData = pGroup.userData; clickableObjects.push(c); } });
    scene.add(pGroup);
    return pGroup;
  }
  window.dockFloorPallet = createFloorPallet(24.2, 8.5, 'ПАЛЛЕТА В ДОКЕ (ПРИЕМКА ИЗ ФУРЫ)');
  window.stagingFloorPallet = createFloorPallet(-8.2, 2.0, 'ПАЛЛЕТА В БУФЕРЕ ПЕКАРНИ (НА ЗАМЕС)');
  window.stagingFloorPallet.visible = false;
}

