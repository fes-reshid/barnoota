@echo off
rem Builds both programs on a Windows PC that has Python 3.10+ installed:
rem   dist\NoorCleaner.exe and dist\NoorGuard.exe (plus the *-Setup.exe installers if Inno Setup 6 is installed)
cd /d "%~dp0"
python -m pip install --upgrade pyinstaller pillow pystray || goto :error
python -m unittest discover -s tests || goto :error
for %%P in (NoorCleaner:noor_cleaner.py:cleaner NoorGuard:noor_guard.py:guard) do call :build %%P || goto :error
echo.
echo Done: %~dp0dist
pause
exit /b 0

:build
for /f "tokens=1-3 delims=:" %%A in ("%~1") do (set NAME=%%A& set ENTRY=%%B& set KEY=%%C)
python -m PyInstaller --noconfirm --onefile --windowed --name %NAME% --hidden-import pystray._win32 --icon assets\icon.ico --add-data "signatures.txt;." --add-data "assets\icon.ico;assets" --add-data "locales;locales" %ENTRY% || exit /b 1
set ISCC="%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if exist %ISCC% (
  for /f %%V in ('python -c "import ui_base; print(ui_base.VERSION)"') do set VERSION=%%V
  %ISCC% /DAppKey=%KEY% /DAppVersion=%VERSION% installer\NoorApp.iss || exit /b 1
) else (
  echo To also build the installers, install Inno Setup 6 from jrsoftware.org and run this again.
)
exit /b 0

:error
echo Build failed.
pause
exit /b 1
