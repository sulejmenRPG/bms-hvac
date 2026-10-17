"""
Виртуальный промышленный датчик температуры и влажности (Modbus TCP).
Имитирует работу реального сенсора климата в производственном цеху.

Используемые регистры (Holding Registers):
- Адрес 0: Температура (* 10, например 225 = 22.5 °C)
- Адрес 1: Влажность (* 10, например 480 = 48.0 %)
- Адрес 2: Статус устройства (1 = OK, 0 = Ошибка)
"""

import asyncio
import logging
import random
import sys

# Обеспечиваем корректный вывод UTF-8 в Windows-консоли
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from pymodbus.simulator import SimData, SimDevice, DataType
from pymodbus.server import ModbusTcpServer

# Отключаем избыточные системные логи pymodbus, чтобы консоль была чистой
logging.getLogger("pymodbus").setLevel(logging.WARNING)

HOST = "127.0.0.1"
PORT = 5020
DEVICE_ID = 1

async def climate_simulation_loop(server: ModbusTcpServer):
    """
    Фоновый цикл: имитирует естественные колебания микроклимата в цеху.
    """
    temperature = 22.5  # Базовая температура в градусах Цельсия
    humidity = 48.0     # Базовая относительная влажность в %

    print("\n" + "=" * 60)
    print("📡 [ВИРТУАЛЬНЫЙ ДАТЧИК ЦЕХА] Успешно запущен!")
    print(f"   Слушаю на адресе: {HOST}:{PORT} (ID устройства: {DEVICE_ID})")
    print("   Каждые 3 секунды генерируются реалистичные показания...")
    print("=" * 60 + "\n")

    while True:
        await asyncio.sleep(3.0)

        # Небольшие случайные колебания (±0.1-0.2 °C, ±0.2-0.4 %)
        temperature += random.uniform(-0.15, 0.15)
        humidity += random.uniform(-0.3, 0.3)

        # Удерживаем в разумных пределах
        temperature = max(18.0, min(28.0, temperature))
        humidity = max(35.0, min(65.0, humidity))

        # Переводим в целочисленный формат Modbus (умножаем на 10)
        temp_raw = int(round(temperature * 10))
        hum_raw = int(round(humidity * 10))
        status = 1  # 1 = Работа в норме

        # Записываем новые значения в регистры Modbus (адрес 0, 3 значения)
        await server.async_setValues(
            device_id=DEVICE_ID,
            func_code=3,
            address=0,
            values=[temp_raw, hum_raw, status]
        )

        print(f"⏱ [Датчик #1] Обновление -> Температура: {temperature:5.1f} °C | Влажность: {humidity:5.1f} % | Регистры: [{temp_raw}, {hum_raw}, {status}]")

async def start_sensor(stop_event: asyncio.Event = None):
    sensor_data = SimData(
        address=0,
        count=3,
        values=[225, 480, 1],
        datatype=DataType.REGISTERS
    )

    device = SimDevice(id=DEVICE_ID, simdata=sensor_data)
    server = ModbusTcpServer(context=device, address=(HOST, PORT))

    server_task = asyncio.create_task(server.serve_forever())
    sim_task = asyncio.create_task(climate_simulation_loop(server))

    if stop_event:
        await stop_event.wait()
        server_task.cancel()
        sim_task.cancel()
        await server.shutdown()
    else:
        await asyncio.gather(server_task, sim_task)

async def main():
    await start_sensor()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Виртуальный датчик остановлен пользователем.")
