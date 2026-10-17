"""
Демо-запуск: одновременно запускает виртуальный датчик и контроллер в одном окне
на 12 секунд, наглядно показывая обмен данными через Modbus TCP.
"""

import asyncio
import sys

from pathlib import Path

# Обеспечиваем корректный вывод UTF-8 в Windows-консоли
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Добавляем корень проекта в пути поиска модулей
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from simulator.virtual_sensor import start_sensor
from simulator.controller_reader import start_controller

async def main():
    print("🚀 [ДЕМО-РЕЖИМ] Запускаем виртуальный климатический стенд (на 12 секунд)...\n")
    stop_event = asyncio.Event()

    # Запускаем датчик
    sensor_task = asyncio.create_task(start_sensor(stop_event))
    await asyncio.sleep(1.0)  # Даем серверу 1 секунду на открытие порта

    # Запускаем контроллер
    controller_task = asyncio.create_task(start_controller(stop_event))

    # Ждем 12 секунд демонстрации
    await asyncio.sleep(12.0)

    print("\n⏳ Демо-время истекло. Останавливаем устройства...")
    stop_event.set()

    await asyncio.gather(sensor_task, controller_task, return_exceptions=True)
    print("✅ Все компоненты успешно остановлены!\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Демо остановлено пользователем.")
