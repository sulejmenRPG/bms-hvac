"""
Главный запускающий скрипт:
1. Запускает виртуальный климатический цех (Modbus TCP на 127.0.0.1:5020).
2. Запускает BMS Web Сервер с автоматикой на http://127.0.0.1:8000.
3. Автоматически открывает панель управления в браузере.
"""

import asyncio
from pathlib import Path
import sys
import webbrowser
import uvicorn

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Добавляем корень проекта в путь поиска модулей
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from simulator.climate_room import start_climate_room
from web.server import app

async def main():
    print("=" * 65)
    print("[BMS HVAC PLATFORM] Запуск комплексной системы автоматизации...")
    print("   1. Modbus TCP Сервер (Датчики и Климатический цех): порт 5020")
    print("   2. Контроллер и Веб-пульт оператора: http://127.0.0.1:8000")
    print("=" * 65 + "\n")

    stop_event = asyncio.Event()

    # 1. Запуск Modbus симулятора цеха
    room_task = asyncio.create_task(start_climate_room(stop_event))
    await asyncio.sleep(1.0)

    # 2. Настройка Uvicorn веб-сервера
    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",
        port=8000,
        log_level="warning"
    )
    server = uvicorn.Server(config)

    # 3. Открываем браузер через секунду после запуска
    async def open_browser():
        await asyncio.sleep(1.5)
        print("[BMS] Веб-панель оператора доступна: http://127.0.0.1:8000")
        webbrowser.open("http://127.0.0.1:8000")

    asyncio.create_task(open_browser())

    try:
        await server.serve()
    finally:
        stop_event.set()
        await room_task
        print("\n[BMS] Система BMS остановлена.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[BMS] Завершение работы по команде пользователя.")
