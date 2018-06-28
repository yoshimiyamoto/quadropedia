if not "%minimized%"=="" goto :minimized
set minimized=true
@echo off

start /min cmd /C "%~dp0\node server.js"
goto :EOF
:minimized
