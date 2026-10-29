@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo       ErgoVision - AI Desk Ergonomics Guardian
echo ========================================================
echo Project Directory: %CD%

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH! Please ensure Python is installed.
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH! Please ensure Node.js is installed.
    pause
    exit /b 1
)

echo.
echo [1/2] Starting FastAPI Backend on Port 8000...
start "ErgoVision Backend" cmd /k "cd /d ""%~dp0backend"" && python -m uvicorn main:app --reload --port 8000"

echo [2/2] Starting Vite Frontend on Port 5173...
start "ErgoVision Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo ========================================================
echo Both services launched in separate windows!
echo - Frontend:  http://localhost:5173
echo - API Docs:  http://localhost:8000/docs
echo ========================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
