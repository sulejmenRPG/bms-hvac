/**
 * BIM EDGE AUTOMATION CABINET (ША-BMS-01) & BUS CONDUITS
 * Высокодетализированный шкаф автоматики с открытой дверцей,
 * DIN-рейками, контроллером Advantech Edge IPC, БП 24В и кабельными трассами.
 * Стандарт: до 220 строк.
 */

let edgeLedRx = null;
let edgeLedTx = null;

function initBIMEdgeCabinet(scene) {
  const edgeGroup = new THREE.Group();
  edgeGroup.position.set(-7.92, 0, -4.5);
  edgeGroup.rotation.y = Math.PI / 2;
  edgeGroup.userData.system = ['hvac', 'cooling', 'thermal'];

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.5 });
  const innerMat = new THREE.MeshStandardMaterial({ color: 0x1e2634, roughness: 0.85, metalness: 0.2 });
  const dinMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.9 });
  const ipcMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.7 });
  const psuMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45, metalness: 0.75 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.15,
    transparent: true,
    opacity: 0.35
  });

  // 1. Plinth / Base
  const plinth = createMesh(new THREE.BoxGeometry(1.4, 0.15, 0.45), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
  plinth.position.y = 0.075;
  edgeGroup.add(plinth);

  // 2. Outer Enclosure (Open Wall Cabinet, depth 0.46)
  const backPlate = createMesh(new THREE.BoxGeometry(1.44, 1.82, 0.03), new THREE.MeshStandardMaterial({ color: 0xd8e0e8, roughness: 0.3, metalness: 0.8 }));
  backPlate.position.set(0, 1.06, -0.21);
  edgeGroup.add(backPlate);

  const topWall = createMesh(new THREE.BoxGeometry(1.46, 0.04, 0.46), bodyMat);
  topWall.position.set(0, 1.97, 0);
  edgeGroup.add(topWall);

  const btmWall = createMesh(new THREE.BoxGeometry(1.46, 0.04, 0.46), bodyMat);
  btmWall.position.set(0, 0.17, 0);
  edgeGroup.add(btmWall);

  for (let sx of [-0.71, 0.71]) {
    const sideWall = createMesh(new THREE.BoxGeometry(0.04, 1.84, 0.46), bodyMat);
    sideWall.position.set(sx, 1.07, 0);
    edgeGroup.add(sideWall);
  }

  // 3. Two Galvanized Steel DIN-Rails (TS 35/7.5)
  for (let ry of [1.42, 0.75]) {
    const rail = createMesh(new THREE.BoxGeometry(1.32, 0.035, 0.015), dinMat);
    rail.position.set(0, ry, -0.18);
    edgeGroup.add(rail);
  }

  // 4. Advantech Edge IPC Controller on Top Rail (Center-Left)
  const ipc = createMesh(new THREE.BoxGeometry(0.28, 0.22, 0.16), ipcMat);
  ipc.position.set(-0.25, 1.44, -0.09);
  edgeGroup.add(ipc);

  // IPC Heat Sink Ribs
  for (let hx = -0.36; hx <= -0.14; hx += 0.03) {
    const rib = createMesh(new THREE.BoxGeometry(0.008, 0.18, 0.012), dinMat);
    rib.position.set(hx, 1.44, -0.005);
    edgeGroup.add(rib);
  }

  // IPC Front Status LEDs
  const ledPwr = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  ledPwr.rotation.x = Math.PI / 2;
  ledPwr.position.set(-0.35, 1.51, 0.0);
  edgeGroup.add(ledPwr);

  const ledRun = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  ledRun.rotation.x = Math.PI / 2;
  ledRun.position.set(-0.32, 1.51, 0.0);
  edgeGroup.add(ledRun);

  edgeLedRx = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
  edgeLedRx.rotation.x = Math.PI / 2;
  edgeLedRx.position.set(-0.29, 1.51, 0.0);
  edgeGroup.add(edgeLedRx);

  edgeLedTx = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  edgeLedTx.rotation.x = Math.PI / 2;
  edgeLedTx.position.set(-0.26, 1.51, 0.0);
  edgeGroup.add(edgeLedTx);

  // 5. MeanWell Industrial 24V DC Power Supply (Top Rail Right)
  const psu = createMesh(new THREE.BoxGeometry(0.14, 0.18, 0.14), psuMat);
  psu.position.set(0.18, 1.44, -0.10);
  edgeGroup.add(psu);

  // 6. Miniature Circuit Breakers (Top Rail Far Right)
  const mcb = createMesh(new THREE.BoxGeometry(0.11, 0.12, 0.10), new THREE.MeshStandardMaterial({ color: 0x334155 }));
  mcb.position.set(0.42, 1.44, -0.12);
  edgeGroup.add(mcb);

  // 7. WAGO Modular Terminal Block Strip on Bottom Rail
  for (let bx = -0.52; bx <= 0.52; bx += 0.055) {
    const isOrange = Math.sin(bx * 20) > 0.2;
    const termMat = new THREE.MeshStandardMaterial({
      color: isOrange ? 0xf97316 : 0x475569,
      roughness: 0.6
    });
    const term = createMesh(new THREE.BoxGeometry(0.045, 0.11, 0.09), termMat);
    term.position.set(bx, 0.75, -0.13);
    edgeGroup.add(term);
  }

  // 8. Transparent Polycarbonate Door Swung Open (+32 deg)
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.72, 1.07, 0.23);
  doorPivot.rotation.y = -Math.PI / 5.5; // Swung open outward

  const doorLeaf = createMesh(new THREE.BoxGeometry(1.42, 1.82, 0.02), glassMat);
  doorLeaf.position.set(0.71, 0, 0);
  doorPivot.add(doorLeaf);

  const doorHandle = createMesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 }));
  doorHandle.position.set(1.36, 0, 0.03);
  doorPivot.add(doorHandle);
  edgeGroup.add(doorPivot);

  // 9. Vertical Cable Trunking Riser to Overhead Trusses
  const riserTray = createMesh(new THREE.BoxGeometry(0.35, 2.5, 0.18), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.6 }));
  riserTray.position.set(0, 3.22, 0);
  edgeGroup.add(riserTray);

  // SCADA Registration
  const edgeData = {
    system: ['hvac', 'cooling', 'thermal'],
    interactive: true,
    rootGroup: edgeGroup,
    title: 'ША-BMS // ШКАФ АВТОМАТИЗАЦИИ EDGE CORE',
    zone: 'ЦЕНТРАЛЬНЫЙ УЗЕЛ УПРАВЛЕНИЯ // DIN-RAIL IPC',
    modbus: 'Modbus TCP 5020 • RS-485 9600 8N1 • ID: 1',
    desc: 'Промышленный шкаф автоматики IP65 (Rittal) с открытой прозрачной дверцей. Внутри: DIN-рейка, безвентиляторный контроллер Advantech Edge IPC (Linux RT, цикл 1000 мс), блок питания MeanWell 24В DC, клеммники WAGO и отходящие кабельные трассы к трем технологическим зонам.',
    action: { label: 'Приблизить шкаф Edge в 3D', fnName: 'focusEdgeCabinetIn3D' },
    telemetryFn: (d) => ({
      status: 'ПЛК ONLINE (ЦИКЛ 1000 МС)',
      statusColor: 'var(--green-light)',
      text: `Пакеты Rx: ${d.packets_rx} • Пакеты Tx: ${d.packets_tx || d.packets_rx + 12} • Modbus TCP 5020: Штатно • Т_шкафа: 24.5 °C`
    })
  };

  edgeGroup.userData = edgeData;
  edgeGroup.traverse((c) => {
    if (c.isMesh) {
      c.userData = edgeData;
      clickableObjects.push(c);
    }
  });

  scene.add(edgeGroup);

  // 10. 3D Industrial Cable Traces (Modbus RS-485 & Control Conduits)
  initBIMBusConduits(scene);
}

function initBIMBusConduits(scene) {
  const conduitGroup = new THREE.Group();
  const orangeBusMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4, metalness: 0.4 }); // RS-485 Modbus
  const blueBusMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.4 });   // HACCP Chiller
  const tealBusMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.4, metalness: 0.4 });   // Cold Storage CC-301

  // Trunk 1: Modbus RS-485 Conduit running to Zone 1 Hot Bakery (-16.5, y=4.42, z=-4.5)
  const z1Conduit = createMesh(new THREE.CylinderGeometry(0.032, 0.032, 8.8, 10), orangeBusMat);
  z1Conduit.rotation.z = Math.PI / 2;
  z1Conduit.position.set(-12.2, 4.42, -4.5);
  conduitGroup.add(z1Conduit);

  // Vertical drop in Zone 1 to Oven Sensor
  const z1Drop = createMesh(new THREE.CylinderGeometry(0.025, 0.025, 2.8, 10), orangeBusMat);
  z1Drop.position.set(-16.5, 3.0, -4.5);
  conduitGroup.add(z1Drop);

  // Trunk 2: HACCP Blue Conduit running to Zone 2 Chiller AC-201 (-0.8, -11.2)
  const z2Path1 = createMesh(new THREE.CylinderGeometry(0.032, 0.032, 6.7, 10), blueBusMat);
  z2Path1.rotation.x = Math.PI / 2;
  z2Path1.position.set(-7.92, 4.42, -7.8);
  conduitGroup.add(z2Path1);

  const z2Path2 = createMesh(new THREE.CylinderGeometry(0.032, 0.032, 7.2, 10), blueBusMat);
  z2Path2.rotation.z = Math.PI / 2;
  z2Path2.position.set(-4.3, 4.42, -11.2);
  conduitGroup.add(z2Path2);

  const z2Drop = createMesh(new THREE.CylinderGeometry(0.025, 0.025, 2.5, 10), blueBusMat);
  z2Drop.position.set(-0.8, 3.15, -11.2);
  conduitGroup.add(z2Drop);

  // Trunk 3: Cold Storage Teal Conduit running to Zone 3 Cold Room CC-301 (19.2, -8.6)
  const z3Conduit = createMesh(new THREE.CylinderGeometry(0.032, 0.032, 27.0, 10), tealBusMat);
  z3Conduit.rotation.z = Math.PI / 2;
  z3Conduit.position.set(5.5, 4.42, -4.5);
  conduitGroup.add(z3Conduit);

  const z3Drop = createMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 10), tealBusMat);
  z3Drop.position.set(19.2, 3.7, -4.5);
  conduitGroup.add(z3Drop);

  scene.add(conduitGroup);
}
