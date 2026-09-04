; electron-builder's default NSIS template requests admin elevation for the
; *installer* but leaves the *uninstaller* at "RequestExecutionLevel user"
; (see app-builder-lib/templates/nsis/installer.nsi). Noor Shield itself
; always runs elevated (win.requestedExecutionLevel: requireAdministrator),
; so an unelevated uninstaller cannot terminate the running app — Windows'
; integrity-level protection blocks a standard process from opening an
; elevated one with PROCESS_TERMINATE. That's what produced "Noor Shield is
; running. Click OK to close it." looping with no way to actually close it.
;
; customHeader runs for both the installer and uninstaller compile passes,
; so forcing admin here makes the uninstaller elevate too, letting it
; actually close and remove the running, elevated app.
!macro customHeader
  RequestExecutionLevel admin
!macroend

; The protection service (service/serviceName.js: SERVICE_ID
; "noorshieldfilter") runs as LocalSystem, independent of the GUI, by
; design. If someone uninstalls via Control Panel instead of the app's own
; "Remove Protection" flow, nothing else would ever stop or remove it —
; it would keep running against files this uninstaller is about to delete,
; and its WinSW wrapper .exe would still be locked when we try to delete
; it. Stopping and deleting it here, before file removal, avoids both.
; Best-effort: if the service was never installed, these simply no-op.
!macro customUnInit
  DetailPrint "Stopping Noor Shield protection service..."
  ExecWait 'sc.exe stop "noorshieldfilter"'
  Sleep 5000
  ExecWait 'sc.exe delete "noorshieldfilter"'
!macroend
