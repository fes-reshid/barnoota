; NoorCleaner installer (Inno Setup 6). Build NoorCleaner.exe with PyInstaller first, then:
;   ISCC.exe /DAppVersion=2.0.0 installer\NoorCleaner.iss
; The installer asks for the app's language (English / Arabic / Afaan Oromoo) and passes the
; choice to the app through %LOCALAPPDATA%\NoorCleaner\installer.txt (see settings.py).
; This file is UTF-8 with a byte order mark so the Arabic text survives.

#ifndef AppVersion
  #define AppVersion "2.0.0"
#endif

[Setup]
AppId={{6B0E8C1E-9C3A-4B4D-9A57-2E7C6D1F5A21}
AppName=NoorCleaner
AppVersion={#AppVersion}
AppPublisher=Diin Islaam
DefaultDirName={localappdata}\Programs\NoorCleaner
DefaultGroupName=NoorCleaner
DisableProgramGroupPage=yes
; Installs for the current user, so no administrator prompt is needed to install.
PrivilegesRequired=lowest
OutputDir=..\dist
OutputBaseFilename=NoorCleaner-Setup
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\NoorCleaner.exe
UninstallDisplayName=NoorCleaner
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"
Name: "reminder"; Description: "Remind me every month when junk files build up (can be changed in Settings)"

[Files]
Source: "..\dist\NoorCleaner.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\NoorCleaner"; Filename: "{app}\NoorCleaner.exe"
Name: "{autodesktop}\NoorCleaner"; Filename: "{app}\NoorCleaner.exe"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "NoorCleanerReminder"; ValueData: """{app}\NoorCleaner.exe"" --remind"; Tasks: reminder; Flags: uninsdeletevalue
; Also removes a reminder switched on later from Settings when NoorCleaner is uninstalled.
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: none; ValueName: "NoorCleanerReminder"; Flags: uninsdeletevalue

[Run]
Filename: "{app}\NoorCleaner.exe"; Description: "Open NoorCleaner"; Flags: nowait postinstall skipifsilent

[Code]
var
  LanguagePage: TInputOptionWizardPage;

procedure InitializeWizard;
begin
  LanguagePage := CreateInputOptionPage(wpWelcome,
    'Language  /  اللغة  /  Afaan',
    'Choose the language for NoorCleaner',
    'Choose the language for NoorCleaner.' + #13#10 +
    'اختر لغة برنامج نور كلينر.' + #13#10 +
    'Afaan NoorCleaner itti fayyadamu filadhu.' + #13#10#13#10 +
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
    if WizardIsTaskSelected('reminder') then
      Choices := Choices + 'reminder_days=30' + #13#10;
    SaveStringToFile(Folder + '\installer.txt', Choices, False);
  end;
end;
