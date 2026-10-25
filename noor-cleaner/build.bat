@echo off
rem Builds dist\NoorCleaner.exe on a Windows PC that has Python 3.10+ installed.
cd /d "%~dp0"
python -m pip install --upgrade pyinstaller || goto :error
python -m unittest discover -s tests || goto :error
python -m PyInstaller --noconfirm --onefile --windowed --name NoorCleaner --icon assets\icon.ico --add-data "signatures.txt;." --add-data "assets\icon.ico;assets" noor_cleaner.py || goto :error
echo.
echo Done: %~dp0dist\NoorCleaner.exe
pause
exit /b 0
:error
echo Build failed.
pause
exit /b 1
