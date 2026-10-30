; Installer for NoorCleaner and NoorGuard (Inno Setup 6). Build the program with PyInstaller first, then:
;   ISCC.exe /DAppKey=cleaner /DAppVersion=2.3.0 installer\NoorApp.iss      (NoorCleaner-Setup.exe)
;   ISCC.exe /DAppKey=guard   /DAppVersion=2.3.0 installer\NoorApp.iss      (NoorGuard-Setup.exe)
; The installer asks for the program's language (English / Arabic / Afaan Oromoo) and passes the
; choice to the program through %LOCALAPPDATA%\NoorCleaner\installer.txt (see settings.py).
; This file is UTF-8 with a byte order mark so the Arabic text survives.

#ifndef AppVersion
  #define AppVersion "2.3.0"
#endif
#ifndef AppKey
  #define AppKey "cleaner"
#endif

#if AppKey == "guard"
  #define AppName "NoorGuard"
  #define AppNameAr "نور جارد"
  #define AppGuid "{{4B59CE8E-8FB5-48C0-990A-0E8354D18EC5}"
#else
  #define AppName "NoorCleaner"
  #define AppNameAr "نور كلينر"
  #define AppGuid "{{6B0E8C1E-9C3A-4B4D-9A57-2E7C6D1F5A21}"
#endif

[Setup]
AppId={#AppGuid}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Diin Islaam
DefaultDirName={localappdata}\Programs\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
; Installs for the current user, so no administrator prompt is needed to install.
PrivilegesRequired=lowest
OutputDir=..\dist
OutputBaseFilename={#AppName}-Setup
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\{#AppName}.exe
UninstallDisplayName={#AppName}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"
#if AppKey == "guard"
Name: "tray"; Description: "Protect me in the background: start NoorGuard with Windows, in the tray (can be changed in Settings)"
#else
Name: "reminder"; Description: "Remind me every month when junk files build up (can be changed in Settings)"
#endif

[Files]
Source: "..\dist\{#AppName}.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppName}.exe"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppName}.exe"; Tasks: desktopicon

[Registry]
#if AppKey == "guard"
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "NoorGuardTray"; ValueData: """{app}\NoorGuard.exe"" --tray"; Tasks: tray; Flags: uninsdeletevalue
; Also removes the tray start-up entry if it was switched on later from Settings.
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: none; ValueName: "NoorGuardTray"; Flags: uninsdeletevalue
#else
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "NoorCleanerReminder"; ValueData: """{app}\NoorCleaner.exe"" --remind"; Tasks: reminder; Flags: uninsdeletevalue
; Also removes a reminder switched on later from Settings when NoorCleaner is uninstalled.
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: none; ValueName: "NoorCleanerReminder"; Flags: uninsdeletevalue
#endif

[Run]
Filename: "{app}\{#AppName}.exe"; Description: "Open {#AppName}"; Flags: nowait postinstall skipifsilent

[Code]
var
  LanguagePage: TInputOptionWizardPage;

procedure InitializeWizard;
begin
  LanguagePage := CreateInputOptionPage(wpWelcome,
    'Language  /  اللغة  /  Afaan',
    'Choose the language for {#AppName}',
    'Choose the language for {#AppName}.' + #13#10 +
    'اختر لغة برنامج {#AppNameAr}.' + #13#10 +
    'Afaan {#AppName} itti fayyadamu filadhu.' + #13#10#13#10 +
    'You can change it later in Settings.',
    True, False);
  LanguagePage.Add('English');
  LanguagePage.Add('العربية  (Arabic)');
  LanguagePage.Add('Afaan Oromoo  (Oromo)');
  { Start on the language Windows itself uses: primary language 0x01 is Arabic, 0x72 is Oromo. }
  case GetUILanguage and $3FF of
    $01: LanguagePage.SelectedValueIndex := 1;
    $72: LanguagePage.SelectedValueIndex := 2;
  else
    LanguagePage.SelectedValueIndex := 0;
  end;
end;

function ChosenLanguage: String;
begin
  case LanguagePage.SelectedValueIndex of
    1: Result := 'ar';
    2: Result := 'om';
  else
    Result := 'en';
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  Folder, Choices: String;
begin
  if CurStep = ssPostInstall then
  begin
    Folder := ExpandConstant('{localappdata}\NoorCleaner');
    ForceDirectories(Folder);
    Choices := 'language=' + ChosenLanguage + #13#10;
#if AppKey == "guard"
    if WizardIsTaskSelected('tray') then
      Choices := Choices + 'tray_autostart=1' + #13#10 + 'live_monitor=1' + #13#10;
#else
    if WizardIsTaskSelected('reminder') then
      Choices := Choices + 'reminder_days=30' + #13#10;
#endif
    SaveStringToFile(Folder + '\installer.txt', Choices, False);
  end;
end;
