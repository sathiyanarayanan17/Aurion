@echo off
REM Aurion - Demo Fault Injection Script
REM Triggers a degradation scenario on a specific charger for live demo

echo ============================================
echo    AURION - Live Fault Injection Demo
echo ============================================
echo.

set /p SCENARIO="Select scenario (1=thermal_runaway, 2=connector_degradation, 3=power_instability, 4=firmware_crash): "

if "%SCENARIO%"=="1" set FAULT_TYPE=thermal_runaway
if "%SCENARIO%"=="2" set FAULT_TYPE=connector_degradation
if "%SCENARIO%"=="3" set FAULT_TYPE=power_instability
if "%SCENARIO%"=="4" set FAULT_TYPE=firmware_crash

echo.
echo Injecting %FAULT_TYPE% fault...
echo Watch the dashboard for health score degradation!
echo.

python -c "import paho.mqtt.publish as publish; import json; publish.single('aurion/commands/inject_fault', json.dumps({'charger_id': 'AUR-MUM-001', 'fault_type': '%FAULT_TYPE%'}), hostname='localhost', port=1883)"

echo.
echo Fault injected! Monitor the dashboard at http://localhost:3000
pause
