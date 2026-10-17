/**
 * BMS SCADA Telemetry & Dynamic Control Loop
 * Опрос Modbus TCP сервера через REST API (/api/status, /api/trigger/*, /api/setpoints),
 * обновление карточек технологических зон, HUD плашек 3D BIM модели,
 * осциллографа Canvas и инспектора оборудования.
 */

window.plantData = null;

function formatUptime(sec) {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

async function stepGlazingTemp(delta) {
  if (!window.plantData) return;
  const curT = window.plantData.zones.glazing.target_temp;
  const newT = Math.max(16.0, Math.min(26.0, curT + delta));
  try {
    await fetch('/api/setpoints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone: 'glazing', target_temp: newT })
    });
  } catch (e) {
    console.error('Error setting glazing setpoint:', e);
  }
}

async function toggleOven() {
  try {
    const res = await fetch('/api/trigger/oven', { method: 'POST' });
    const d = await res.json();
    updateScenarioButtons(d.oven_open, null, null);
  } catch (e) {
    console.error('Error toggling oven:', e);
  }
}

async function triggerOvenPhys(targetState) {
  if (!window.plantData) return;
  if (!!window.plantData.oven_open !== !!targetState) {
    await toggleOven();
  }
}
window.triggerOvenPhys = triggerOvenPhys;

async function toggleBay() {
  try {
    const res = await fetch('/api/trigger/bay', { method: 'POST' });
    const d = await res.json();
    updateScenarioButtons(null, d.bay_door_open, null);
  } catch (e) {
    console.error('Error toggling bay door:', e);
  }
}

async function toggleNight() {
  try {
    const res = await fetch('/api/trigger/night', { method: 'POST' });
    const d = await res.json();
    updateScenarioButtons(null, null, d.night_mode);
  } catch (e) {
    console.error('Error toggling night mode:', e);
  }
}

async function setZoneLighting(zone, level) {
  try {
    const res = await fetch('/api/trigger/light', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone, level })
    });
    const d = await res.json();
    if (window.plantData && d.lighting) {
      window.plantData.lighting = d.lighting;
    }
  } catch (e) {
    console.error('Error controlling lighting:', e);
  }
}

function toggleCeilingLighting() {
  if (!window.plantData) return;
  const cur = (window.plantData.lighting && window.plantData.lighting.glazing !== undefined)
    ? window.plantData.lighting.glazing
    : (window.plantData.night_mode ? 30 : 100);
  const target = (cur > 50) ? 30 : 100;
  setZoneLighting('all', target);
}

async function toggleBMSAutomation() {
  try {
    const res = await fetch('/api/trigger/automation', { method: 'POST' });
    const d = await res.json();
    updateAutomationButton(d.mode);
  } catch (e) {
    console.error('Error toggling BMS mode:', e);
  }
}

// Экспорт глобальных функций для вызова из инспектора Three.js и onclick кнопок
window.stepGlazingTemp = stepGlazingTemp;
window.toggleOven = toggleOven;
window.toggleBay = toggleBay;
window.toggleNight = toggleNight;
window.toggleBMSAutomation = toggleBMSAutomation;
window.setZoneLighting = setZoneLighting;
window.toggleCeilingLighting = toggleCeilingLighting;
window.formatUptime = formatUptime;

function updateAutomationButton(mode) {
  const b = document.getElementById('btn-toggle-bms');
  if (b) {
    const isAuto = mode === 'auto';
    b.className = isAuto ? 'btn-scenario btn-bms-on' : 'btn-scenario btn-bms-off';
    b.innerText = isAuto ? 'Автоматика BMS: ВКЛ (PID)' : 'Автоматика: ОТКЛ (Ручной)';
  }
}

function updateScenarioButtons(oven, bay, night) {
  if (oven !== null && oven !== undefined) {
    const b = document.getElementById('btn-oven');
    if (b) {
      b.className = oven ? 'btn-scenario active' : 'btn-scenario';
      b.innerText = oven ? 'Закрыть печь (Тест активен)' : 'Тест: Открытие печи (+5 °C в Зону 1)';
    }
  }
  if (bay !== null && bay !== undefined) {
    const b = document.getElementById('btn-bay');
    if (b) {
      b.className = bay ? 'btn-scenario active' : 'btn-scenario';
      b.innerText = bay ? 'Закрыть ворота (Тест активен)' : 'Тест: Ворота склада (+25% Rh)';
    }
  }
  if (night !== null && night !== undefined) {
    const b = document.getElementById('btn-night');
    if (b) {
      b.className = night ? 'btn-scenario active' : 'btn-scenario';
      b.innerText = night ? 'Режим: Ночная смена (Уставка 23.5 °C)' : 'Переключить ночную смену';
    }
  }
}

function updateHumanSummary(z1, z2, z3, ovenOpen, bayOpen, nightMode, mode) {
  const banner = document.getElementById('action-summary-text');
  const badge = document.getElementById('action-status-badge');
  if (!banner || !badge) return;

  if (mode === 'manual') {
    if (z2.temp > 20.2) {
      badge.className = 'status-badge badge-warn';
      badge.innerText = 'КРИТИЧЕСКИЙ БРАК';
      banner.innerText = `Ручной режим: шоколад потек (${z2.temp.toFixed(1)} °C)! Чиллер заблокирован на 20%`;
      return;
    }
    badge.className = 'status-badge badge-warn';
    badge.innerText = 'РУЧНОЙ РЕЖИМ';
    banner.innerText = 'BMS отключена. Оборудование работает на фиксированных параметрах старого цеха';
    return;
  }

  if (ovenOpen) {
    badge.className = 'status-badge badge-warn';
    badge.innerText = 'ВЫБРОС ТЕПЛА';
    banner.innerText = `Печи открыты (${z1.temp.toFixed(1)} °C). Чиллер Z2 форсирован до ${z2.ac}%`;
  } else if (bayOpen) {
    badge.className = 'status-badge badge-warn';
    badge.innerText = 'ПОДСОС ВЛАГИ';
    banner.innerText = `Ворота склада открыты (${z3.hum.toFixed(0)}% Rh). Осушитель Z3 включен (${z3.dehum}%)`;
  } else if (nightMode) {
    badge.className = 'status-badge badge-ok';
    badge.innerText = 'ЭНЕРГОСБЕРЕЖЕНИЕ';
    banner.innerText = `Ночная смена. Дежурная уставка Z2: ${z2.target_temp.toFixed(1)} °C`;
  } else if (z2.ac > 0) {
    badge.className = 'status-badge badge-active';
    badge.innerText = 'ОХЛАЖДЕНИЕ';
    banner.innerText = `Шоколад: ${z2.temp.toFixed(1)} °C (уставка ${z2.target_temp.toFixed(1)} °C). Чиллер: ${z2.ac}%`;
  } else {
    badge.className = 'status-badge badge-ok';
    badge.innerText = 'НОРМА';
    banner.innerText = 'Все 3 технологические зоны в допуске';
  }
}

async function poll() {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) return;
    const plantData = await res.json();
    window.plantData = plantData;

    // Верхняя информационная панель
    const statPackets = document.getElementById('stat-packets');
    if (statPackets) statPackets.innerText = `${plantData.packets_rx} / ${plantData.packets_tx}`;

    const statUptime = document.getElementById('stat-uptime');
    if (statUptime) statUptime.innerText = formatUptime(plantData.uptime);

    const statShift = document.getElementById('stat-shift');
    if (statShift) {
      statShift.innerText = plantData.night_mode ? 'НОЧЬ (23.5°C)' : 'ДЕНЬ (19.0°C)';
      statShift.style.color = plantData.night_mode ? '#38bdf8' : '#22c55e';
    }

    updateAutomationButton(plantData.mode);
    updateScenarioButtons(plantData.oven_open, plantData.bay_door_open, plantData.night_mode);

    if (typeof updateEnergyWidget === 'function') {
      try {
        updateEnergyWidget(plantData.energy);
      } catch (err) {
        console.error('Energy widget update error:', err);
      }
    }

    const z1 = plantData.zones.bakery;
    const z2 = plantData.zones.glazing;
    const z3 = plantData.zones.storage;

    if (plantData.haccp_summary) {
      const dbSumEl = document.getElementById('haccp-db-summary');
      if (dbSumEl) dbSumEl.innerText = `${plantData.haccp_summary.compliance_pct}% норма (${plantData.haccp_summary.total_records} зап.)`;
    }

    // Текстовая сводка статуса HACCP
    updateHumanSummary(z1, z2, z3, plantData.oven_open, plantData.bay_door_open, plantData.night_mode, plantData.mode);

    // 3D BIM Плавающие бейджи (HUD)
    const hudZ1T = document.getElementById('hud-z1-temp');
    if (hudZ1T) hudZ1T.innerText = `${z1.temp.toFixed(1)} °C`;
    const hudZ1H = document.getElementById('hud-z1-hum');
    if (hudZ1H) hudZ1H.innerText = `${z1.hum.toFixed(0)} % Rh`;
    const hudZ1F = document.getElementById('hud-z1-fan');
    if (hudZ1F) hudZ1F.innerText = `${z1.fan}%`;
    const hudZ1O = document.getElementById('hud-z1-oven');
    if (hudZ1O) {
      hudZ1O.innerText = plantData.oven_open ? 'Печи открыты' : 'Штатно';
      hudZ1O.style.color = plantData.oven_open ? 'var(--red)' : 'var(--green)';
    }

    const hudZ2T = document.getElementById('hud-z2-temp');
    if (hudZ2T) hudZ2T.innerText = `${z2.temp.toFixed(1)} °C`;
    const hudZ2H = document.getElementById('hud-z2-hum');
    if (hudZ2H) hudZ2H.innerText = `${z2.hum.toFixed(0)} % Rh`;
    const hudZ2SP = document.getElementById('hud-z2-sp');
    if (hudZ2SP) hudZ2SP.innerText = `${z2.target_temp.toFixed(1)} °C`;
    const hudZ2AC = document.getElementById('hud-z2-ac');
    if (hudZ2AC) hudZ2AC.innerText = `${z2.ac}%`;
    const hudZ2HP = document.getElementById('hud-z2-hum-p');
    if (hudZ2HP) hudZ2HP.innerText = `${z2.hum_p}%`;

    const hudZ3H = document.getElementById('hud-z3-hum');
    if (hudZ3H) hudZ3H.innerText = `${z3.hum.toFixed(0)} % Rh`;
    const hudZ3T = document.getElementById('hud-z3-temp');
    if (hudZ3T) hudZ3T.innerText = `${z3.temp.toFixed(1)} °C`;
    const hudZ3DH = document.getElementById('hud-z3-dehum');
    if (hudZ3DH) hudZ3DH.innerText = `${z3.dehum}%`;
    const hudZ3B = document.getElementById('hud-z3-bay');
    if (hudZ3B) {
      hudZ3B.innerText = plantData.bay_door_open ? 'Ворота открыты' : 'Закрыты';
      hudZ3B.style.color = plantData.bay_door_open ? 'var(--red)' : 'var(--green)';
    }

    // Карточки Зоны 1 (Выпечка)
    const z1T = document.getElementById('z1-temp');
    if (z1T) z1T.innerText = z1.temp.toFixed(1) + ' °C';
    const z1H = document.getElementById('z1-hum');
    if (z1H) z1H.innerText = z1.hum.toFixed(0) + ' %';
    const z1F = document.getElementById('z1-fan-pct');
    if (z1F) z1F.innerText = z1.fan + ' %';
    const z1FB = document.getElementById('z1-fan-bar');
    if (z1FB) z1FB.style.width = z1.fan + '%';
    const z1OS = document.getElementById('z1-oven-status');
    if (z1OS) {
      z1OS.innerText = plantData.oven_open ? 'Печи открыты (Выброс тепла)' : 'Печи закрыты (Штатно)';
      z1OS.style.color = plantData.oven_open ? 'var(--red)' : 'var(--text-muted)';
    }

    // Карточки Зоны 2 (Глазирование)
    const z2T = document.getElementById('z2-temp');
    if (z2T) z2T.innerText = z2.temp.toFixed(1) + ' °C';
    const z2H = document.getElementById('z2-hum');
    if (z2H) z2H.innerText = z2.hum.toFixed(0) + ' %';
    const z2SP = document.getElementById('z2-sp-val');
    if (z2SP) z2SP.innerText = z2.target_temp.toFixed(1) + ' °C';
    const z2AC = document.getElementById('z2-ac-pct');
    if (z2AC) z2AC.innerText = z2.ac + ' %';
    const z2ACB = document.getElementById('z2-ac-bar');
    if (z2ACB) z2ACB.style.width = z2.ac + '%';
    const z2HP = document.getElementById('z2-hum-pct');
    if (z2HP) z2HP.innerText = z2.hum_p + ' %';
    const z2HPB = document.getElementById('z2-hum-bar');
    if (z2HPB) z2HPB.style.width = z2.hum_p + '%';

    // Карточки Зоны 3 (Склад муки)
    const z3H = document.getElementById('z3-hum');
    if (z3H) z3H.innerText = z3.hum.toFixed(0) + ' %';
    const z3T = document.getElementById('z3-temp');
    if (z3T) z3T.innerText = z3.temp.toFixed(1) + ' °C';
    const z3DH = document.getElementById('z3-dehum-pct');
    if (z3DH) z3DH.innerText = z3.dehum + ' %';
    const z3DHB = document.getElementById('z3-dehum-bar');
    if (z3DHB) z3DHB.style.width = z3.dehum + '%';
    const z3BS = document.getElementById('z3-bay-status');
    if (z3BS) {
      z3BS.innerText = plantData.bay_door_open ? 'Ворота открыты (Сырость)' : 'Ворота закрыты (Сухо)';
      z3BS.style.color = plantData.bay_door_open ? 'var(--red)' : 'var(--text-muted)';
    }

    // Обновление панели инспектора оборудования Three.js в реальном времени
    if (typeof selectedObject !== 'undefined' && selectedObject && typeof updateInspectorTelemetry === 'function') {
      updateInspectorTelemetry(selectedObject);
    }

    // Отрисовка осциллографа
    if (plantData.history && plantData.history.length > 1) {
      drawChart(plantData.history, z2.target_temp);
    }

    // Журнал событий
    if (plantData.events) {
      const logBox = document.getElementById('event-log-box');
      if (logBox) {
        logBox.innerHTML = plantData.events.map(e => `
          <div class="log-row">
            <span class="log-time">[${e.time}]</span>
            <span class="log-lvl lvl-${e.level}">${e.level}</span>
            <span class="log-msg">${e.msg}</span>
          </div>
        `).join('');
      }
    }

    if (typeof updateEdgeBusTopology === 'function') {
      updateEdgeBusTopology(plantData);
    }
  } catch (err) {
    console.error('Telemetry poll error:', err);
  }
}

function drawChart(history, spZ2) {
  if (typeof drawTelemetryChart === 'function') {
    drawTelemetryChart(history, spZ2);
  }
}

// Запуск циклического опроса Modbus
window.addEventListener('DOMContentLoaded', () => {
  poll();
  setInterval(poll, 1000);
});

window.addEventListener('resize', () => {
  if (window.plantData && window.plantData.history) {
    drawChart(window.plantData.history, window.plantData.zones.glazing.target_temp);
  }
});
