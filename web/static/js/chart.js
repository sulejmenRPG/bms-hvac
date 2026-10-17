/**
 * BMS SCADA Industrial Oscilloscope
 * Промышленный осциллограф с двойной шкалой оси Y (Температура °C / Влажность %),
 * коридором качества HACCP, масштабируемой сеткой и текущими метками.
 * Стандарт: до 150 строк.
 */

function drawTelemetryChart(history, spZ2) {
  const canvas = document.getElementById('telemetryChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const width = canvas.parentElement.clientWidth - 20;
  const height = 150;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const marginL = 46;
  const marginR = 40;
  const marginT = 16;
  const marginB = 18;
  const plotW = Math.max(100, width - marginL - marginR);
  const plotH = Math.max(50, height - marginT - marginB);

  // Диапазоны шкал
  const tMin = 14.0, tMax = 34.0;
  const hMin = 20.0, hMax = 80.0;

  function tToY(t) {
    const clamped = Math.max(tMin, Math.min(tMax, t));
    return marginT + plotH - ((clamped - tMin) / (tMax - tMin)) * plotH;
  }

  function hToY(h) {
    const clamped = Math.max(hMin, Math.min(hMax, h));
    return marginT + plotH - ((clamped - hMin) / (hMax - hMin)) * plotH;
  }

  // 1. Зеленый коридор допуска HACCP (Зона 2: 18.0..19.5 °C)
  const haccpTop = tToY(19.5);
  const haccpBottom = tToY(18.0);
  ctx.fillStyle = 'rgba(35, 134, 54, 0.14)';
  ctx.fillRect(marginL, haccpTop, plotW, haccpBottom - haccpTop);
  ctx.strokeStyle = 'rgba(63, 185, 80, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(marginL, haccpTop, plotW, haccpBottom - haccpTop);

  ctx.fillStyle = 'rgba(63, 185, 80, 0.65)';
  ctx.font = '9px monospace';
  ctx.fillText('HACCP 18.0..19.5°C', marginL + 6, haccpTop + 10);

  // 2. Горизонтальная координатная сетка и подписи осей Y
  ctx.lineWidth = 1;
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = marginT + (plotH / steps) * i;
    const tVal = Math.round(tMax - ((tMax - tMin) / steps) * i);
    const hVal = Math.round(hMax - ((hMax - hMin) / steps) * i);

    // Линия сетки
    ctx.strokeStyle = '#161d28';
    ctx.beginPath();
    ctx.moveTo(marginL, y);
    ctx.lineTo(marginL + plotW, y);
    ctx.stroke();

    // Шкала температур слева (°C)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${tVal}°C`, marginL - 6, y + 3);

    // Шкала влажности справа (%)
    ctx.fillStyle = '#14b8a6';
    ctx.textAlign = 'left';
    ctx.fillText(`${hVal}%`, marginL + plotW + 6, y + 3);
  }

  const points = history.length;
  if (points < 2) return;
  const stepX = plotW / (points - 1);

  // 3. Уставка Z2 (Пунктирная синяя линия)
  if (spZ2 !== undefined) {
    const spY = tToY(spZ2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#388bfd';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(marginL, spY);
    ctx.lineTo(marginL + plotW, spY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Вспомогательная функция отрисовки серии
  function drawSeries(valGetter, strokeColor, lineWidth, isDashed = false) {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    if (isDashed) ctx.setLineDash([3, 3]); else ctx.setLineDash([]);

    for (let i = 0; i < points; i++) {
      const x = marginL + i * stepX;
      const y = valGetter(history[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 4. Отрисовка кривых
  drawSeries((pt) => tToY(pt.z1_temp), '#f43f5e', 2.0); // Z1: Печи (°C)
  drawSeries((pt) => tToY(pt.z2_temp), '#38bdf8', 2.4); // Z2: Шоколад (°C)
  drawSeries((pt) => hToY(pt.z3_hum), '#2dd4bf', 1.6);  // Z3: Мука (%)

  // 5. Текущие маркеры на правом крае графика
  const last = history[points - 1];
  const lastX = marginL + (points - 1) * stepX;

  function drawEndBadge(y, text, color) {
    ctx.beginPath();
    ctx.arc(lastX, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(text, lastX - 6, y - 4);
  }

  drawEndBadge(tToY(last.z1_temp), `${last.z1_temp.toFixed(1)}°`, '#f43f5e');
  drawEndBadge(tToY(last.z2_temp), `${last.z2_temp.toFixed(1)}°`, '#38bdf8');
  drawEndBadge(hToY(last.z3_hum), `${last.z3_hum.toFixed(0)}%`, '#2dd4bf');
}
