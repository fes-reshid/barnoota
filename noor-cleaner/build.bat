@echo off
rem Builds dist\NoorCleaner.exe (and dist\NoorCleaner-Setup.exe if Inno Setup 6 is installed)
rem on a Windows PC that has Python 3.10+ installed.
cd /d "%~dp0"
python -m pip install --upgrade pyinstaller pillow || goto :error
python -m unittest discover -s tests || goto :error
python -m PyInstaller --noconfirm --onefile --windowed --name NoorCleaner --icon assets\icon.ico --add-data "signatures.txt;." --add-data "assets\icon.ico;assets" --add-data "locales;locales" noor_cleaner.py || goto :error
echo.
echo Done: %~dp0dist\NoorCleaner.exe
set ISCC="%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if exist %ISCC% (
  %ISCC% installer\NoorCleaner.iss || goto :error
  echo Installer: %~dp0dist\NoorCleaner-Setup.exe
) else (
  echo To also build the installer, install Inno Setup 6 from jrsoftware.org and run this again.
)
pause
exit /b 0
:error
echo Build failed.
pause
exit /b 1
