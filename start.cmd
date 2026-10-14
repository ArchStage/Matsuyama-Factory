@echo off
setlocal
cd /d "%~dp0"
set "TASK_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "TASK_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not "%TASK_NODE%"=="node" if not exist "%TASK_NODE%" (
  echo Node.js 22 or newer is required.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:5173/"
"%TASK_NODE%" server.mjs
pause
