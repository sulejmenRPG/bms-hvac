/**
 * BIM USER INTERACTION & RAYCASTING
 * Модуль обработки пользовательских кликов, инспектора оборудования, пресетов камеры и тултипов.
 * Стандарт: до 300 строк.
 */

function setCameraView(presetKey) {
  document.querySelectorAll('.btn-cam').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-cam-${presetKey}`);
  if (activeBtn) activeBtn.classList.add('active');

  const preset = cameraPresets[presetKey];
  if (preset && bimControls) {
    camTargetPos.set(...preset.pos);
    camTargetLook.set(...preset.target);
    isTransitioningCam = true;
  }
}

function resetCamera() {
  setCameraView('iso');
}

function selectObject(obj) {
  if (!obj || !obj.userData || !obj.userData.interactive) return;
  const targetObj = obj.userData.rootGroup || obj;
  selectedObject = targetObj;
  if (selectedBoxHelper) {
    selectedBoxHelper.setFromObject(targetObj);
    selectedBoxHelper.visible = true;
  }
  updateInspectorContent(targetObj);
  const panel = document.getElementById('bim-inspector');
  if (panel) panel.style.display = 'flex';
}

function deselectObject() {
  selectedObject = null;
  if (selectedBoxHelper) selectedBoxHelper.visible = false;
  const panel = document.getElementById('bim-inspector');
  if (panel) panel.style.display = 'none';
}

function focusSelectedObject() {
  if (!selectedObject) return;
  const box = new THREE.Box3().setFromObject(selectedObject);
  const center = new THREE.Vector3();
  box.getCenter(center);
  camTargetLook.copy(center);
  camTargetPos.set(center.x + 8, center.y + 6, center.z + 10);
  isTransitioningCam = true;
}

function updateInspectorContent(obj) {
  const u = obj.userData;
  const titleElem = document.getElementById('insp-title');
  const zoneElem = document.getElementById('insp-zone');
  const modbusElem = document.getElementById('insp-modbus');
  const descElem = document.getElementById('insp-desc');
  const actionBtn = document.getElementById('insp-btn-action');

  if (titleElem) titleElem.innerText = u.title || 'ОБОРУДОВАНИЕ';
  if (zoneElem) zoneElem.innerText = u.zone || 'ТЕХНОЛОГИЧЕСКИЙ УЗЕЛ';
  if (modbusElem) modbusElem.innerText = u.modbus || 'HR:0000';
  if (descElem) descElem.innerText = u.desc || '';

  if (actionBtn) {
    if (u.action) {
      actionBtn.style.display = 'inline-block';
      actionBtn.innerText = u.action.label;
      actionBtn.onclick = () => {
        if (typeof window[u.action.fnName] === 'function') {
          window[u.action.fnName]();
        }
      };
    } else {
      actionBtn.style.display = 'none';
    }
  }

  updateInspectorTelemetry(obj);
}

function updateInspectorTelemetry(obj) {
  if (!obj || !obj.userData) return;
  const statusElem = document.getElementById('insp-status');
  const telemElem = document.getElementById('insp-telemetry');
  if (obj.userData.telemetryFn && window.plantData) {
    const res = obj.userData.telemetryFn(window.plantData);
    if (statusElem) {
      statusElem.innerText = res.status;
      statusElem.style.color = res.statusColor || 'var(--text-bright)';
    }
    if (telemElem) telemElem.innerText = res.text;
  } else if (!obj.userData.telemetryFn) {
    if (statusElem) {
      statusElem.innerText = 'ГОТОВ К РАБОТЕ';
      statusElem.style.color = 'var(--green-light)';
    }
    if (telemElem) telemElem.innerText = 'Параметры технологического узла в норме';
  }
}

function initBIMInteraction(canvas, wrapper) {
  let isPointerDragging = false;
  let pointerDownPos = { x: 0, y: 0 };

  canvas.addEventListener('pointerdown', (e) => {
    isPointerDragging = false;
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointermove', (e) => {
    const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (dist > 5) isPointerDragging = true;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, bimCamera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    const tooltip = document.getElementById('bim-hover-tooltip');
    if (intersects.length > 0 && !isPointerDragging) {
      let target = intersects[0].object;
      while (target && (!target.userData || !target.userData.interactive) && target.parent) {
        target = target.parent;
      }
      if (target && target.userData && target.userData.interactive) {
        canvas.style.cursor = 'pointer';
        if (tooltip) {
          tooltip.innerText = target.userData.title;
          tooltip.style.left = (e.clientX - rect.left) + 'px';
          tooltip.style.top = (e.clientY - rect.top) + 'px';
          tooltip.style.display = 'block';
        }
        return;
      }
    }
    canvas.style.cursor = 'grab';
    if (tooltip) tooltip.style.display = 'none';
  });

  canvas.addEventListener('pointerup', (e) => {
    const tooltip = document.getElementById('bim-hover-tooltip');
    if (tooltip) tooltip.style.display = 'none';
    if (isPointerDragging) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, bimCamera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
      let target = intersects[0].object;
      while (target && (!target.userData || !target.userData.interactive) && target.parent) {
        target = target.parent;
      }
      if (target && target.userData && target.userData.interactive) {
        selectObject(target);
        return;
      }
    }
    deselectObject();
  });

  if (window.ResizeObserver && wrapper) {
    new ResizeObserver(() => {
      const w = wrapper.clientWidth;
      const h = wrapper.clientHeight;
      if (bimCamera && bimRenderer && w && h) {
        bimCamera.aspect = w / h;
        bimCamera.updateProjectionMatrix();
        bimRenderer.setSize(w, h, false);
      }
    }).observe(wrapper);
  }
}
