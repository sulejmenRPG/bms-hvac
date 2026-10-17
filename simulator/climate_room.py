"""
Физическая модель кондитерского цеха на 3 технологические зоны (Modbus TCP).
Зона 1: Горячий цех выпечки (Печи) - регистры 0..3
Зона 2: Холодный цех глазировки (Шоколад) - регистры 10..13
Зона 3: Склад муки и разгрузка (Сырье) - регистры 20..23

Поддерживает межзональный теплообмен и события стресс-тестов:
- Открытие жарочной печи (тепловой удар в зоне 1, переходящий в зону 2)
- Открытие ворот разгрузки (скачок влажности на складе)
"""

import asyncio
import logging
import random
import sys
from pymodbus.simulator import SimData, SimDevice, DataType
from pymodbus.server import ModbusTcpServer

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logging.getLogger("pymodbus").setLevel(logging.WARNING)

HOST = "127.0.0.1"
PORT = 5020
DEVICE_ID = 1

class ConfectioneryPlantPhysics:
    def __init__(self):
        # Зона 1: Печи и выпечка (базовая жара)
        self.z1_temp = 26.2
        self.z1_hum = 36.0
        self.oven_open = False  # Флаг: открыта ли жарочная печь

        # Зона 2: Глазировка шоколада (требует строго 18.5..19.5 °C)
        self.z2_temp = 19.2
        self.z2_hum = 48.0

        # Зона 3: Склад сырья (требует влажность < 50%)
        self.z3_temp = 21.0
        self.z3_hum = 42.0
        self.bay_door_open = False  # Флаг: открыты ли ворота разгрузки на улицу

    def step(self, z1_fan: int, z2_ac: int, z2_hum_p: int, z3_dehum: int):
        # ─────────────────────────────────────────────────────────────
        # 1. ЗОНА 1: Горячий цех выпечки
        # ─────────────────────────────────────────────────────────────
        # Базовый нагрев от печей
        self.z1_temp += 0.03
        if self.oven_open:
            # Открыта жарочная печь: мощный приток тепла до 32-34 °C
            if self.z1_temp < 33.5:
                self.z1_temp += 0.35
            self.z1_hum -= 0.15
        else:
            # Печи выключены / дежурное остывание в ночную смену
            if self.z1_temp > 20.5:
                self.z1_temp -= 0.04

        # Вытяжка и приточная вентиляция зоны 1
        if z1_fan > 0:
            cool_rate = (z1_fan / 100.0) * 0.18
            self.z1_temp -= cool_rate

        self.z1_temp = max(19.5, min(36.0, self.z1_temp + random.uniform(-0.02, 0.02)))
        self.z1_hum = max(20.0, min(60.0, self.z1_hum + random.uniform(-0.04, 0.04)))

        # ─────────────────────────────────────────────────────────────
        # 2. ЗОНА 2: Холодный цех глазировки (Шоколад)
        # ─────────────────────────────────────────────────────────────
        # Теплопередача через смежную стену из горячего цеха!
        wall_heat_leak = max(0.0, (self.z1_temp - self.z2_temp) * 0.015)
        self.z2_temp += wall_heat_leak + 0.02

        # Охлаждение прецизионным чиллером зоны 2
        if z2_ac > 0:
            chiller_rate = (z2_ac / 100.0) * 0.24
            self.z2_temp -= chiller_rate

        # Увлажнение шоколадного цеха
        if z2_hum_p > 0:
            hum_rate = (z2_hum_p / 100.0) * 0.38
            self.z2_hum += hum_rate
        else:
            self.z2_hum -= 0.05  # естественное подсыхание

        self.z2_temp = max(15.0, min(28.0, self.z2_temp + random.uniform(-0.02, 0.02)))
        self.z2_hum = max(30.0, min(70.0, self.z2_hum + random.uniform(-0.04, 0.04)))

        # ─────────────────────────────────────────────────────────────
        # 3. ЗОНА 3: Склад сырья и муки
        # ─────────────────────────────────────────────────────────────
        if self.bay_door_open:
            # Открыты ворота: с улицы врывается влажность до 72%
            if self.z3_hum < 72.0:
                self.z3_hum += 0.8
        else:
            # Медленное возвращение к сухому складу
            if self.z3_hum > 42.0:
                self.z3_hum -= 0.05

        # Осушитель воздуха на складе
        if z3_dehum > 0:
            dry_rate = (z3_dehum / 100.0) * 0.45
            self.z3_hum -= dry_rate

        self.z3_temp = max(16.0, min(30.0, self.z3_temp + random.uniform(-0.02, 0.02)))
        self.z3_hum = max(25.0, min(80.0, self.z3_hum + random.uniform(-0.05, 0.05)))

async def physics_loop(server: ModbusTcpServer, plant: ConfectioneryPlantPhysics):
    print("=" * 65)
    print("[BMS PLANT SIMULATOR] Кондитерский цех (3 зоны) активен")
    print("   Шина Modbus TCP 127.0.0.1:5020 | ID: 1")
    print("=" * 65)

    while True:
        await asyncio.sleep(1.0)

        # 1. Читаем управляющие регистры приводов
        # Зона 1: Вытяжной вентилятор (HR:2), статус печи (HR:3)
        z1_regs = await server.async_getValues(device_id=DEVICE_ID, func_code=3, address=2, count=2)
        z1_fan, oven_cmd = z1_regs
        plant.oven_open = (oven_cmd == 1)

        # Зона 2: Чиллер (HR:12), Увлажнитель (HR:13)
        z2_regs = await server.async_getValues(device_id=DEVICE_ID, func_code=3, address=12, count=2)
        z2_ac, z2_hum_p = z2_regs

        # Зона 3: Осушитель (HR:22), статус ворот (HR:23)
        z3_regs = await server.async_getValues(device_id=DEVICE_ID, func_code=3, address=22, count=2)
        z3_dehum, bay_cmd = z3_regs
        plant.bay_door_open = (bay_cmd == 1)

        # 2. Моделируем шаг физики
        plant.step(z1_fan, z2_ac, z2_hum_p, z3_dehum)

        # 3. Записываем обновленные показания сенсоров в шину Modbus:
        # Зона 1 (HR:0, HR:1)
        await server.async_setValues(
            device_id=DEVICE_ID,
            func_code=3,
            address=0,
            values=[int(round(plant.z1_temp * 10)), int(round(plant.z1_hum * 10))]
        )
        # Зона 2 (HR:10, HR:11)
        await server.async_setValues(
            device_id=DEVICE_ID,
            func_code=3,
            address=10,
            values=[int(round(plant.z2_temp * 10)), int(round(plant.z2_hum * 10))]
        )
        # Зона 3 (HR:20, HR:21)
        await server.async_setValues(
            device_id=DEVICE_ID,
            func_code=3,
            address=20,
            values=[int(round(plant.z3_temp * 10)), int(round(plant.z3_hum * 10))]
        )

async def start_climate_room(stop_event: asyncio.Event = None):
    plant = ConfectioneryPlantPhysics()

    # Инициализация 35 регистров Modbus
    # 0..3: Зона 1 (Temp, Hum, Fan, OvenState)
    # 10..13: Зона 2 (Temp, Hum, AC, HumAct)
    # 20..23: Зона 3 (Temp, Hum, Dehum, BayState)
    # 30..32: Линии освещения (Зона 1, Зона 2, Зона 3 - 0..100%)
    init_values = [0] * 35
    init_values[0] = int(plant.z1_temp * 10)
    init_values[1] = int(plant.z1_hum * 10)
    init_values[2] = 40  # 40% fan
    init_values[3] = 0   # oven closed

    init_values[10] = int(plant.z2_temp * 10)
    init_values[11] = int(plant.z2_hum * 10)
    init_values[12] = 0  # ac off
    init_values[13] = 0  # hum off

    init_values[20] = int(plant.z3_temp * 10)
    init_values[21] = int(plant.z3_hum * 10)
    init_values[22] = 0  # dehum off
    init_values[23] = 0  # bay door closed

    init_values[30] = 100  # Зона 1: Рабочий свет 100%
    init_values[31] = 100  # Зона 2: Рабочий свет 100%
    init_values[32] = 100  # Зона 3: Рабочий свет 100%

    sim_data = SimData(
        address=0,
        count=35,
        values=init_values,
        datatype=DataType.REGISTERS
    )
    device = SimDevice(id=DEVICE_ID, simdata=sim_data)
    server = ModbusTcpServer(context=device, address=(HOST, PORT))

    server_task = asyncio.create_task(server.serve_forever())
    phys_task = asyncio.create_task(physics_loop(server, plant))

    if stop_event:
        await stop_event.wait()
        server_task.cancel()
        phys_task.cancel()
        await server.shutdown()
    else:
        await asyncio.gather(server_task, phys_task)

async def main():
    await start_climate_room()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[BMS] Модель пищевого цеха остановлена.")
