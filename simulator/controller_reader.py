"""
Контроллер-считыватель (BMS Controller Client).
Эмулирует логику контроллера Edge Box:
1. Подключается по Modbus TCP к датчикам цеха.
2. Считывает температуру, влажность и статус устройства.
3. Проверяет уставки (нормы микроклимата) и выводит красивый дашборд в консоль.
"""

import asyncio
import datetime
import logging
import sys

# Обеспечиваем корректный вывод UTF-8 в Windows-консоли
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from pymodbus.client import AsyncModbusTcpClient

# Отключаем отладочный шум библиотеки
logging.getLogger("pymodbus").setLevel(logging.WARNING)

SENSOR_HOST = "127.0.0.1"
SENSOR_PORT = 5020
DEVICE_ID = 1

# Желаемые уставки для производственного цеха
TEMP_MIN = 20.0
TEMP_MAX = 24.0
HUM_MIN = 40.0
HUM_MAX = 55.0

def evaluate_status(temp: float, hum: float, device_ok: bool) -> tuple[str, str]:
    """Оценивает климатические параметры и выдает рекомендацию для автоматики."""
    if not device_ok:
        return "⚠️ АВАРИЯ", "Сенсор сообщает о внутренней ошибке!"

    temp_advice = "в норме"
    if temp < TEMP_MIN:
        temp_advice = f"Холодно! Включить подогрев притока (+{TEMP_MIN - temp:.1f}°C)"
    elif temp > TEMP_MAX:
        temp_advice = f"Жарко! Включить чиллер/охлаждение (-{temp - TEMP_MAX:.1f}°C)"

    hum_advice = "в норме"
    if hum < HUM_MIN:
        hum_advice = f"Сухо! Запустить увлажнитель (+{HUM_MIN - hum:.1f}%)"
    elif hum > HUM_MAX:
        hum_advice = f"Влажно! Увеличить осушение/вентиляцию (-{hum - HUM_MAX:.1f}%)"

    overall_status = "✅ ОПТИМАЛЬНО"
    if temp_advice != "в норме" or hum_advice != "в норме":
        overall_status = "⚙️ ТРЕБУЕТСЯ КОРРЕКЦИЯ"

    advice_text = f"Темп.: {temp_advice} | Влажн.: {hum_advice}"
    return overall_status, advice_text

async def poll_sensor(client: AsyncModbusTcpClient):
    """Опрос датчика каждые 2 секунды."""
    print("=" * 65)
    print("🧠 [BMS CONTROLLER EDGE] Запущен модуль мониторинга климата")
    print(f"   Целевые уставки: Температура {TEMP_MIN}..{TEMP_MAX} °C | Влажность {HUM_MIN}..{HUM_MAX} %")
    print("=" * 65 + "\n")

    iteration = 0
    while True:
        iteration += 1
        now_str = datetime.datetime.now().strftime("%H:%M:%S")

        try:
            # Читаем 3 регистра начиная с адреса 0 (код функции 03 - Holding Registers)
            response = await client.read_holding_registers(address=0, count=3, device_id=DEVICE_ID)

            if response.isError():
                print(f"[{now_str}] ❌ Ошибка чтения регистров Modbus: {response}")
            else:
                raw_temp, raw_hum, raw_status = response.registers
                temp_c = raw_temp / 10.0
                hum_pct = raw_hum / 10.0
                sensor_ok = (raw_status == 1)

                status_label, action_advice = evaluate_status(temp_c, hum_pct, sensor_ok)

                print(f"┌─ [{now_str}] Срез #{iteration:03d} ───────────────────────────────────────")
                print(f"│ Датчик #1:  Температура: {temp_c:5.1f} °C  |  Влажность: {hum_pct:5.1f} %")
                print(f"│ Статус:     {status_label}")
                print(f"│ Аналитика:  {action_advice}")
                print(f"└────────────────────────────────────────────────────────────\n")

        except Exception as e:
            print(f"[{now_str}] ❌ Ошибка связи с датчиком ({SENSOR_HOST}:{SENSOR_PORT}): {e}")

        await asyncio.sleep(2.0)

async def start_controller(stop_event: asyncio.Event = None):
    client = AsyncModbusTcpClient(SENSOR_HOST, port=SENSOR_PORT)
    print(f"🔌 Подключение к шине датчиков ({SENSOR_HOST}:{SENSOR_PORT})...")

    connected = await client.connect()
    if not connected:
        print(f"❌ Не удалось подключиться к {SENSOR_HOST}:{SENSOR_PORT}!")
        print("👉 Убедитесь, что сначала запущен файл virtual_sensor.py")
        return

    print("✅ Соединение установлено. Начинаю считывание данных...\n")
    poll_task = asyncio.create_task(poll_sensor(client))

    if stop_event:
        await stop_event.wait()
        poll_task.cancel()
        client.close()
    else:
        await poll_task

async def main():
    await start_controller()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Контроллер остановлен пользователем.")
