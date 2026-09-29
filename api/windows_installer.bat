@echo off
SET VENV_DIR=venv

REM Check if env folder exists
IF EXIST "%VENV_DIR%\Scripts\python.exe" (
    echo Virtual environment already exists.
) ELSE (
    echo Creating virtual environment...
    call python3_12.bat -m venv %VENV_DIR%
)

echo Activating virtual environment...
call %VENV_DIR%\Scripts\activate

echo Installing project in editable mode...
pip install -e ./

echo Running tests...
pytest

pause