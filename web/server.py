"""
BMS Web Сервер и Контроллер автоматики кондитерского цеха (3 зоны).
Контуры:
- Зона 1: Горячий цех выпечки (Печи)
- Зона 2: Цех глазировки (Шоколад - критический HACCP контур)
- Зона 3: Склад муки и зона разгрузки
"""

import asyncio
import datetime
import logging
from pathlib import Path
import sys
from typing import Optional

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pymodbus.client import AsyncModbusTcpClient

try:
    from web.energy_service import EnergyAuditor
    from web.telemetry_db import telemetry_db, reports_router
except ImportError:
    from energy_service import EnergyAuditor
    from telemetry_db import telemetry_db, reports_router

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logging.getLogger("pymodbus").setLevel(logging.WARNING)

MODBUS_HOST = "127.0.0.1"
MODBUS_PORT = 5020
DEVICE_ID = 1

app = FastAPI(title="BMS Confectionery Plant Controller")
app.include_router(reports_router)

static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

energy_auditor = EnergyAuditor()

class PlantState:
    def __init__(self):
        self.energy: dict = {}
        # Зона 1: Выпечка (Печи)
        self.z1_temp: float = 26.2
        self.z1_hum: float = 36.0
        self.z1_fan: int = 40
        self.target_z1_temp: float = 26.0

        # Зона 2: Глазировка (Шоколад - мастер-контур)
        self.z2_temp: float = 19.2
        self.z2_hum: float = 48.0
        self.z2_ac: int = 0
        self.z2_hum_p: int = 0
        self.target_z2_temp: float = 19.0
        self.target_z2_hum: float = 48.0

        # Зона 3: Склад муки
        self.z3_temp: float = 21.0
        self.z3_hum: float = 42.0
        self.z3_dehum: int = 0
        self.target_z3_hum: float = 48.0

        # Управление освещением зон (0..100%, контур ЩО-1)
        self.light_z1: int = 100
        self.light_z2: int = 100
        self.light_z3: int = 100

        # Стресс-события
        self.oven_open: bool = False
        self.bay_door_open: bool = False
        self.night_mode: bool = False
        self.mode: str = "auto"

        # Фильтры задержки (Time Delay) для зоны 2 (шоколад)
        self.z2_temp_delay: int = 0
        self.z2_hum_delay: int = 0

        # Статистика
        self.packets_rx: int = 0
        self.packets_tx: int = 0
        self.start_time: float = datetime.datetime.now().timestamp()

        # История для графиков (зона 2 - шоколад)
        self.history: list = []

        # Журнал событий
        self.events: list = [
            {"time": datetime.datetime.now().strftime("%H:%M:%S"), "level": "SYS", "msg": "PLANT INITIALIZED: 3-Zone Architecture online on RS-485 bus"},
            {"time": datetime.datetime.now().strftime("%H:%M:%S"), "level": "COMM", "msg": "MODBUS TCP Polling: Zone1(HR:0..3), Zone2(HR:10..13), Zone3(HR:20..23), Lighting(HR:30..32)"}
        ]

    def log_event(self, level: str, msg: str):
        now_str = datetime.datetime.now().strftime("%H:%M:%S")
        self.events.insert(0, {"time": now_str, "level": level, "msg": msg})
        if len(self.events) > 30:
            self.events.pop()

state = PlantState()

class SetpointsRequest(BaseModel):
    zone: str
    target_temp: Optional[float] = None
    target_hum: Optional[float] = None

class LightRequest(BaseModel):
    zone: str
    level: int

async def controller_background_loop():
    client = AsyncModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT)
    print("[BMS CONTROLLER] Подключение к шине Modbus 127.0.0.1:5020 (3 зоны)...")

    while True:
        try:
            if not client.connected:
                await client.connect()

            if client.connected:
                # 1. Читаем все 24 регистра цеха одним запросом
                resp = await client.read_holding_registers(address=0, count=24, device_id=DEVICE_ID)
                state.packets_rx += 1

                if not resp.isError():
                    regs = resp.registers
                    # Зона 1: Печи (0..1)
                    state.z1_temp = round(regs[0] / 10.0, 1)
                    state.z1_hum = round(regs[1] / 10.0, 1)

                    # Зона 2: Шоколад (10..11)
                    state.z2_temp = round(regs[10] / 10.0, 1)
                    state.z2_hum = round(regs[11] / 10.0, 1)

                    # Зона 3: Склад (20..21)
                    state.z3_temp = round(regs[20] / 10.0, 1)
                    state.z3_hum = round(regs[21] / 10.0, 1)

                    # 2. Логика автоматического регулирования 3-х зон
                    if state.mode == "auto":
                        RAMP = 5

                        # --- УПРАВЛЕНИЕ ЗОНОЙ 1: ПЕЧИ (Приток/Вытяжка) ---
                        if state.z1_temp > state.target_z1_temp + 1.0:
                            # Жарко: разгоняем вытяжной зонт
                            target_fan = min(100, int((state.z1_temp - state.target_z1_temp) * 20) + 40)
                            state.z1_fan = min(target_fan, state.z1_fan + RAMP)
                        elif state.z1_temp <= state.target_z1_temp:
                            min_fan = 15 if state.night_mode else 30
                            state.z1_fan = max(min_fan, state.z1_fan - RAMP)

                        # --- УПРАВЛЕНИЕ ЗОНОЙ 2: ШОКОЛАД (Прецизионный чиллер + Увлажнитель) ---
                        DEADBAND_T = 0.35
                        diff_t = state.z2_temp - state.target_z2_temp

                        if diff_t > DEADBAND_T:
                            state.z2_temp_delay += 1
                            if state.z2_temp_delay >= 4:
                                target_ac = min(100, int((diff_t - DEADBAND_T) * 45) + 25)
                                if state.z2_ac < target_ac:
                                    old_ac = state.z2_ac
                                    state.z2_ac = min(target_ac, state.z2_ac + RAMP)
                                    if old_ac == 0:
                                        state.log_event("CMD", f"ZONE 2 [CHOCOLATE]: Heat detected ({state.z2_temp}C). Chiller ramp to {state.z2_ac}%")
                                elif state.z2_ac > target_ac:
                                    state.z2_ac = max(target_ac, state.z2_ac - RAMP)
                        else:
                            state.z2_temp_delay = 0
                            if state.z2_ac > 0:
                                state.z2_ac = max(0, state.z2_ac - RAMP)
                                if state.z2_ac == 0:
                                    state.log_event("CMD", f"ZONE 2 [CHOCOLATE]: Nominal {state.z2_temp}C reached. Chiller stopped.")

                        # Влажность зоны 2
                        diff_h = state.target_z2_hum - state.z2_hum
                        if diff_h > 2.5:
                            state.z2_hum_delay += 1
                            if state.z2_hum_delay >= 4:
                                target_hum = min(100, int((diff_h - 2.5) * 10) + 25)
                                if state.z2_hum_p < target_hum:
                                    state.z2_hum_p = min(target_hum, state.z2_hum_p + RAMP)
                        else:
                            state.z2_hum_delay = 0
                            if state.z2_hum_p > 0:
                                state.z2_hum_p = max(0, state.z2_hum_p - RAMP)

                        # --- УПРАВЛЕНИЕ ЗОНОЙ 3: СКЛАД МУКИ (Осушитель) ---
                        if state.z3_hum > state.target_z3_hum + 2.0:
                            # Влажность на складе растет: форсируем осушение
                            target_dehum = min(100, int((state.z3_hum - state.target_z3_hum) * 5) + 40)
                            if state.z3_dehum < target_dehum:
                                old_dh = state.z3_dehum
                                state.z3_dehum = min(target_dehum, state.z3_dehum + RAMP)
                                if old_dh == 0:
                                    state.log_event("WARN", f"ZONE 3 [STORAGE]: Humidity spike ({state.z3_hum}%). Dehumidifier engaged ({state.z3_dehum}%)")
                        else:
                            if state.z3_dehum > 0:
                                state.z3_dehum = max(0, state.z3_dehum - RAMP)
                                if state.z3_dehum == 0:
                                    state.log_event("CMD", f"ZONE 3 [STORAGE]: Humidity nominal ({state.z3_hum}%). Dehumidifier off.")

                    else:
                        # Традиционный режим без автоматики BMS:
                        state.z1_fan = 30  # слабая фиксированная вытяжка (не компенсирует печь)
                        state.z2_ac = 20   # слабый холод, недостаточный при тепловом ударе
                        state.z3_dehum = 0 # осушитель выключен
                        if state.night_mode:
                            state.light_z1 = state.light_z2 = state.light_z3 = 100 # свет горит ночью

                    # Отправка управляющих сигналов в Modbus-регистры оборудования
                    await client.write_registers(address=2, values=[state.z1_fan, 1 if state.oven_open else 0], device_id=DEVICE_ID)
                    await client.write_registers(address=12, values=[state.z2_ac, state.z2_hum_p], device_id=DEVICE_ID)
                    await client.write_registers(address=22, values=[state.z3_dehum, 1 if state.bay_door_open else 0], device_id=DEVICE_ID)
                    await client.write_registers(address=30, values=[state.light_z1, state.light_z2, state.light_z3], device_id=DEVICE_ID)
                    state.packets_tx += 4

                    # Расчет текущей энергоэффективности и экономии
                    state.energy = energy_auditor.calculate(
                        z1_fan=state.z1_fan,
                        z2_ac=state.z2_ac,
                        z3_dehum=state.z3_dehum,
                        light_z1=state.light_z1,
                        light_z2=state.light_z2,
                        light_z3=state.light_z3,
                        night_mode=state.night_mode,
                        bms_active=(state.mode == "auto")
                    )

                    # Сохраняем историю для графиков и в базу данных SQLite
                    now_str = datetime.datetime.now().strftime("%H:%M:%S")
                    state.history.append({"time": now_str, "z1_temp": state.z1_temp, "z2_temp": state.z2_temp, "z2_hum": state.z2_hum, "z3_hum": state.z3_hum, "z2_ac": state.z2_ac})
                    if len(state.history) > 40:
                        state.history.pop(0)
                    telemetry_db.save_state(state)

        except Exception as e:
            pass

        await asyncio.sleep(1.0)

@app.on_event("startup")
async def startup_event():
    telemetry_db.init_db()
    asyncio.create_task(controller_background_loop())

@app.get("/api/status")
async def get_status():
    uptime = int(datetime.datetime.now().timestamp() - state.start_time)
    return {
        "uptime": uptime,
        "packets_rx": state.packets_rx,
        "packets_tx": state.packets_tx,
        "mode": state.mode,
        "night_mode": state.night_mode,
        "oven_open": state.oven_open,
        "bay_door_open": state.bay_door_open,
        "zones": {
            "bakery": {
                "name": "Зона 1: Горячий цех выпечки",
                "tag": "ZONE-01: BAKERY",
                "temp": state.z1_temp,
                "hum": state.z1_hum,
                "fan": state.z1_fan,
                "target_temp": state.target_z1_temp,
                "status": "ВЫЕМКА БИСКВИТОВ" if state.oven_open else "РАБОТА ПЕЧЕЙ"
            },
            "glazing": {
                "name": "Зона 2: Холодный цех глазировки (Шоколад)",
                "tag": "ZONE-02: GLAZING",
                "temp": state.z2_temp,
                "hum": state.z2_hum,
                "ac": state.z2_ac,
                "hum_p": state.z2_hum_p,
                "target_temp": state.target_z2_temp,
                "target_hum": state.target_z2_hum,
                "status": ("HACCP НОРМА" if abs(state.z2_temp - state.target_z2_temp) <= 0.4 else "КОРРЕКЦИЯ КЛИМАТА") if state.mode == "auto" else ("КРИТИЧЕСКИЙ БРАК: ШОКОЛАД РАСТАЯЛ" if state.z2_temp > 20.2 else "БЕЗ АВТОМАТИКИ (НЕСТАБИЛЬНО)")
            },
            "storage": {
                "name": "Зона 3: Склад муки и сырья",
                "tag": "ZONE-03: STORAGE",
                "temp": state.z3_temp,
                "hum": state.z3_hum,
                "dehum": state.z3_dehum,
                "target_hum": state.target_z3_hum,
                "status": "РАЗГРУЗКА ФУРЫ" if state.bay_door_open else "НОРМА ВЛАЖНОСТИ"
            }
        },
        "lighting": {
            "bakery": state.light_z1,
            "glazing": state.light_z2,
            "storage": state.light_z3
        },
        "events": state.events,
        "history": state.history,
        "energy": state.energy,
        "haccp_summary": telemetry_db.get_summary(hours=24)
    }

# Стресс-тест 1: Открытие/закрытие печи
@app.post("/api/trigger/oven")
async def trigger_oven():
    state.oven_open = not state.oven_open
    state.log_event("STRESS" if state.oven_open else "INFO", f"EVENT: Baking oven door {'OPEN (+5C heat blast)' if state.oven_open else 'closed'}")
    return {"oven_open": state.oven_open}

# Стресс-тест 2: Открытие/закрытие ворот разгрузки
@app.post("/api/trigger/bay")
async def trigger_bay():
    state.bay_door_open = not state.bay_door_open
    state.log_event("STRESS" if state.bay_door_open else "INFO", f"EVENT: Loading bay doors {'OPEN (+25% humidity rush)' if state.bay_door_open else 'closed'}")
    return {"bay_door_open": state.bay_door_open}

# Стресс-тест 3: Переключение день / ночная смена (энергосбережение)
@app.post("/api/trigger/night")
async def trigger_night():
    state.night_mode = not state.night_mode
    if state.night_mode:
        state.target_z1_temp, state.target_z2_temp = 20.0, 23.5
        state.oven_open, state.z1_fan = False, 15
        state.light_z1, state.light_z2, state.light_z3 = 20, 25, 30
        state.log_event("OPERATOR", "СМЕНА: НОЧНОЙ РЕЖИМ (Печи отключены, ночной обход, холод CC-301 непрерывен)")
    else:
        state.target_z1_temp, state.target_z2_temp = 26.0, 19.0
        state.light_z1 = state.light_z2 = state.light_z3 = 100
        state.log_event("OPERATOR", "СМЕНА: ДНЕВНОЙ РЕЖИМ (Печи включены, персонал на постах, 100% освещение цеха)")
    return {
        "night_mode": state.night_mode,
        "target_z1_temp": state.target_z1_temp,
        "target_z2_temp": state.target_z2_temp,
        "oven_open": state.oven_open,
        "lighting": {"bakery": state.light_z1, "glazing": state.light_z2, "storage": state.light_z3}
    }

# Стресс-тест 4: Переключение режима BMS автоматики
@app.post("/api/trigger/automation")
async def trigger_automation():
    state.mode = "manual" if state.mode == "auto" else "auto"
    msg = "BMS АВТОМАТИКА ВКЛЮЧЕНА (ПИД-оптимизация)" if state.mode == "auto" else "ВНИМАНИЕ: АВТОМАТИКА ОТКЛЮЧЕНА (РУЧНОЙ РЕЖИМ СТАРОГО ЦЕХА)"
    state.log_event("SYS" if state.mode == "auto" else "WARN", msg)
    return {"mode": state.mode}

# Управление освещением цеха (щит ЩО-1)
@app.post("/api/trigger/light")
async def trigger_light(data: LightRequest):
    level = max(0, min(100, data.level))
    if data.zone == "all":
        state.light_z1 = state.light_z2 = state.light_z3 = level
    elif hasattr(state, f"light_{data.zone}"):
        setattr(state, f"light_{data.zone}", level)
    state.log_event("OPERATOR", f"LIGHTING ADJUSTED: {data.zone.upper()} set to {level}%")
    return {"status": "ok", "lighting": {"bakery": state.light_z1, "glazing": state.light_z2, "storage": state.light_z3}}

@app.post("/api/setpoints")
async def set_setpoints(data: SetpointsRequest):
    if data.zone == "glazing":
        if data.target_temp is not None:
            state.target_z2_temp = round(data.target_temp, 1)
        if data.target_hum is not None:
            state.target_z2_hum = round(data.target_hum, 1)
        state.log_event("OPERATOR", f"ZONE 2 SETPOINT: SP_T={state.target_z2_temp}C, SP_H={state.target_z2_hum}%")
    elif data.zone == "bakery":
        if data.target_temp is not None:
            state.target_z1_temp = round(data.target_temp, 1)
        state.log_event("OPERATOR", f"ZONE 1 SETPOINT: SP_T={state.target_z1_temp}C")
    return {"status": "ok"}

@app.get("/", response_class=HTMLResponse)
async def get_index():
    html_file = Path(__file__).parent / "static" / "index.html"
    if html_file.exists():
        return html_file.read_text(encoding="utf-8")
    return "<h1>BMS Plant Controller</h1>"
