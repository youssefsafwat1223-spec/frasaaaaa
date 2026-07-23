@echo off
REM Tawafuq Demo — local launcher
REM Starts a static HTTP server on http://localhost:8765
cd /d "%~dp0"
echo.
echo  ============================================================
echo   Tawafuq Demo
echo   ----------------------------------------------------------
echo   Opening:  http://localhost:8765/
echo.
echo   Press Ctrl+C to stop the server.
echo  ============================================================
echo.
start "" "http://localhost:8765/"
py -3 -m http.server 8765 2>nul
if errorlevel 1 (
  python -m http.server 8765
)
