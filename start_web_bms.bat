@echo off
chcp 65001 > nul
title BMS HVAC Controller Platform (Web + Modbus)
echo ========================================================
echo   Запуск платформы управления климатом цеха (BMS)
echo   Веб-интерфейс откроется в браузере автоматически...
echo ========================================================
".venv\Scripts\python.exe" run_bms.py
pause
