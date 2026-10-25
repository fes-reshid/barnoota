@echo off
rem Builds dist\NoorScanner.exe on a Windows PC that has Python 3.10+ installed.
cd /d "%~dp0"
python -m pip install --upgrade pyinstaller || goto :error
python -m unittest discover -s tests || goto :error
python -m PyInstaller --noconfirm --onefile --windowed --name NoorScanner --add-data "signatures.txt;." noor_scanner.py || goto :error
echo.
echo Done: %~dp0dist\NoorScanner.exe
pause
exit /b 0
:error
echo Build failed.
pause
exit /b 1
