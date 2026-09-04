# Resets any network adapter currently pointed at Noor Shield's local
# resolver (127.0.0.1) back to automatic (DHCP-provided) DNS.
#
# This exists as an unconditional safety net for uninstall. The "proper"
# path — filterService.js's own graceful shutdown restoring the adapter's
# previously-saved DNS servers — depends on the Windows Service Control
# Manager actually delivering a graceful stop signal to a GUI-subsystem
# Electron process, which is not reliable enough to be the only thing
# standing between a user and a PC with no working DNS at all after
# uninstalling. Falling back to DHCP (rather than the exact previous
# servers) is deliberate here: this script has no access to
# filterService.js's saved previousDns, and "the network's own DHCP
# server" is a safe default for every normal home/office network.
$ErrorActionPreference = 'SilentlyContinue'

Get-DnsClientServerAddress -AddressFamily IPv4 |
  Where-Object { $_.ServerAddresses -contains '127.0.0.1' } |
  ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex $_.InterfaceIndex -ResetServerAddresses }

Clear-DnsClientCache
