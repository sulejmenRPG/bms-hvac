/**
 * BIM SYSTEM ISOLATION MODES (GHOST / INSPECTION DISCIPLINE ENGINE)
 * Послойная изоляция инженерных сетей предприятия в 3D:
 * 'all'      - Все системы (штатный вид)
 * 'lighting' - Освещение цеха и щит ЩО-1
 * 'thermal'  - Печной зал, ротационные печи, вытяжной зонт ВЗ-101
 * 'cooling'  - Чиллер AC-201, трассы фреона, туннель, глазировка
 * 'hvac'     - Вентиляция, воздуховоды, VAV, диффузоры, осушитель DH-301
 * Стандарт: до 150 строк.
 */

window.currentIsolationMode = 'all';

// Специализированные материалы для замутнения (Ghost / Halftone)
const ghostMatSolid = new THREE.MeshStandardMaterial({
  color: 0x161d28,
  roughness: 0.96,
  metalness: 0.04
});

const ghostMatGlass = new THREE.MeshStandardMaterial({
  color: 0x101620,
  roughness: 0.9,
  metalness: 0.1,
  transparent: true,
  opacity: 0.18,
  depthWrite: false
});

function isMeshInSystem(mesh, targetSystem) {
  if (targetSystem === 'all') return true;
  let curr = mesh;
  while (curr && curr !== bimScene) {
    if (curr.userData && curr.userData.system) {
      const s = curr.userData.system;
      if (Array.isArray(s)) {
        if (s.includes(targetSystem)) return true;
      } else if (s === targetSystem) {
        return true;
      }
    }
    curr = curr.parent;
  }
  return false;
}

function setBIMIsolationMode(mode) {
  window.currentIsolationMode = mode;
  if (!bimScene) return;

  // 1. Обновление визуального состояния кнопок в HUD
  const modeButtons = document.querySelectorAll('.btn-mode');
  modeButtons.forEach(b => {
    b.classList.remove('active');
    if (b.id === `btn-mode-${mode}`) {
      b.classList.add('active');
    }
  });

  // 2. Рекурсивный проход по 3D-сцене и подмена материалов
  bimScene.traverse((child) => {
    if (!child.isMesh) return;
    if (child === selectedBoxHelper) return;

    if (!child._origMaterial) {
      child._origMaterial = (child.userData && child.userData.origMaterial) ? child.userData.origMaterial : child.material;
    }

    if (mode === 'all') {
      child.material = child._origMaterial;
      return;
    }

    const inSystem = isMeshInSystem(child, mode);
    if (inSystem) {
      child.material = child._origMaterial;
    } else {
      const orig = child._origMaterial;
      if (orig && (orig.transparent || orig.opacity < 0.95)) {
        child.material = ghostMatGlass;
      } else {
        child.material = ghostMatSolid;
      }
    }
  });

  // 3. Управление технологическими и общими источниками света
  const isNight = window.plantData ? !!window.plantData.night_mode : false;
  if (mode === 'lighting') {
    // В режиме изоляции света: глубокое затемнение цеха для яркого контраста
    if (bimAmbientLight) bimAmbientLight.intensity = 0.08;
    if (bimSunLight) bimSunLight.intensity = 0.04;
    if (bimFillLight) bimFillLight.intensity = 0.02;
    if (Array.isArray(window.lightCones)) {
      window.lightCones.forEach(c => {
        c.mesh.visible = true;
        c.mat.opacity = 0.24;
        if (c.lensMat) c.lensMat.emissiveIntensity = 2.8;
      });
    }
  } else {
    // Восстановление нормального баланса дневного/ночного освещения
    if (bimAmbientLight) bimAmbientLight.intensity = isNight ? 0.25 : 0.75;
    if (bimSunLight) bimSunLight.intensity = isNight ? 0.0 : 1.15;
    if (bimFillLight) bimFillLight.intensity = isNight ? 0.10 : 0.40;
    if (Array.isArray(window.lightCones)) {
      window.lightCones.forEach(c => {
        c.mesh.visible = (mode === 'all');
        c.mat.opacity = 0.06;
        if (c.lensMat) c.lensMat.emissiveIntensity = 0.95;
      });
    }
  }

  if (Array.isArray(overheadLights)) {
    overheadLights.forEach(l => {
      l.visible = (mode === 'all' || mode === 'lighting');
      l.intensity = (mode === 'lighting') ? 1.6 : 0.85;
    });
  }
  if (ovenLight) {
    ovenLight.visible = (mode === 'all' || mode === 'thermal');
    ovenLight.intensity = (mode === 'thermal') ? 2.6 : 0.6;
  }
  if (chillerLight) {
    chillerLight.visible = (mode === 'all' || mode === 'cooling');
    chillerLight.intensity = (mode === 'cooling') ? 2.6 : 0.5;
  }
  if (storageLight) {
    storageLight.visible = (mode === 'all' || mode === 'hvac');
    storageLight.intensity = (mode === 'hvac') ? 2.2 : 0.5;
  }

  // 4. Тонкая подстройка экспозиции сцены для контраста
  if (bimRenderer) {
    bimRenderer.toneMappingExposure = (mode === 'lighting') ? 1.45 : ((mode === 'all') ? 1.15 : 1.30);
  }
}

// Экспорт глобальной функции для onclick кнопок
window.setBIMIsolationMode = setBIMIsolationMode;
window.ghostMatSolid = ghostMatSolid;
window.ghostMatGlass = ghostMatGlass;
