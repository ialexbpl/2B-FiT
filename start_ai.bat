@echo off
echo Uruchamianie serwera AI...
echo Aby zatrzymac, nacisnij Ctrl+C
cd /d "%~dp0"
python -m uvicorn ai.api:app --host 0.0.0.0 --port 8000 --reload
pause
