@echo off
setlocal enabledelayedexpansion
title LogQL System Launcher
echo ======================================================================
echo           LogQL - Compiler-Based Log Query and Optimization
echo ======================================================================
echo.

:: 1. Check Python installation
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

:: 2. Check Node.js installation
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js / npm is not found in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

:: 3. Safely free up ports 3000 and 8000 (Targeting ONLY LogQL ports, never system or IDE processes)
echo [1/3] Clearing any stale processes on ports 3000 and 8000...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 4. Verify C++ Compiler Binary
if not exist "%~dp0compiler\build\logql_cli.exe" (
    echo [WARNING] Native compiler binary not found at compiler\build\logql_cli.exe
    echo Building C++ compiler core with CMake...
    if not exist "%~dp0compiler\build" mkdir "%~dp0compiler\build"
    cmake -S "%~dp0compiler" -B "%~dp0compiler\build" -G "MinGW Makefiles"
    cmake --build "%~dp0compiler\build"
    if not exist "%~dp0compiler\build\logql_cli.exe" (
        echo [ERROR] Failed to compile C++ binary. Ensure MinGW-w64 / GCC is in PATH.
    ) else (
        echo [OK] C++ compiler binary compiled successfully.
    )
) else (
    echo [OK] C++ Compiler Core Binary detected.
)

:: 5. Start Backend and Frontend
echo.
echo [2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "LogQL Backend Service [Port 8000]" /D "%~dp0" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Starting Next.js Studio on http://localhost:3000 (Turbopack) ...
start "LogQL Frontend Workbench [Port 3000]" /D "%~dp0frontend" cmd /k "npm run dev"

:: 6. Fast Health Check (Opens browser as soon as the dev server responds)
echo.
echo Waiting for LogQL Studio to be ready...
set /a ATTEMPTS=0
:WAIT_LOOP
set /a ATTEMPTS+=1
ping 127.0.0.1 -n 2 >nul
curl.exe -s -o nul -I http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% EQU 0 goto READY
if %ATTEMPTS% GEQ 15 goto TIMEOUT_OPEN
goto WAIT_LOOP

:READY
echo [OK] LogQL Studio is ready!
goto OPEN_BROWSER

:TIMEOUT_OPEN
echo [INFO] Opening browser now...

:OPEN_BROWSER
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000

echo.
echo ======================================================================
echo LogQL services are running in background console windows!
echo - Frontend Studio: http://localhost:3000
echo - Backend API and Docs: http://127.0.0.1:8000/docs
echo ======================================================================
echo Press any key to exit this launcher window (services will stay running).
pause >nul
