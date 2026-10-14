@echo off
title LogQL System Shutdown
echo ======================================================================
echo           Shutting down LogQL Services (Ports 3000 and 8000)
echo ======================================================================
echo.

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo [OK] All LogQL services on ports 3000 and 8000 have been stopped.
ping 127.0.0.1 -n 2 >nul
