@echo off
title Aurion - EV Charger Health Platform
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║          AURION - Standalone Demo Mode           ║
echo  ║   Predictive EV Charger Health Platform         ║
echo  ╠══════════════════════════════════════════════════╣
echo  ║  API Server:  http://localhost:8000              ║
echo  ║  API Docs:    http://localhost:8000/docs         ║
echo  ║  Dashboard:   http://localhost:3000              ║
echo  ║                                                  ║
echo  ║  Press Ctrl+C to stop                           ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo Starting Aurion backend...
echo.
start "Aurion Dashboard" cmd /c "cd dashboard && npm run dev"
python run_standalone.py
