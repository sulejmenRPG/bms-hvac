@echo off
chcp 65001 > nul
title Виртуальный датчик Modbus (Цех 1)
echo Запуск виртуального датчика...
".venv\Scripts\python.exe" simulator\virtual_sensor.py
pause
