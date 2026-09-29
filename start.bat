@echo off
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

:: 3. Check C++ Compiler Binary
if not exist "compiler\build\logql_cli.exe" (
    echo [WARNING] Native compiler binary not found at compiler\build\logql_cli.exe
    echo Attempting to build C++ compiler core with CMake...
    if exist "compiler\build" (
        cmake --build compiler\build
    ) else (
        mkdir compiler\build
        cmake -S compiler -B compiler\build -G "MinGW Makefiles"
        cmake --build compiler\build
    )
    if not exist "compiler\build\logql_cli.exe" (
        echo [ERROR] Failed to compile C++ binary. Ensure MinGW-w64 / GCC is in PATH.
    ) else (
        echo [OK] C++ compiler binary compiled successfully.
    )
) else (
    echo [OK] C++ Compiler Core Binary detected.
)

echo.
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "LogQL Backend Service [Port 8000]" cmd /k "python -m uvicorn backend.app.main:app --port 8000 --reload"

echo [2/2] Starting Next.js Frontend Studio on http://localhost:3000 ...
start "LogQL Frontend Workbench [Port 3000]" cmd /k "cd frontend && npm run dev"

echo.
echo Waiting 4 seconds for services to boot...
timeout /t 4 /nobreak >nul

echo Opening LogQL Compiler Workbench in your browser...
start http://localhost:3000

echo.
echo ======================================================================
echo LogQL services are running in background console windows!
echo - Frontend Workbench: http://localhost:3000
echo - Backend API & Docs: http://localhost:8000/docs
echo ======================================================================
echo Press any key to exit this launcher window (services will stay running).
pause >nul
