/**
 * BMS EDGE CABINET 3D DETAILED MODELS
 * Промышленная 3D-сборка шкафа автоматизации (стандарты РК / ГОСТ / IEC):
 * - Оцинкованная панель М6, перфорированная DIN-рейка TS 35, провод PE
 * - Кабель-каналы RAL 7030 (Stone Grey) с открытой гребенкой
 * - Advantech UNO-Edge со штрих-кодом, S/N и темно-стальным радиатором
 * - БП MeanWell NDR-120 с вводом 220В (L, N) и знаком безопасности 24V
 * - Разъем Phoenix Contact PA 6.6 хвойно-зеленый с маркировкой 1..4
 * - Модули I/O в антрацитовом корпусе с оранжевыми рычажками push-in
 */
(function () {
  'use strict';

  // 1. Текстура лицевой панели Advantech IPC (шелкография + штрих-код)
  function createAdvantechTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    // Матовый темно-стальной титан (Advantech Titanium/Graphite)
    ctx.fillStyle = '#1c2434';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, 488, 488);

    // Логотип ADVANTECH UNO-Edge
    ctx.fillStyle = '#0284c7'; ctx.fillRect(28, 28, 8, 40);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px "Consolas", monospace'; ctx.fillText('ADVANTECH', 46, 58);
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 15px "Consolas", monospace'; ctx.fillText('UNO-Edge RT • Modbus TCP/RTU Gateway', 46, 82);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(28, 98); ctx.lineTo(484, 98); ctx.stroke();

    // Маркировка светодиодов
    const leds = ['PWR', 'RUN', 'ERR', 'TX', 'RX'];
    ctx.font = 'bold 13px "Consolas", monospace';
    ctx.fillStyle = '#cbd5e1';
    leds.forEach((name, i) => ctx.fillText(name, 44 + i * 88, 134));

    // Заводская наклейка со штрих-кодом и серийным номером
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(324, 154, 148, 56);
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 9px monospace';
    ctx.fillText('S/N: 24BMS-ADV982', 332, 169);
    for (let bx = 332; bx <= 460; bx += 4) ctx.fillRect(bx, 174, (bx % 3 === 0 ? 3 : 1.5), 30);

    // Контрастные посадочные места сетевых портов
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(44, 250, 160, 90); ctx.fillRect(244, 250, 160, 90);
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.strokeRect(44, 250, 160, 90); ctx.strokeRect(244, 250, 160, 90);
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 14px "Consolas", monospace';
    ctx.fillText('LAN 1 (Gbe)', 74, 332); ctx.fillText('LAN 2 (Modbus)', 260, 332);

    // Разъем RS-485 COM1
    ctx.fillStyle = '#0284c7'; ctx.fillRect(44, 420, 424, 4);
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 15px "Consolas", monospace';
    ctx.fillText('COM1 : RS-485 [ A+   B-   GND   SHLD ]', 64, 462);

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  // 2. Текстура блока питания MeanWell NDR-120 (светлый металл + знак 24V)
  function createPsuTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext('2d');

    // Корпус - светлая оцинкованная сталь
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 256, 512);

    // Вентиляционные прорези
    ctx.fillStyle = '#1e293b';
    for (let y = 140; y <= 350; y += 14) for (let x = 24; x <= 230; x += 20) ctx.fillRect(x, y, 11, 5);

    // Заводская табличка MeanWell
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(16, 20, 224, 96);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('MEAN WELL', 28, 54);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('NDR-120-24 24V 5A', 28, 82);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('● DC OK', 28, 102);

    // Желтый знак безопасности (молния 24V)
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(200, 32); ctx.lineTo(230, 78); ctx.lineTo(170, 78);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('24V', 188, 71);

    // Маркировка клемм
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px "Consolas", monospace';
    ctx.fillText('L   N   FG     -V  +V', 36, 485);

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  // 3. Генерация реалистичного изогнутого провода (кривая Безье + наконечник НШВИ)
  function createCurvedWire(pStart, pMid, pEnd, colorHex, tagText = null) {
    const group = new THREE.Group();
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...pStart),
      new THREE.Vector3(...pMid),
      new THREE.Vector3(...pEnd)
    );
    const geom = new THREE.TubeGeometry(curve, 20, 0.016, 8, false);
    const wireMesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.45,
      metalness: 0.1
    }));
    wireMesh.castShadow = true;
    group.add(wireMesh);

    // Наконечник-гильза НШВИ
    const ferruleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.07, 8), ferruleMat);
    ferrule.position.set(pStart[0], pStart[1] - 0.035, pStart[2]);
    group.add(ferrule);

    if (tagText) {
      const tagMat = new THREE.MeshStandardMaterial({ color: 0xecf0f5, roughness: 0.6 });
      const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.055, 8), tagMat);
      tag.position.copy(curve.getPoint(0.26));
      tag.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(0.26));
      group.add(tag);
    }
    return group;
  }

  // 4. Построение сборки промышленного шкафа
  function buildDetailedCabinetAssembly(scene, hotspots) {
    const root = new THREE.Group();

    // Аутентичные материалы шкафов РК (DKC / Rittal / IEK)
    const zincMat = new THREE.MeshStandardMaterial({ color: 0x8a9aa8, roughness: 0.32, metalness: 0.82 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.95 });
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.25, metalness: 0.85 });
    // Промышленные кабель-каналы RAL 7030 (Stone Grey - матовый каменно-серый ПВХ)
    const ductBodyMat = new THREE.MeshStandardMaterial({ color: 0x333d4d, roughness: 0.65, metalness: 0.1 });
    const ductCoverMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.58, metalness: 0.15 });
    const finMat = new THREE.MeshStandardMaterial({ color: 0x243044, roughness: 0.25, metalness: 0.85 });
    const rj45Mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });
    // Матовый хвойно-зеленый Phoenix Contact PA 6.6
    const phoenixGreen = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.55, metalness: 0.12 });
    const screwCopper = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85 });
    const peGreenYellow = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.4, metalness: 0.2 });
    const ioHousingMat = new THREE.MeshStandardMaterial({ color: 0x242d3d, roughness: 0.42, metalness: 0.2 });
    const pushInMat = new THREE.MeshStandardMaterial({ color: 0x18202d, roughness: 0.45, metalness: 0.2 });
    const leverMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.35 });

    // 1. Светлая оцинкованная панель (Backplate)
    const backplate = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.2, 0.06), zincMat);
    backplate.position.set(0, 0, -0.65);
    backplate.receiveShadow = true;
    root.add(backplate);

    // Угловые болты заземления М6
    const boltGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 6);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.92, roughness: 0.15 });
    [[-2.25, 1.45], [2.25, 1.45], [-2.25, -1.45], [2.25, -1.45]].forEach(([bx, by]) => {
      const bolt = new THREE.Mesh(boltGeom, boltMat);
      bolt.rotation.x = Math.PI / 2; bolt.position.set(bx, by, -0.61);
      root.add(bolt);
    });

    // 2. Перфорированная DIN-рейка TS-35/7.5
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.35, 0.075), railMat);
    rail.position.set(0, 0, -0.58);
    rail.castShadow = true;
    root.add(rail);

    const holeMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    for (let hx = -2.0; hx <= 2.0; hx += 0.2) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.005), holeMat);
      slot.position.set(hx, 0, -0.54); root.add(slot);
    }

    // Концевые фиксаторы с винтами
    [-1.95, 1.95].forEach((cx) => {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.46, 0.14), clampMat);
      clamp.position.set(cx, 0, -0.54); clamp.castShadow = true; root.add(clamp);
      const clampScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 6), boltMat);
      clampScrew.rotation.z = Math.PI / 2; clampScrew.position.set(cx + (cx > 0 ? 0.04 : -0.04), 0.12, -0.52);
      root.add(clampScrew);
    });

    // Клемма заземления PE на DIN-рейке + провод PE к болту панели
    const peTerminal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.22), peGreenYellow);
    peTerminal.position.set(-1.8, 0, -0.5);
    root.add(peTerminal);
    root.add(createCurvedWire([-1.8, -0.22, -0.5], [-2.05, -0.85, -0.55], [-2.25, -1.45, -0.61], 0x65a30d, 'PE'));

    // 3. Промышленные кабель-каналы RAL 7030
    [1.25, -1.25].forEach((dy) => {
      const ductBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.42, 0.26), ductBodyMat);
      ductBase.position.set(0, dy, -0.49);
      root.add(ductBase);

      const ductCover = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.44, 0.06), ductCoverMat);
      ductCover.position.set(0, dy, -0.34);
      ductCover.castShadow = true;
      root.add(ductCover);

      const isTop = dy > 0;
      for (let fx = -2.05; fx <= 2.05; fx += 0.18) {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.24), ductBodyMat);
        finger.position.set(fx, dy + (isTop ? -0.19 : 0.19), -0.47);
        root.add(finger);
      }
    });

    // 4. Блок питания MeanWell 24V (ввод 220В сверху + выход 24В снизу)
    const psuGroup = new THREE.Group();
    psuGroup.userData = { partId: 'pwr' };
    const psuBox = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.25, 0.68), new THREE.MeshStandardMaterial({
      map: createPsuTexture(),
      roughness: 0.52,
      metalness: 0.35
    }));
    psuBox.position.set(-1.42, 0.06, -0.21);
    psuBox.castShadow = true;
    psuGroup.add(psuBox);

    // Верхняя клеммная колодка ввода 220В переменного тока
    const psuTopTerm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    psuTopTerm.position.set(-1.42, 0.64, 0.04);
    psuGroup.add(psuTopTerm);

    // Вводные кабели 220В сверху (L коричневый, N синий)
    [[-1.48, 0x92400e, 'L'], [-1.36, 0x0284c7, 'N']].forEach(([wx, col, tag]) => {
      psuGroup.add(createCurvedWire([wx, 0.68, 0.04], [wx, 0.92, -0.1], [wx, 1.05, -0.36], col, tag));
    });

    // Подстроечный потенциометр V-adj
    const pot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
    pot.position.set(-1.26, -0.32, 0.14);
    const potScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.01, 8), screwCopper);
    potScrew.rotation.x = Math.PI / 2; potScrew.position.set(-1.26, -0.32, 0.165);
    psuGroup.add(pot); psuGroup.add(potScrew);

    // Выходные провода 24V DC снизу
    [[-1.32, 0xdc2626, '+24V'], [-1.22, 0x1e293b, '0V']].forEach(([wx, col, tag]) => {
      psuGroup.add(createCurvedWire([wx, -0.56, 0.12], [wx, -0.85, 0.05], [wx, -1.05, -0.36], col, tag));
    });

    root.add(psuGroup);
    hotspots.pwr = psuGroup;

    // 5. Контроллер Advantech IPC Core (Titanium Steel)
    const cpuGroup = new THREE.Group();
    cpuGroup.userData = { partId: 'cpu' };

    const ipcBody = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.35, 0.72), new THREE.MeshStandardMaterial({
      map: createAdvantechTexture(),
      roughness: 0.28,
      metalness: 0.72
    }));
    ipcBody.position.set(-0.25, 0.08, -0.19);
    ipcBody.castShadow = true;
    cpuGroup.add(ipcBody);

    // Ребра радиатора охлаждения
    for (let rx = -0.88; rx <= 0.38; rx += 0.09) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.32, 0.74), finMat);
      fin.position.set(rx, 0.88, -0.19);
      fin.castShadow = true;
      cpuGroup.add(fin);
    }

    // Экранированные металлические разъемы LAN 1 и LAN 2
    // Экранированные металлические разъемы LAN 1 и LAN 2
    [-0.61, -0.06].forEach((lx) => {
      const rj45 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.20), rj45Mat);
      rj45.position.set(lx, -0.03, 0.20); cpuGroup.add(rj45);
      const ledLink = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.016, 0.01), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      ledLink.position.set(lx - 0.05, 0.07, 0.305);
      const ledAct = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.016, 0.01), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
      ledAct.position.set(lx + 0.05, 0.07, 0.305);
      cpuGroup.add(ledLink); cpuGroup.add(ledAct);
    });

    const ledRx = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    ledRx.rotation.x = Math.PI / 2; ledRx.position.set(0.26, 0.42, 0.175);
    const ledTx = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    ledTx.rotation.x = Math.PI / 2; ledTx.position.set(0.12, 0.42, 0.175);
    cpuGroup.add(ledRx); cpuGroup.add(ledTx);

    root.add(cpuGroup);
    hotspots.cpu = cpuGroup;

    // 6. Порт RS-485 / COM1 (Розетка + съемный 4-pin Phoenix Contact MSTBT)
    const rsGroup = new THREE.Group();
    rsGroup.userData = { partId: 'rs485' };

    const phSocket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.12), pushInMat);
    phSocket.position.set(-0.33, -0.50, 0.16);
    rsGroup.add(phSocket);

    const phPlug = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.15), phoenixGreen);
    phPlug.position.set(-0.33, -0.52, 0.22);
    phPlug.castShadow = true;
    rsGroup.add(phPlug);

    [-0.435, -0.365, -0.295, -0.225].forEach((sx) => {
      const screwHole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8), screwCopper);
      screwHole.position.set(sx, -0.44, 0.22); rsGroup.add(screwHole);
    });

    [[-0.435, 0xf97316, 'A+'], [-0.365, 0x0284c7, 'B-'], [-0.295, 0x64748b, 'GND'], [-0.225, 0xd97706, 'SHLD']].forEach(([wx, col, tag]) => {
      rsGroup.add(createCurvedWire([wx, -0.60, 0.22], [wx, -0.84, 0.10], [wx + 0.02, -1.05, -0.36], col, tag));
    });

    root.add(rsGroup);
    hotspots.rs485 = rsGroup;

    // 7. Модули ввода-вывода I/O в антрацитовом корпусе (Siemens / Beckhoff)
    const ioGroup = new THREE.Group();
    ioGroup.userData = { partId: 'io' };

    const sliceDefs = [
      { name: 'Pt100 RTD', tagColor: 0x0284c7, wireColor: 0x38bdf8, wireTag: 'T1' },
      { name: '0-10V AO', tagColor: 0xca8a04, wireColor: 0xfacc15, wireTag: 'AO' },
      { name: '24V DI/DO', tagColor: 0x16a34a, wireColor: 0x4ade80, wireTag: 'DI' }
    ];

    sliceDefs.forEach((slice, idx) => {
      const ix = 0.65 + idx * 0.36;

      const sMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.28, 0.65), ioHousingMat);
      sMesh.position.set(ix, 0.06, -0.22);
      sMesh.castShadow = true;
      ioGroup.add(sMesh);

      const markerStrip = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.05, 0.02), new THREE.MeshStandardMaterial({
        color: slice.tagColor,
        roughness: 0.35
      }));
      markerStrip.position.set(ix, 0.67, 0.11);
      ioGroup.add(markerStrip);

      for (let ly = 0.48; ly >= 0.24; ly -= 0.08) {
        const chLed = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.015), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
        chLed.position.set(ix - 0.06, ly, 0.11);
        ioGroup.add(chLed);

        const chPin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0x64748b }));
        chPin.position.set(ix + 0.04, ly, 0.11);
        ioGroup.add(chPin);
      }

      const termBlock = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.38, 0.22), pushInMat);
      termBlock.position.set(ix, -0.38, 0.14);
      termBlock.castShadow = true;
      ioGroup.add(termBlock);

      [-0.07, 0.07].forEach((ox, wi) => {
        const lever = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.03), leverMat);
        lever.position.set(ix + ox, -0.25, 0.24);
        ioGroup.add(lever);
        ioGroup.add(createCurvedWire([ix + ox, -0.57, 0.14], [ix + ox, -0.83, 0.06], [ix + (ox > 0 ? 0.05 : -0.05), -1.05, -0.36], slice.wireColor, slice.wireTag + (wi + 1)));
      });
    });

    root.add(ioGroup);
    hotspots.io = ioGroup;

    scene.add(root);

    return { ledRx, ledTx };
  }

  window.buildDetailedCabinetAssembly = buildDetailedCabinetAssembly;
})();
