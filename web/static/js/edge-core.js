/**
 * BMS EDGE ARCHITECTURE & CODE SYNCHRONIZER
 * Интерактивная синхронизация 3D-модели контроллера и кода ядра в реальном времени.
 * Стандарт: до 200 строк.
 */

(function () {
  'use strict';

  let currentPartId = 'overview';

  const edgeStepsData = {
    overview: {
      title: '0. Общий вид — Advantech IPC (DIN-рейка TS 35)',
      pill: '360° ОБЗОР • СВОБОДНО',
      camPos: [0.0, 0.35, 7.6],
      camTarget: [0.0, 0.05, 0.0],
      code: `# Автономный контур диспетчеризации кондитерского цеха:
# - DIN-рейка TS 35 со стальной оцинкованной панелью
# - Промышленный компьютер Advantech IPC Core (Linux RT)
# - Шина Modbus TCP/RTU к трем технологическим зонам
# - Интеграция с прецизионным чиллером AC-201 и печами`,
      desc: 'Полная 3D-модель аппаратного узла. Вращайте левой кнопкой мыши под любым углом, свободно отдаляйте колесиком.',
      fnTelemetry: (d) => ({
        status: 'Штатная работа цеха',
        reg: `Пакетов: ${d?.packets_rx || 0} • Такт: 1.0 с`,
        act: 'Все 3 технологические зоны на связи'
      })
    },

    rs485: {
      title: '1. Порт RS-485 / COM1 — Шина Modbus RTU',
      pill: 'ONLINE • 9600 8N1',
      camPos: [-0.05, -0.25, 4.4],
      camTarget: [-0.33, -0.52, 0.22],
      code: `# Чтение датчиков температуры и влажности по витой паре RS-485:
resp = await client.read_holding_registers(address=0, count=24, slave=1)
z1_temp = resp.registers[0] / 10.0   # Горячий цех: Pt100 печей
z2_temp = resp.registers[10] / 10.0  # Шоколадный цех: Pt100 глазировки (HACCP)
z3_hum  = resp.registers[21] / 10.0  # Склад: влажность муки`,
      desc: 'Через съемный зеленый клеммник Phoenix Contact (COM1) контроллер опрашивает термометры Pt100 и концевики по витой паре.',
      fnTelemetry: (d) => ({
        status: 'Опрос шины: 1000 мс',
        reg: `HR:0010 = ${(d?.zones?.glazing?.temp || 19.2).toFixed(1)} °C`,
        act: `Pt100: Шоколад ${(d?.zones?.glazing?.temp || 19.2).toFixed(1)}°C, Печи ${(d?.zones?.bakery?.temp || 26.0).toFixed(1)}°C`
      })
    },

    cpu: {
      title: '2. Модуль IPC Core — Алгоритм ПИД HACCP',
      pill: 'ТАКТ 1.0 с • REAL-TIME',
      camPos: [0.0, 0.4, 4.8],
      camTarget: [-0.25, 0.15, 0.0],
      code: `# ПИД-терморегуляция и упреждающая компенсация теплопритоков:
DEADBAND_T = 0.35
diff_t = z2_temp - state.target_z2_temp
if diff_t > DEADBAND_T:
    # Защита глазури от таяния: плавный разгон ЕС-компрессора
    target_ac = min(100, int((diff_t - DEADBAND_T) * 45) + 25)
    state.z2_ac = min(target_ac, state.z2_ac + 5)`,
      desc: 'Анодированный алюминиевый корпус с ребрами радиатора. В ядре Linux RT непрерывно работает ПИД-компенсация теплопритоков HACCP.',
      fnTelemetry: (d) => {
        const sp = d?.zones?.glazing?.target_temp || 19.0;
        const cur = d?.zones?.glazing?.temp || 19.2;
        const diff = (cur - sp).toFixed(2);
        return {
          status: 'ПИД-оптимизация активна',
          reg: `Дельта T: ${diff > 0 ? '+' + diff : diff} °C (Уставка: ${sp.toFixed(1)} °C)`,
          act: d?.zones?.glazing?.ac > 0 ? `Охлаждение: ${d.zones.glazing.ac}% мощности` : 'Температура в норме HACCP'
        };
      }
    },

    io: {
      title: '3. Модули ввода-вывода I/O — Выходы 0-10В',
      pill: 'АКТИВНЫ (0..10V)',
      camPos: [1.3, 0.2, 4.8],
      camTarget: [1.05, -0.1, 0.0],
      code: `# Выдача аналоговых заданий 0-10В на приводы технологических линий:
await client.write_register(12, state.z2_ac, slave=1)    # Чиллер AC-201
await client.write_register(2, state.z1_fan, slave=1)    # Вытяжной зонт EF-101
await client.write_register(22, state.z3_dehum, slave=1) # Осушитель DH-301`,
      desc: 'Клеммные модули I/O выдают аналоговый сигнал 0-10В на частотные преобразователи вентиляторов и компрессора чиллера.',
      fnTelemetry: (d) => ({
        status: 'Управление инверторами',
        reg: `HR:0012=${d?.zones?.glazing?.ac || 0}% • HR:0002=${d?.zones?.bakery?.fan || 30}%`,
        act: `Чиллер: ${d?.zones?.glazing?.ac || 0}%, Вытяжка: ${d?.zones?.bakery?.fan || 30}%`
      })
    },

    pwr: {
      title: '4. Блок питания MeanWell — 24В DC & Watchdog',
      pill: '100% OFFLINE • OK',
      camPos: [-1.4, 0.4, 4.8],
      camTarget: [-1.45, 0.1, 0.0],
      code: `# Независимый цикл отказоустойчивости на DIN-рейке цеха:
while True:
    state.packets_rx += 1
    watchdog_pet() # Сброс аппаратного таймера зависания
    await asyncio.sleep(1.0) # Детерминированный шаг без облака`,
      desc: 'Импульсный промышленный источник питания MeanWell 24В DC. Аппаратный таймер гарантирует 100% автономную работу цеха без облака.',
      fnTelemetry: (d) => ({
        status: 'Питание 24В DC стабильно',
        reg: `Пакетов Modbus: ${d?.packets_rx || 0}`,
        act: '100% автономная работа без облака'
      })
    }
  };

  function selectEdgePart(partId) {
    if (!edgeStepsData[partId]) return;
    currentPartId = partId;

    // 1. Подсветка активной кнопки
    document.querySelectorAll('.part-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`btn-part-${partId}`);
    if (btn) btn.classList.add('active');

    const step = edgeStepsData[partId];

    // 2. Обновление текстовых полей
    const titleEl = document.getElementById('edge-flow-title');
    const pillEl = document.getElementById('edge-flow-pill');
    const codeEl = document.getElementById('edge-flow-code');
    const descEl = document.getElementById('edge-flow-desc');

    if (titleEl) titleEl.innerText = step.title;
    if (pillEl) pillEl.innerText = step.pill;
    if (codeEl) codeEl.innerText = step.code;
    if (descEl) descEl.innerText = step.desc;

    // 3. Синхронизация подсветки в 3D вьюере
    if (typeof window.highlightEdgePart === 'function') {
      window.highlightEdgePart(partId);
    }

    // 4. Плавный кинематографический перелет 3D-камеры к выбранному узлу
    if (typeof window.flyEdgeCamera === 'function') {
      window.flyEdgeCamera(step.camPos, step.camTarget);
    }

    // 5. Обновление живых параметров
    if (window.plantData) {
      updateEdgeLiveTelemetry(window.plantData);
    }
  }

  function updateEdgeLiveTelemetry(data) {
    const step = edgeStepsData[currentPartId];
    if (!step || !step.fnTelemetry) return;

    const t = step.fnTelemetry(data);
    const stEl = document.getElementById('flow-status');
    const regEl = document.getElementById('flow-reg');
    const actEl = document.getElementById('flow-act');

    if (stEl) stEl.innerText = t.status;
    if (regEl) regEl.innerText = t.reg;
    if (actEl) actEl.innerText = t.act;
  }

  function updateEdgeBusTopology(data) {
    updateEdgeLiveTelemetry(data);
  }

  // Экспорт в глобальное пространство window
  window.onEdgePartActivated = function(partId) {
    selectEdgePart(partId);
  };
  window.selectEdgePart = selectEdgePart;
  window.updateEdgeBusTopology = updateEdgeBusTopology;

  // Автоматическая инициализация 3D-вьюера контроллера
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof window.initEdge3DViewer === 'function') {
        window.initEdge3DViewer('edge-3d-canvas-container');
      }
      selectEdgePart('overview');
    }, 120);
  });
})();
