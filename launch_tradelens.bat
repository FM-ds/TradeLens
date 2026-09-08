@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "API_DIR=%ROOT%\api"
set "APP_DIR=%ROOT%\app"

if not exist "%API_DIR%\main.py" (
    echo [ERROR] Could not find API folder at "%API_DIR%".
    exit /b 1
)

if not exist "%APP_DIR%\package.json" (
    echo [ERROR] Could not find app folder at "%APP_DIR%".
    exit /b 1
)

set "ACTIVATE_SCRIPT="
for %%F in (
    "%API_DIR%\venv\Scripts\activate.bat"
    "%API_DIR%\trade_api_venv\Scripts\activate.bat"
    "%ROOT%\trade_api_venv\Scripts\activate.bat"
) do (
    if exist "%%~fF" (
        set "ACTIVATE_SCRIPT=%%~fF"
        goto :venv_found
    )
)

:venv_found
if not defined ACTIVATE_SCRIPT (
    echo [ERROR] Could not find a virtual environment activation script.
    echo Checked:
    echo   - %API_DIR%\venv\Scripts\activate.bat
    echo   - %API_DIR%\trade_api_venv\Scripts\activate.bat
    echo   - %ROOT%\trade_api_venv\Scripts\activate.bat
    exit /b 1
)

echo Starting API terminal...
start "TradeLens API" cmd /k "cd /d ""%API_DIR%"" && call ""%ACTIVATE_SCRIPT%"" && uvicorn main:app --reload"

echo Waiting for API to become reachable on http://127.0.0.1:8000/docs ...
set /a RETRIES=90

:wait_for_api
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/docs' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }"
if "%ERRORLEVEL%"=="0" goto :start_frontend

set /a RETRIES-=1
if %RETRIES% LEQ 0 (
    echo API did not become reachable in time. Starting frontend terminal anyway...
    goto :start_frontend
)

timeout /t 1 /nobreak >nul
goto :wait_for_api

:start_frontend
echo Starting frontend terminal...
start "TradeLens Frontend" cmd /k "cd /d ""%APP_DIR%"" && npm run dev"

echo All launch commands have been issued.
endlocal