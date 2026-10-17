/**
 * BIM ELECTRICAL & AUTOMATION CABINETS
 * Модуль щитов автоматики (ЩА-BMS, ШУВ-1, ШУЧ-2, ШУВ-3, ВРУ-0.4кВ, ЩО-1).
 * Стандарт: до 300 строк.
 */

function initBIMCabinets(scene) {
  function createAutomationCabinet(cfg) {
    const {
      width = 1.0,
      height = 1.4,
      depth = 0.4,
      position = [0, 0, 0],
      rotationY = 0,
      bodyColor = 0xb0b8c4,
      pilotType = 'rgb',
      hasCableTray = true,
      cableTrayHeight = 1.8,
      userData = {}
    } = cfg;

    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = rotationY;

    // 1. Plinth / Base (Цоколь шкафа)
    const plinthGeo = new THREE.BoxGeometry(width * 0.96, 0.15, depth * 0.92);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const plinth = createMesh(plinthGeo, plinthMat);
    plinth.position.y = 0.075;
    group.add(plinth);

    // 2. Main Enclosure (Металлический корпус)
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.42,
      metalness: 0.38
    });
    const body = createMesh(bodyGeo, bodyMat);
    body.position.y = 0.15 + height / 2;
    group.add(body);

    // 3. Cabinet Door with Beveled Frame (Дверь шкафа с зазором)
    const doorGeo = new THREE.BoxGeometry(width * 0.92, height * 0.94, 0.025);
    const doorMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.38,
      metalness: 0.42
    });
    const door = createMesh(doorGeo, doorMat);
    door.position.set(0, 0.15 + height / 2, depth / 2 + 0.015);
    group.add(door);

    // 4. Industrial Door Handle / Key Lock (Поворотная рукоятка)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const handle = createMesh(new THREE.BoxGeometry(0.04, 0.16, 0.03), handleMat);
    handle.position.set(width * 0.36, 0.15 + height / 2, depth / 2 + 0.045);
    group.add(handle);

    // 5. Nameplate Label Plate (Шильдик с маркировкой)
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const plate = createMesh(new THREE.BoxGeometry(width * 0.55, 0.09, 0.012), plateMat);
    plate.position.set(0, 0.15 + height * 0.88, depth / 2 + 0.035);
    group.add(plate);

    // 6. Pilot Indicator Lamps (Светосигнальная арматура)
    const lampGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12);
    lampGeo.rotateX(Math.PI / 2);
    const lampY = 0.15 + height * 0.76;
    const lampZ = depth / 2 + 0.035;

    if (pilotType === 'rgb') {
      const redLamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redLamp.position.set(-width * 0.28, lampY, lampZ);
      group.add(redLamp);

      const yelLamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
      yelLamp.position.set(-width * 0.14, lampY, lampZ);
      group.add(yelLamp);

      const grnLamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      grnLamp.position.set(0, lampY, lampZ);
      group.add(grnLamp);

      const bluLamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      bluLamp.position.set(width * 0.18, lampY, lampZ);
      group.add(bluLamp);
    } else {
      const col = pilotType === 'blue' ? 0x38bdf8 : pilotType === 'teal' ? 0x14b8a6 : 0x22c55e;
      const statusLamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: col }));
      statusLamp.position.set(0, lampY, lampZ);
      group.add(statusLamp);

      const pwrLamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      pwrLamp.position.set(-width * 0.2, lampY, lampZ);
      group.add(pwrLamp);
    }

    // 7. Overhead Perforated Cable Tray (Перфорированный кабельный лоток)
    if (hasCableTray) {
      const trayMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.55,
        metalness: 0.65
      });
      const tray = createMesh(new THREE.BoxGeometry(width * 0.45, cableTrayHeight, 0.14), trayMat);
      tray.position.set(0, 0.15 + height + cableTrayHeight / 2, 0);
      group.add(tray);
    }

    // Interactive Raycasting registration
    body.userData = { interactive: true, rootGroup: group, ...userData };
    door.userData = body.userData;
    group.userData = body.userData;
    clickableObjects.push(body, door);

    scene.add(group);
    return group;
  }

  // 1. ЩА-BMS: Высокодетализированный шкаф автоматики Edge Core (ША-BMS-01)
  if (typeof initBIMEdgeCabinet === 'function') {
    initBIMEdgeCabinet(scene);
  }

  // 2. ШУВ-1: Шкаф управления вытяжной вентиляцией печей
  createAutomationCabinet({
    width: 1.0,
    height: 1.4,
    depth: 0.35,
    position: [-17.5, 0, -12.1],
    rotationY: 0,
    bodyColor: 0xb0b8c4,
    pilotType: 'green',
    cableTrayHeight: 2.3,
    userData: {
      system: ['thermal', 'hvac'],
      title: 'ШУВ-1 // Шкаф вытяжной вентиляции печей',
      zone: 'Зона 1: Выпечка (Горячий цех)',
      modbus: 'HR:0002 (Вытяжной вентилятор EF-101)',
      desc: 'Локальный шкаф управления вытяжным зонтом ротационных печей (IP54). Оснащен частотным преобразователем (ПЧ) 5.5 кВт, автоматом защиты двигателя и интерфейсом аварийной термоотсечки.',
      telemetryFn: (d) => ({
        status: d.zones.bakery.fan > 0 ? `АКТИВЕН (ПЧ ${d.zones.bakery.fan}%)` : 'ОСТАНОВЛЕН',
        statusColor: d.zones.bakery.fan > 0 ? 'var(--green-light)' : 'var(--text-muted)',
        text: `Вытяжка: ${d.zones.bakery.fan}% • Ток двигателя: ${(d.zones.bakery.fan * 0.11).toFixed(1)} A • 380V`
      })
    }
  });

  // 3. ШУЧ-2: Шкаф управления чиллером и увлажнением шоколада
  createAutomationCabinet({
    width: 1.2,
    height: 1.5,
    depth: 0.4,
    position: [2.8, 0, -12.1],
    rotationY: 0,
    bodyColor: 0xb0b8c4,
    pilotType: 'blue',
    cableTrayHeight: 2.2,
    userData: {
      system: 'cooling',
      title: 'ШУЧ-2 // Шкаф чиллерной установки и пара',
      zone: 'Зона 2: Глазировка (Критический HACCP контур)',
      modbus: 'HR:0012 (Чиллер), HR:0013 (Пароувлажнитель)',
      desc: 'Шкаф управления прецизионной холодильной машиной и изотермическим пароувлажнителем (IP54). Модули плавного регулирования мощности 0-10V, защита компрессора по давлению фреона и сухой ход увлажнителя.',
      telemetryFn: (d) => ({
        status: d.zones.glazing.ac > 0 ? `ОХЛАЖДЕНИЕ (${d.zones.glazing.ac}%)` : 'ДЕЖУРНЫЙ РЕЖИМ',
        statusColor: d.zones.glazing.ac > 0 ? 'var(--blue-light)' : 'var(--green-light)',
        text: `Чиллер: ${d.zones.glazing.ac}% • Пароувлажнитель: ${d.zones.glazing.hum_p}% • Фреон: 18.2 bar`
      })
    }
  });

  // 4. ШУВ-3: Шкаф осушителя воздуха склада муки
  createAutomationCabinet({
    width: 0.95,
    height: 1.35,
    depth: 0.35,
    position: [13.2, 0, -12.1],
    rotationY: 0,
    bodyColor: 0xb0b8c4,
    pilotType: 'teal',
    cableTrayHeight: 2.3,
    userData: {
      system: 'hvac',
      title: 'ШУВ-3 // Шкаф осушителя склада муки',
      zone: 'Зона 3: Склад муки (Зона хранения)',
      modbus: 'HR:0022 (Осушитель воздуха DH-301)',
      desc: 'Шкаф управления промышленным адсорбционным осушителем (IP54). Управляет нагревателем регенерации и приводом силикагелевого ротора для предотвращения комкования и порчи муки.',
      telemetryFn: (d) => ({
        status: d.zones.storage.dehum > 0 ? `ОСУШЕНИЕ (${d.zones.storage.dehum}%)` : 'ОЖИДАНИЕ',
        statusColor: d.zones.storage.dehum > 0 ? 'var(--teal-light)' : 'var(--text-muted)',
        text: `Осушитель: ${d.zones.storage.dehum}% • Влажность: ${d.zones.storage.hum.toFixed(0)}% Rh • Реле: OK`
      })
    }
  });

  // 5. ВРУ-0.4кВ: Главный вводно-распределительный силовой щит завода
  createAutomationCabinet({
    width: 2.0,
    height: 2.0,
    depth: 0.55,
    position: [24.8, 0, -8.0],
    rotationY: -Math.PI / 2,
    bodyColor: 0x475569,
    pilotType: 'rgb',
    cableTrayHeight: 1.9,
    userData: {
      system: ['lighting', 'structure'],
      title: 'ВРУ-0.4кВ // Главный силовой вводной щит',
      zone: 'Общезаводской распределительный узел',
      modbus: 'Ввод 1 / Ввод 2 • АВР • Учет энергии',
      desc: 'Главный вводно-распределительный щит 0.4 кВ завода (IP54). Автоматический ввод резерва (АВР на 2 независимых ввода), вводные автоматы 250А, коммерческий счетчик электроэнергии и распределительные фидеры технологических линий.',
      telemetryFn: (d) => ({
        status: 'ВВОД 1 В РАБОТЕ (НОРМА)',
        statusColor: 'var(--green-light)',
        text: 'U=401 В • I=72 А • cos φ=0.95 • P_актив=44.2 кВт • АВР: Готов'
      })
    }
  });

  // 6. ЩО-1: Щит рабочего и дежурного освещения цеха
  createAutomationCabinet({
    width: 0.85,
    height: 1.15,
    depth: 0.3,
    position: [7.98, 0, -4.5],
    rotationY: -Math.PI / 2,
    bodyColor: 0xb0b8c4,
    pilotType: 'green',
    cableTrayHeight: 2.6,
    userData: {
      system: 'lighting',
      title: 'ЩО-1 // Щит цехового освещения',
      zone: 'Общецеховой контур освещения',
      modbus: 'HR:0030..0032 • Реле BMS Lighting (DALI)',
      desc: 'Щит управления рабочим, дежурным и аварийным светодиодным освещением цеха (IP65). Модульные импульсные реле по 3 технологическим зонам, автоматическое диммирование по расписанию смен и сигналам BMS.',
      action: { label: 'Переключить свет цеха (100% / 30%)', fnName: 'toggleCeilingLighting' },
      telemetryFn: (d) => {
        const l = d.lighting || {
          bakery: d.night_mode ? 30 : 100,
          glazing: d.night_mode ? 30 : 100,
          storage: d.night_mode ? 30 : 100
        };
        const isDim = (l.glazing <= 30);
        return {
          status: isDim ? 'ДЕЖУРНЫЙ РЕЖИМ (30%)' : 'РАБОЧАЯ СМЕНА (100%)',
          statusColor: isDim ? 'var(--blue-light)' : 'var(--green-light)',
          text: `Линия 1: ${l.bakery}% • Линия 2: ${l.glazing}% • Линия 3: ${l.storage}%`
        };
      }
    }
  });
}
