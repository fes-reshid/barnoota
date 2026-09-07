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
;
; Also removes the local certificate authority (certAuthority.js) from
; Windows' trust store — normally service.prepareUninstall does this when
; uninstall goes through the app's own "Remove protection completely" flow,
; but that RPC never runs on this path (Control Panel straight to the
; uninstaller), and a stray trusted root CA left behind after the app that
; installed it is gone is exactly the kind of thing that must never happen.
; Matched by subject name rather than a cached thumbprint, since this script
; has no access to certAuthority.js's JSON metadata file — safe because
; nothing else on a family PC would coincidentally use this exact CN.
; Runs after this installer's files are copied to disk (both a fresh install
; and an upgrade over an existing one). The protection service, if it was
; already running from a previous install, is still executing whatever
; service/*.js code was loaded into its process's memory when it last
; started — overwriting those files on disk does absolutely nothing to code
; already running. Left alone, every service-side fix or feature in this
; release would silently not exist on this PC until either the whole
; machine reboots (which restarts the service fresh) or someone manually
; stops and starts it — exactly the kind of bug that looks like "the new
; feature just doesn't work" with no obvious cause.
;
; Stopping it here, before the app auto-launches (runAfterFinish), makes
; serviceClient.ensureRunning() find it unreachable on that very first
; launch and start it again itself — against the files this installer just
; wrote. No-op if the service was never installed (a first-time install).
!macro customInstall
  DetailPrint "Restarting Noor Shield protection service..."
  ExecWait 'sc.exe stop "noorshieldfilter"'
  Sleep 3000
!macroend

!macro customUnInit
  ; Runs first and unconditionally, before anything else: a PC left with no
  ; working DNS after uninstall is the worst possible outcome, worse than
  ; any other uninstall step failing. This does NOT depend on the
  ; protection service shutting down gracefully (see dns-restore.ps1 for
  ; why that path alone isn't reliable enough) — it directly resets any
  ; adapter still pointed at 127.0.0.1 back to automatic DNS.
  DetailPrint "Restoring Windows DNS settings..."
  ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\app\resources\dns-restore.ps1"'
  DetailPrint "Stopping Noor Shield protection service..."
  ExecWait 'sc.exe stop "noorshieldfilter"'
  Sleep 5000
  ExecWait 'sc.exe delete "noorshieldfilter"'
  DetailPrint "Removing Noor Shield's local certificate authority..."
  ExecWait 'certutil.exe -delstore Root "Noor Shield Local Filter CA"'
  ExecWait 'certutil.exe -delstore My "Noor Shield Local Filter CA"'
!macroend
