/**
 * BMS ENERGY EFFICIENCY & SCADA AUDITOR (ВРУ-0.4кВ)
 * Обновление виджета энергопотребления, мощности и сэкономленных средств.
 * Стандарт: до 150 строк.
 */

function updateEnergyWidget(e) {
  if (!e) return;

  const card = document.querySelector('.energy-card');
  const actualEl = document.getElementById('energy-actual-val');
  const baseEl = document.getElementById('energy-base-val');
  const loadPctEl = document.getElementById('energy-load-pct');
  const meterFill = document.getElementById('energy-meter-fill');
  const badgePct = document.getElementById('energy-badge-pct');
  const kwhBadge = document.getElementById('energy-kwh-badge');
  const kwhVal = document.getElementById('energy-kwh-val');
  const kwhSub = document.getElementById('energy-kwh-sub');
  const kztVal = document.getElementById('energy-kzt-val');
  const rubVal = document.getElementById('energy-rub-val');
  const tariffLbl = document.getElementById('energy-tariff-lbl');

  if (card) {
    if (e.bms_active === false) {
      card.classList.add('legacy-mode');
    } else {
      card.classList.remove('legacy-mode');
    }
  }

  if (actualEl) actualEl.innerText = `${e.power_actual_kw.toFixed(1)} кВт`;
  if (baseEl) baseEl.innerText = `Базовая: ${e.power_baseline_kw.toFixed(1)} кВт`;

  const loadPct = Math.min(100, Math.round((e.power_actual_kw / e.power_baseline_kw) * 100));
  if (loadPctEl) loadPctEl.innerText = `${loadPct}%`;

  if (meterFill) {
    meterFill.style.width = `${loadPct}%`;
    meterFill.style.background = e.bms_active === false ? 'var(--red-light)' : (loadPct > 75 ? 'var(--amber-light)' : (loadPct > 55 ? 'var(--blue-light)' : 'var(--green-light)'));
  }

  const actKwh = typeof e.energy_actual_kwh === 'number' ? e.energy_actual_kwh : (e.energy_saved_kwh || 0);
  const baseKwh = typeof e.energy_baseline_kwh === 'number' ? e.energy_baseline_kwh : (actKwh * 1.8);
  const savedKwh = typeof e.energy_saved_kwh === 'number' ? e.energy_saved_kwh : 0;
  const savedPct = typeof e.energy_saved_pct === 'number' ? e.energy_saved_pct : Math.round((e.power_saved_pct || 0));

  if (e.bms_active === false) {
    if (actualEl) actualEl.innerText = `${e.power_baseline_kw.toFixed(1)} кВт`;
    if (baseEl) baseEl.innerText = `Паспортная нагрузка без оптимизации`;
    if (badgePct) {
      badgePct.innerText = 'БЕЗ BMS';
      badgePct.className = 'status-badge badge-warn';
    }
    if (kwhBadge) {
      kwhBadge.innerText = '0%';
      kwhBadge.className = 'status-badge badge-warn';
    }
    if (kwhVal) {
      kwhVal.innerText = `${actKwh.toFixed(1)} кВт·ч`;
      kwhVal.className = 'energy-block-val val-red';
    }
    if (kwhSub) {
      kwhSub.innerText = 'Режим перерасхода: оптимизация отключена';
    }
    if (tariffLbl) {
      tariffLbl.innerText = 'РУЧНОЙ РЕЖИМ (ПЕРЕРАСХОД ЭНЕРГИИ)';
    }
  } else {
    if (actualEl) actualEl.innerText = `${e.power_actual_kw.toFixed(1)} кВт`;
    if (baseEl) baseEl.innerText = `Базовая: ${e.power_baseline_kw.toFixed(1)} кВт (дельта -${e.power_saved_kw.toFixed(1)} кВт)`;
    if (badgePct) {
      badgePct.innerText = `-${e.power_saved_pct}%`;
      badgePct.className = 'status-badge badge-ok';
    }
    if (kwhBadge) {
      kwhBadge.innerText = `-${savedPct}%`;
      kwhBadge.className = 'status-badge badge-ok';
    }
    if (kwhVal) {
      kwhVal.innerText = `${actKwh.toFixed(1)} кВт·ч (с BMS)`;
      kwhVal.className = 'energy-block-val val-blue';
    }
    if (kwhSub) {
      kwhSub.innerText = `Без BMS: ${baseKwh.toFixed(1)} кВт·ч • Сберегли: ${savedKwh.toFixed(1)} кВт·ч`;
    }
    if (tariffLbl) {
      tariffLbl.innerText = `Тариф: ${e.tariff_kzt.toFixed(2)} ₸/кВт·ч (${e.is_night ? 'НОЧЬ' : 'ДЕНЬ'})`;
      tariffLbl.style.color = e.is_night ? 'var(--blue-light)' : 'var(--amber-light)';
    }
  }

  if (kztVal) kztVal.innerText = `${e.money_saved_kzt.toLocaleString('ru-RU')} ₸`;
  if (rubVal) rubVal.innerText = `≈ ${e.money_saved_rub.toLocaleString('ru-RU')} ₽ • ${e.tariff_kzt.toFixed(2)} ₸/кВт·ч`;
}
