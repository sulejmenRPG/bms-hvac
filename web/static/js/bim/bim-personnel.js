/**
 * BIM INDUSTRIAL WORKERS & PERSONNEL SIMULATION
 * Процедурные 3D-модели рабочего персонала завода (пекарь, оператор линии, кладовщик, инженер).
 * Маршруты патрулирования, кинематика ходьбы, перенос предметов и интеграция с физикой BMS.
 * Стандарт: строго до 380 строк.
 */

const bimWorkers = [];

function createHumanoidMesh(cfg) {
  const root = new THREE.Group();
  root.position.set(cfg.x, 0, cfg.z);
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 });
  const shoesMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pantsColor || 0x1e293b, roughness: 0.7 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: cfg.jacketColor || 0xffffff, roughness: 0.6 });
  const hatMat = new THREE.MeshStandardMaterial({ color: cfg.hatColor || 0xfacc15, roughness: 0.4 });

  // Legs with pivot joints at hip
  function createLeg(xOffset) {
    const p = new THREE.Group(); p.position.set(xOffset, 0.8, 0);
    const m = createMesh(new THREE.BoxGeometry(0.16, 0.75, 0.18), pantsMat); m.position.set(0, -0.36, 0);
    const s = createMesh(new THREE.BoxGeometry(0.17, 0.12, 0.24), shoesMat); s.position.set(0, -0.72, 0.03);
    p.add(m); p.add(s); bodyGroup.add(p); return p;
  }
  const leftLegPivot = createLeg(-0.13);
  const rightLegPivot = createLeg(0.13);

  // Torso & Safety Vest
  const torso = createMesh(new THREE.BoxGeometry(0.48, 0.65, 0.28), jacketMat);
  torso.position.set(0, 1.15, 0);
  bodyGroup.add(torso);

  if (cfg.hasVest) {
    const vest = createMesh(new THREE.BoxGeometry(0.50, 0.52, 0.30), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 }));
    vest.position.set(0, 1.15, 0);
    const sMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });
    const s1 = createMesh(new THREE.BoxGeometry(0.51, 0.05, 0.31), sMat); s1.position.set(0, 1.25, 0);
    const s2 = createMesh(new THREE.BoxGeometry(0.51, 0.05, 0.31), sMat); s2.position.set(0, 1.05, 0);
    bodyGroup.add(vest); bodyGroup.add(s1); bodyGroup.add(s2);
  }

  // Head and Hat/Helmet
  const head = createMesh(new THREE.SphereGeometry(0.15, 12, 12), skinMat); head.position.set(0, 1.60, 0); bodyGroup.add(head);
  if (cfg.hatType === 'helmet') {
    const helmet = createMesh(new THREE.CylinderGeometry(0.20, 0.22, 0.13, 14), hatMat); helmet.position.set(0, 1.70, 0);
    const brim = createMesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 14), hatMat); brim.position.set(0, 1.65, 0.04);
    bodyGroup.add(helmet); bodyGroup.add(brim);
  } else {
    const cap = createMesh(new THREE.CylinderGeometry(0.18, 0.18, 0.10, 14), hatMat); cap.position.set(0, 1.68, 0); bodyGroup.add(cap);
  }

  // Arms with shoulder joints
  function createArm(xOffset) {
    const p = new THREE.Group(); p.position.set(xOffset, 1.40, 0);
    const m = createMesh(new THREE.BoxGeometry(0.13, 0.58, 0.13), jacketMat); m.position.set(0, -0.24, 0);
    p.add(m); bodyGroup.add(p); return p;
  }
  const leftArmPivot = createArm(-0.31);
  const rightArmPivot = createArm(0.31);

  // Pallet Jack for Warehouse Keeper
  let jackPalletGroup = null;
  if (cfg.hasPalletJack) {
    const jackGroup = new THREE.Group();
    const jackMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.6 });
    const forks = createMesh(new THREE.BoxGeometry(0.55, 0.08, 1.3), jackMat); forks.position.set(0, 0.08, 0.75);
    const mast = createMesh(new THREE.BoxGeometry(0.35, 0.7, 0.12), jackMat); mast.position.set(0, 0.42, 0.15);
    jackGroup.add(forks); jackGroup.add(mast);
    jackPalletGroup = new THREE.Group();
    const pal = createMesh(new THREE.BoxGeometry(0.7, 0.08, 0.9), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })); pal.position.set(0, 0.16, 0.85);
    const sMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
    const s1 = createMesh(new THREE.BoxGeometry(0.3, 0.16, 0.45), sMat); s1.position.set(-0.14, 0.28, 0.85);
    const s2 = createMesh(new THREE.BoxGeometry(0.3, 0.16, 0.45), sMat); s2.position.set(0.14, 0.28, 0.85);
    jackPalletGroup.add(pal); jackPalletGroup.add(s1); jackPalletGroup.add(s2);
    jackPalletGroup.visible = false; jackGroup.add(jackPalletGroup); bodyGroup.add(jackGroup);
  }

  // Baking Sheet Pan (Tray) for Baker
  let trayGroup = null, rawDoughMesh = null, bakedCakeMesh = null;
  if (cfg.hasTray) {
    trayGroup = new THREE.Group(); trayGroup.position.set(0, 0.95, 0.38);
    const trayBase = createMesh(new THREE.BoxGeometry(0.65, 0.03, 0.42), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 }));
    trayGroup.add(trayBase);
    rawDoughMesh = new THREE.Group();
    for (let di of [-0.17, 0.17]) {
      const d = createMesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 14), new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 }));
      d.position.set(di, 0.05, 0); rawDoughMesh.add(d);
    }
    trayGroup.add(rawDoughMesh);
    bakedCakeMesh = new THREE.Group();
    for (let bi of [-0.17, 0.17]) {
      const c = createMesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }));
      c.position.set(bi, 0.07, 0); bakedCakeMesh.add(c);
    }
    bakedCakeMesh.visible = false; trayGroup.add(bakedCakeMesh); trayGroup.visible = false; bodyGroup.add(trayGroup);
  }

  // Operator Handled Products (Sponge cake & Finished cake box)
  let opProductGroup = null, opSpongeMesh = null, opBoxMesh = null;
  if (cfg.hasOperatorHands) {
    opProductGroup = new THREE.Group(); opProductGroup.position.set(0, 0.95, 0.38);
    opSpongeMesh = createMesh(new THREE.CylinderGeometry(0.20, 0.20, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }));
    opSpongeMesh.position.set(0, 0.06, 0); opProductGroup.add(opSpongeMesh);
    opBoxMesh = createMesh(new THREE.BoxGeometry(0.38, 0.24, 0.38), new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4 }));
    opBoxMesh.position.set(0, 0.12, 0); opBoxMesh.visible = false; opProductGroup.add(opBoxMesh);
    opProductGroup.visible = false; bodyGroup.add(opProductGroup);
  }

  // Inspection Tablet & Torch for Night Engineer
  if (cfg.hasTablet) {
    const tablet = createMesh(new THREE.BoxGeometry(0.24, 0.02, 0.18), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, emissive: 0x0284c7, emissiveIntensity: 0.4 }));
    tablet.position.set(0.15, -0.32, 0.2); tablet.rotation.x = 0.5; rightArmPivot.add(tablet);
    const torchLight = new THREE.PointLight(0x93c5fd, 0.8, 6); torchLight.position.set(0.15, -0.32, 0.3); rightArmPivot.add(torchLight);
  }

  // Register Clickable Object for Inspector
  root.userData = {
    system: cfg.system || 'personnel',
    interactive: true, title: cfg.title, zone: cfg.zone, modbus: cfg.modbus, desc: cfg.desc,
    telemetryFn: () => ({
      status: root.userData.currentStatus || 'НА СМЕНЕ', statusColor: 'var(--green-light)',
      text: `Операция: ${root.userData.currentAction || 'Выполнение регламента'}\nКвалификация: ${cfg.rank}\nРежим допуска HACCP: подтвержден`
    })
  };
  root.traverse((c) => { if (c.isMesh) { c.userData = root.userData; clickableObjects.push(c); } });

  return {
    root, bodyGroup, leftLegPivot, rightLegPivot, leftArmPivot, rightArmPivot,
    trayGroup, rawDoughMesh, bakedCakeMesh, jackPalletGroup, opProductGroup, opSpongeMesh, opBoxMesh,
    heldTrayMode: 'none', heldProductMode: 'none',
    cfg, waypoints: cfg.waypoints, currentWpIdx: 0, waitTimer: 0, walkTime: Math.random() * 10,
    setTrayMode: function(m) {
      this.heldTrayMode = m; if (!this.trayGroup) return;
      this.trayGroup.visible = (m !== 'none');
      if (this.rawDoughMesh) this.rawDoughMesh.visible = (m === 'raw');
      if (this.bakedCakeMesh) this.bakedCakeMesh.visible = (m === 'baked');
    },
    setProductMode: function(m) {
      this.heldProductMode = m; if (!this.opProductGroup) return;
      this.opProductGroup.visible = (m !== 'none');
      if (this.opSpongeMesh) this.opSpongeMesh.visible = (m === 'sponge');
      if (this.opBoxMesh) this.opBoxMesh.visible = (m === 'box');
    },
    setPalletLoaded: function(loaded) {
      if (this.jackPalletGroup) this.jackPalletGroup.visible = !!loaded;
    }
  };
}

function initBIMPersonnel(scene) {
  // 1. Worker 1: Baker (Zone 1) - Complete physical cycle of baking
  const baker = createHumanoidMesh({
    x: -16.5, z: -3.5, system: 'thermal',
    title: 'ПЕКАРЬ-ТЕХНОЛОГ (КАСЫМОВ А.)', zone: 'ЗОНА 1: ВЫПЕЧКА // ПЕРСОНАЛ',
    modbus: 'ТАБ. № 1042 (1-я производственная смена)',
    desc: 'Ведущий мастер горячего цеха. Замешивает тесто, загружает сырые противни в печи и выгружает готовые бисквиты на остывание.',
    rank: '5-й разряд (Допуск к газовым и электропечам)',
    jacketColor: 0xf1f5f9, pantsColor: 0x475569, hatColor: 0xf8fafc,
    hatType: 'cap', hasVest: false, hasTray: true, nightShiftOnly: false, dayShiftOnly: true,
    waypoints: [
      {
        x: -18.5, z: 0.6, wait: 3.5, status: 'ФОРМОВКА ТЕСТА', action: 'Замес и укладка сырого бисквитного теста в формы',
        onArrive: (w) => { w.setTrayMode('none'); }, onLeave: (w) => { w.setTrayMode('raw'); }
      },
      {
        x: -19.0, z: -3.8, wait: 3.5, status: 'ЗАГРУЗКА В ПЕЧЬ №1', action: 'Загрузка сырой партии в ротационную Печь №1',
        onArrive: () => { window.ovenDoor1Open = true; if (window.autonomousShiftActive && typeof window.triggerOvenPhys === 'function') window.triggerOvenPhys(true); },
        onLeave: (w) => { w.setTrayMode('none'); window.ovenDoor1Open = false; if (window.autonomousShiftActive && typeof window.triggerOvenPhys === 'function') window.triggerOvenPhys(false); }
      },
      {
        x: -14.0, z: -3.8, wait: 3.5, status: 'ВЫЕМКА ИЗ ПЕЧИ №2', action: 'Извлечение партии готовых бисквитов из Печи №2',
        onArrive: () => { window.ovenDoor2Open = true; if (window.autonomousShiftActive && typeof window.triggerOvenPhys === 'function') window.triggerOvenPhys(true); },
        onLeave: (w) => { w.setTrayMode('baked'); window.ovenDoor2Open = false; if (window.autonomousShiftActive && typeof window.triggerOvenPhys === 'function') window.triggerOvenPhys(false); }
      },
      {
        x: -16.0, z: -2.8, wait: 3.0, status: 'УКЛАДКА НА ШПИЛЬКУ', action: 'Размещение готовых горячих коржей на ярус шпильки',
        onLeave: (w) => { w.setTrayMode('none'); }
      },
      {
        x: -16.5, z: -0.5, wait: 2.5, status: 'КОНТРОЛЬ ОСТЫВАНИЯ', action: 'Органолептический контроль остывания партии бисквитов',
        onArrive: (w) => { w.setTrayMode('none'); }
      }
    ]
  });
  scene.add(baker.root); bimWorkers.push(baker);

  // 2. Worker 2: Conveyor Line Operator (Zone 2) - Complete glazing & packing cycle
  const operator = createHumanoidMesh({
    x: -4.5, z: 0.5, system: 'cooling',
    title: 'ОПЕРАТОР КОНВЕЙЕРА (ИВАНОВА Е.)', zone: 'ЗОНА 2: ШОКОЛАД [HACCP] // ОПЕРАТОР',
    modbus: 'ТАБ. № 2088 (Контрольная критическая точка ККТ-1)',
    desc: 'Специалист линии глазирования тортов. Подает бисквиты на конвейер, контролирует охлаждающий туннель и упаковывает готовую продукцию.',
    rank: 'Инспектор HACCP / Оператор 4-го разряда',
    jacketColor: 0xffffff, pantsColor: 0x3b82f6, hatColor: 0x0284c7,
    hatType: 'cap', hasVest: false, hasOperatorHands: true, nightShiftOnly: false, dayShiftOnly: true,
    waypoints: [
      {
        x: -13.5, z: -1.8, wait: 3.0, status: 'ПОЛУЧЕНИЕ БИСКВИТОВ', action: 'Забор остывших бисквитных коржей со шпильки горячего цеха',
        onArrive: (w) => { w.setProductMode('none'); },
        onLeave: (w) => { w.setProductMode('sponge'); }
      },
      {
        x: -5.8, z: 1.2, wait: 3.0, status: 'ПОДАЧА НА КОНВЕЙЕР', action: 'Укладка бисквитных заготовок на конвейерную ленту перед глазировкой',
        onLeave: (w) => { w.setProductMode('none'); }
      },
      {
        x: 4.8, z: 1.2, wait: 3.5, status: 'КОНТРОЛЬ ЗАСТЫВАНИЯ', action: 'Лазерный замер температуры корки (+18.8 °C) и снятие торта с ленты',
        onLeave: (w) => { w.setProductMode('box'); }
      },
      {
        x: 7.2, z: 1.6, wait: 3.0, status: 'УПАКОВКА В КОРОБКУ', action: 'Укладка глазированного торта в брендированную коробку',
        onLeave: (w) => { w.setProductMode('none'); }
      },
      {
        x: -2.5, z: -2.8, wait: 2.0, status: 'АУДИТ ЧИЛЛЕРА', action: 'Сверка параметров уставки прецизионного чиллера AC-201 (+19.0 °C)'
      }
    ]
  });
  scene.add(operator.root); bimWorkers.push(operator);

  // 3. Worker 3: Warehouse Logistics Keeper (Zone 3) - Complete freight haul cycle
  const warehouse = createHumanoidMesh({
    x: 18.0, z: 2.0, system: 'logistics',
    title: 'КЛАДОВЩИК-ЛОГИСТ (СЕРИКОВ Б.)', zone: 'ЗОНА 3: СКЛАД МУКИ // ЛОГИСТИКА',
    modbus: 'ТАБ. № 3014 (Участок приемки и хранения сырья)',
    desc: 'Оператор гидравлической рохли. Принимает паллеты с мукой из фуры на рампе и доставляет сырье в накопитель горячего цеха.',
    rank: 'Кладовщик 1-й категории / Водитель спецтехники',
    jacketColor: 0x1e293b, pantsColor: 0x0f172a, hatColor: 0xeab308,
    hatType: 'helmet', hasVest: true, hasPalletJack: true, nightShiftOnly: false, dayShiftOnly: true,
    waypoints: [
      {
        x: 23.5, z: 8.5, wait: 3.5, status: 'ПРИЕМКА ИЗ ФУРЫ', action: 'Разгрузка паллеты с мукой из кузова прибывшей фуры',
        onArrive: () => {
          if (window.dockFloorPallet) window.dockFloorPallet.visible = true;
          if (window.autonomousShiftActive && typeof window.toggleBay === 'function' && window.plantData && !window.plantData.bay_door_open) window.toggleBay();
        },
        onLeave: (w) => {
          if (window.dockFloorPallet) window.dockFloorPallet.visible = false;
          w.setPalletLoaded(true);
          if (window.autonomousShiftActive && typeof window.toggleBay === 'function' && window.plantData && window.plantData.bay_door_open) window.toggleBay();
        }
      },
      { x: 17.5, z: 2.0, wait: 2.5, status: 'ТРАНЗИТ ПО СКЛАДУ', action: 'Транспортировка паллеты с мукой мимо стеллажей хранения' },
      {
        x: -7.8, z: 1.8, wait: 3.5, status: 'ВЫГРУЗКА В ПЕКАРНЮ', action: 'Передача поддона с мукой к столу замеса горячего цеха',
        onLeave: (w) => { w.setPalletLoaded(false); if (window.stagingFloorPallet) window.stagingFloorPallet.visible = true; }
      },
      {
        x: 13.0, z: -2.5, wait: 2.0, status: 'ОБХОД СТЕЛЛАЖЕЙ', action: 'Возврат с пустой рохлей и сверка датчиков влажности HR:0021',
        onLeave: () => { if (window.stagingFloorPallet) window.stagingFloorPallet.visible = false; if (window.dockFloorPallet) window.dockFloorPallet.visible = true; }
      }
    ]
  });
  scene.add(warehouse.root); bimWorkers.push(warehouse);

  // 4. Worker 4: Night Duty BMS Automation Engineer (All Zones)
  const nightEngineer = createHumanoidMesh({
    x: -7.0, z: -4.5,
    title: 'ДЕЖУРНЫЙ ИНЖЕНЕР КИПиА (АХМЕТОВ Д.)', zone: 'ОБХОД И АУДИТ // ЩИТ ВРУ И BMS',
    modbus: 'ТАБ. № 0019 (Дежурная смена мониторинга)',
    desc: 'Инженер автоматизированных систем диспетчеризации. Проводит ночной инструментальный аудит электрощитовой, чиллерного контура и систем VAV.',
    rank: 'Ведущий инженер АСУ ТП (Группа допуска V до 1000В)',
    jacketColor: 0x0f172a, pantsColor: 0x0f172a, hatColor: 0xffffff,
    hatType: 'helmet', hasVest: true, hasTablet: true, nightShiftOnly: true, dayShiftOnly: false,
    waypoints: [
      { x: -7.0, z: -4.5, wait: 3.0, status: 'АУДИТ ВРУ-0.4кВ', action: 'Проверка фазных токов и коэффициента мощности cos(phi)' },
      { x: -15.0, z: -3.5, wait: 2.5, status: 'ОСМОТР ПЕЧЕЙ', action: 'Тепловизионный аудит остывающих печей' },
      { x: -2.0, z: -3.0, wait: 3.0, status: 'ДИАГНОСТИКА ЧИЛЛЕРА', action: 'Проверка перепада температур фреонового контура' },
      { x: 14.0, z: 2.5, wait: 2.5, status: 'ОСУШИТЕЛЬ DH-301', action: 'Контроль работы ротора осушителя склада' }
    ]
  });
  scene.add(nightEngineer.root); bimWorkers.push(nightEngineer);
}

function updateBIMPersonnel(isNight) {
  const dt = 0.016, speed = 1.35;

  for (let i = 0; i < bimWorkers.length; i++) {
    const w = bimWorkers[i];

    if (w.cfg.dayShiftOnly && isNight) { w.root.visible = false; continue; }
    if (w.cfg.nightShiftOnly && !isNight) { w.root.visible = false; continue; }
    w.root.visible = true;

    const currentWp = w.waypoints[w.currentWpIdx];
    const dx = currentWp.x - w.root.position.x;
    const dz = currentWp.z - w.root.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      w.atWaypoint = false;
      const moveDist = Math.min(dist, speed * dt);
      w.root.position.x += (dx / dist) * moveDist;
      w.root.position.z += (dz / dist) * moveDist;
      w.root.rotation.y = Math.atan2(dx, dz);

      w.walkTime += dt * 8.5;
      const swing = Math.sin(w.walkTime) * 0.45;
      w.leftLegPivot.rotation.x = swing;
      w.rightLegPivot.rotation.x = -swing;

      // Carrying postures vs natural arm swing
      const isCarrying = (w.heldTrayMode && w.heldTrayMode !== 'none') || (w.heldProductMode && w.heldProductMode !== 'none');
      if (isCarrying) {
        w.leftArmPivot.rotation.set(-0.7, 0, 0.15);
        w.rightArmPivot.rotation.set(-0.7, 0, -0.15);
      } else {
        w.leftArmPivot.rotation.set(-swing * 0.7, 0, 0);
        w.rightArmPivot.rotation.set(swing * 0.7, 0, 0);
      }
      w.bodyGroup.position.y = Math.abs(Math.sin(w.walkTime)) * 0.04;
      w.root.userData.currentStatus = 'В ДВИЖЕНИИ';
      w.root.userData.currentAction = `Переход: ${currentWp.status}`;
    } else {
      w.leftLegPivot.rotation.x = 0;
      w.rightLegPivot.rotation.x = 0;
      w.bodyGroup.position.y = 0;

      const isCarrying = (w.heldTrayMode && w.heldTrayMode !== 'none') || (w.heldProductMode && w.heldProductMode !== 'none');
      if (isCarrying) {
        w.leftArmPivot.rotation.set(-0.7, 0, 0.15);
        w.rightArmPivot.rotation.set(-0.7, 0, -0.15);
      } else {
        w.leftArmPivot.rotation.set(Math.sin(w.walkTime * 0.5) * 0.1, 0, 0);
        w.rightArmPivot.rotation.set(-Math.sin(w.walkTime * 0.5) * 0.1, 0, 0);
      }

      w.root.userData.currentStatus = currentWp.status;
      w.root.userData.currentAction = currentWp.action;

      if (!w.atWaypoint) {
        w.atWaypoint = true;
        w.waitTimer = 0;
        if (currentWp.onArrive) currentWp.onArrive(w);
      }

      w.waitTimer += dt;
      if (w.waitTimer >= currentWp.wait) {
        if (currentWp.onLeave) currentWp.onLeave(w);
        w.atWaypoint = false;
        w.waitTimer = 0;
        w.currentWpIdx = (w.currentWpIdx + 1) % w.waypoints.length;
      }
    }
  }
}

window.autonomousShiftActive = true;

function toggleAutonomousShift() {
  window.autonomousShiftActive = !window.autonomousShiftActive;
  const btn = document.getElementById('btn-auto-shift');
  if (btn) {
    btn.className = window.autonomousShiftActive ? 'btn-scenario btn-bms-on' : 'btn-scenario';
    btn.innerText = window.autonomousShiftActive ? 'Авто-смена: ВКЛ' : 'Авто-смена: ПАУЗА';
  }
}
window.toggleAutonomousShift = toggleAutonomousShift;
