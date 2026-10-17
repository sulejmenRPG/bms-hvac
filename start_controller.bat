@echo off
chcp 65001 > nul
title Контроллер BMS (Edge Reader)
echo Запуск контроллера BMS...
".venv\Scripts\python.exe" simulator\controller_reader.py
pause
