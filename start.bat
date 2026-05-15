@echo off
title RetentionAI — Churn Prediction Dashboard
color 0B

echo.
echo  ==========================================
echo   RetentionAI - Churn Prediction Dashboard
echo  ==========================================
echo.

:: ── Step 1: Check Python ─────────────────────────────────────────────────────
echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Python is not installed or not in PATH.
    echo  Please install Python 3.9+ from https://python.org
    echo.
    pause
    exit /b 1
)
python --version
echo  Python found.
echo.

:: ── Step 2: Install dependencies ─────────────────────────────────────────────
echo [2/4] Installing required packages...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo.
    echo  ERROR: Failed to install packages. Check your internet connection.
    echo.
    pause
    exit /b 1
)
echo  Packages installed.
echo.

:: ── Step 3: Train model if not present ───────────────────────────────────────
echo [3/4] Checking model files...
if not exist model.pkl (
    echo  model.pkl not found. Training model now...
    python train_model.py
    if errorlevel 1 (
        echo.
        echo  ERROR: Model training failed. Check train_model.py and the CSV file.
        echo.
        pause
        exit /b 1
    )
    echo  Model trained and saved.
) else (
    echo  model.pkl already exists. Skipping training.
)
echo.

:: ── Step 4: Open browser and start server ────────────────────────────────────
echo [4/4] Starting Flask server...
echo.
echo  Dashboard will open at: http://127.0.0.1:5000
echo  Press Ctrl+C in this window to stop the server.
echo.

:: Open browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:5000"

:: Start Flask
python app.py

echo.
echo  Server stopped.
pause
