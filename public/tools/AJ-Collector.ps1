<#
.SYNOPSIS
  AJ Collector 1.0 - read-only health snapshot of a Windows SCADA server,
  HMI, historian or engineering workstation, for analysis on
  https://www.ajpowerapps.com/calculators/windows-health-analyser

.DESCRIPTION
  The collector ONLY READS information. It does not change any setting,
  start or stop anything, install anything or send anything over the
  network. It writes one JSON file in the output folder; you decide what
  to do with it. Open the file in the Windows Health Analyser (in your
  browser; the file is not uploaded) and use "Download anonymised copy"
  before you send it to anyone.

  What it reads (each part is skipped, and listed in the report, if it
  is not available or needs administrator rights):
    - Windows version, last boot, hardware, domain or workgroup, installed
      updates, pending-restart flags
    - Disks and free space; physical disk health
    - Services: state, start type, account, dependencies
    - Event logs of the last N days: System and Application errors and
      warnings, selected System events (boots, shutdowns, time changes,
      service installs), boot duration, selected Security events (admin)
    - Windows Time: w32tm /query /status, /configuration, /source; time zone
    - Network: ipconfig /all, route print -4, arp -a, netstat -ano,
      adapters, listening ports with their process
    - Processes: name, memory, CPU time
    - Windows Firewall: profiles and enabled rules
    - Local accounts, members of Administrators and Remote Desktop Users,
      password policy (net accounts)
    - Security settings: Remote Desktop and NLA, SMBv1, UAC, USB storage,
      AutoRun, LLMNR, Microsoft Defender status, audit policy (admin)
    - Domain: secure channel and domain controller (nltest), Group Policy
      summary (gpresult /r)
    - Installed software (name, version, publisher)
    - Certificates in the computer's Personal, Remote Desktop and Web
      Hosting stores (no private keys are ever read)

.PARAMETER Days
  How many days of event log to read. Default 7.

.PARAMETER OutFolder
  Folder for the report. Default: the current folder.

.EXAMPLE
  powershell.exe -ExecutionPolicy Bypass -File .\AJ-Collector.ps1
  (Bypass applies to this one run only; it does not change the policy.)
  Run "as administrator" to include the parts that need it.

.NOTES
  (c) 2026 Ajmal Jamseeth, AJapps (www.ajpowerapps.com). Provided as is,
  without warranty. You may run and read this script; redistribution of
  modified copies under the AJapps name is not permitted.
  Read it before you run it - that is why it is not obfuscated.
#>
[CmdletBinding()]
param(
  [int]$Days = 7,
  [string]$OutFolder = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
$sw = [Diagnostics.Stopwatch]::StartNew()
$script:skipped = New-Object System.Collections.ArrayList

function Iso($d) {
  if ($null -eq $d) { return $null }
  try { return ([datetime]$d).ToUniversalTime().ToString('o') } catch { return $null }
}
function Txt($s, [int]$max = 400) {
  if ($null -eq $s) { return $null }
  $t = ($s -replace '\s+', ' ').Trim()
  if ($t.Length -gt $max) { $t = $t.Substring(0, $max) + '...' }
  return $t
}
function Run([string]$exe, [string[]]$a) {
  try { return ((& $exe @a 2>&1) | Out-String) } catch { return "ERROR: $($_.Exception.Message)" }
}
function Section([string]$name, [scriptblock]$sb) {
  Write-Host "  - $name"
  try { return (& $sb) }
  catch {
    [void]$script:skipped.Add([pscustomobject]@{ section = $name; reason = (Txt $_.Exception.Message 200) })
    return $null
  }
}
function RegVal([string]$path, [string]$name) {
  try { return (Get-ItemProperty -Path $path -Name $name -ErrorAction Stop).$name } catch { return $null }
}

$isAdmin = $false
try {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $isAdmin = (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
} catch { }

Write-Host "AJ Collector 1.0 - read-only. Administrator: $isAdmin"
$since = (Get-Date).AddDays(-$Days)
$report = [ordered]@{
  format  = 'AJ Collector report'
  version = '1.0'
}

$report.meta = [ordered]@{
  collectedUtc   = Iso (Get-Date)
  collectedLocal = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  computer       = $env:COMPUTERNAME
  user           = "$env:USERDOMAIN\$env:USERNAME"
  isAdmin        = $isAdmin
  psVersion      = "$($PSVersionTable.PSVersion)"
  days           = $Days
}

$report.system = Section 'system' {
  $os = Get-CimInstance Win32_OperatingSystem
  $cs = Get-CimInstance Win32_ComputerSystem
  $cpu = @(Get-CimInstance Win32_Processor)
  $pending = @()
  if (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending') { $pending += 'Component Based Servicing' }
  if (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired') { $pending += 'Windows Update' }
  if (RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager' 'PendingFileRenameOperations') { $pending += 'Pending file rename operations' }
  $hf = @()
  try { $hf = @(Get-HotFix | ForEach-Object { [ordered]@{ id = $_.HotFixID; description = $_.Description; installedOn = (Iso $_.InstalledOn) } }) } catch { }
  [ordered]@{
    os            = $os.Caption
    version       = $os.Version
    build         = $os.BuildNumber
    installDate   = Iso $os.InstallDate
    lastBoot      = Iso $os.LastBootUpTime
    uptimeHours   = [math]::Round(((Get-Date) - $os.LastBootUpTime).TotalHours, 1)
    manufacturer  = $cs.Manufacturer
    model         = $cs.Model
    partOfDomain  = [bool]$cs.PartOfDomain
    domain        = $cs.Domain
    cpu           = ($cpu | Select-Object -First 1).Name
    cores         = ($cpu | Measure-Object NumberOfCores -Sum).Sum
    logical       = ($cpu | Measure-Object NumberOfLogicalProcessors -Sum).Sum
    ramGB         = [math]::Round($cs.TotalPhysicalMemory / 1GB, 1)
    ramFreeGB     = [math]::Round($os.FreePhysicalMemory * 1KB / 1GB, 1)
    timeZone      = (Get-TimeZone).Id
    pendingReboot = $pending
    hotfixes      = $hf
  }
}

$report.disks = Section 'disks' {
  @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | ForEach-Object {
      [ordered]@{ name = $_.DeviceID; label = $_.VolumeName; fs = $_.FileSystem; sizeGB = [math]::Round($_.Size / 1GB, 1); freeGB = [math]::Round($_.FreeSpace / 1GB, 1) }
    })
}

$report.physicalDisks = Section 'physicalDisks' {
  @(Get-PhysicalDisk | ForEach-Object {
      [ordered]@{ name = $_.FriendlyName; mediaType = "$($_.MediaType)"; health = "$($_.HealthStatus)"; status = "$($_.OperationalStatus)"; sizeGB = [math]::Round($_.Size / 1GB, 0) }
    })
}

$report.services = Section 'services' {
  $deps = @{}
  foreach ($s in Get-Service) {
    $deps[$s.Name] = @{ on = @($s.ServicesDependedOn | ForEach-Object { $_.Name }); by = @($s.DependentServices | ForEach-Object { $_.Name }) }
  }
  @(Get-CimInstance Win32_Service | ForEach-Object {
      $d = $deps[$_.Name]
      [ordered]@{
        name       = $_.Name
        display    = $_.DisplayName
        state      = $_.State
        startMode  = $_.StartMode
        delayed    = [bool]$_.DelayedAutoStart
        account    = $_.StartName
        path       = (Txt $_.PathName 260)
        dependsOn  = @(if ($d) { $d.on })
        dependents = @(if ($d) { $d.by })
      }
    })
}

$report.events = Section 'events' {
  $list = New-Object System.Collections.ArrayList
  $add = {
    param($log, $ev)
    foreach ($e in $ev) {
      $msg = $null
      try { $msg = Txt (($e.Message -split "`r?`n" | Select-Object -First 4) -join ' ') 400 } catch { }
      [void]$list.Add([ordered]@{ log = $log; time = (Iso $e.TimeCreated); id = $e.Id; source = $e.ProviderName; level = $e.LevelDisplayName; message = $msg })
    }
  }
  foreach ($log in 'System', 'Application') {
    try { & $add $log (Get-WinEvent -FilterHashtable @{ LogName = $log; Level = 1, 2, 3; StartTime = $since } -MaxEvents 500) } catch { if ($_.Exception.Message -notmatch 'No events') { [void]$script:skipped.Add([pscustomobject]@{ section = "events:$log"; reason = (Txt $_.Exception.Message 200) }) } }
  }
  try { & $add 'System' (Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 1, 35, 37, 1074, 6005, 6006, 6008, 7040, 7045; StartTime = $since } -MaxEvents 300 | Where-Object { $_.Level -ge 4 -or $_.Level -eq 0 }) } catch { }
  try { & $add 'Diagnostics-Performance' (Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-Diagnostics-Performance/Operational'; Id = 100; StartTime = $since.AddDays(-23) } -MaxEvents 20) } catch { }
  if ($isAdmin) {
    try { & $add 'Security' (Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 1102, 4616, 4625, 4697, 4720, 4722, 4725, 4726, 4728, 4732, 4740, 4756; StartTime = $since } -MaxEvents 300) } catch { if ($_.Exception.Message -notmatch 'No events') { [void]$script:skipped.Add([pscustomobject]@{ section = 'events:Security'; reason = (Txt $_.Exception.Message 200) }) } }
  } else { [void]$script:skipped.Add([pscustomobject]@{ section = 'events:Security'; reason = 'needs administrator rights' }) }
  , $list.ToArray()
}

$report.time = Section 'time' {
  [ordered]@{
    status        = Run 'w32tm' @('/query', '/status')
    configuration = Run 'w32tm' @('/query', '/configuration')
    source        = (Run 'w32tm' @('/query', '/source')).Trim()
    timeZone      = (Run 'tzutil' @('/g')).Trim()
  }
}

$report.network = Section 'network' {
  $ad = @()
  try { $ad = @(Get-NetAdapter | ForEach-Object { [ordered]@{ name = $_.Name; description = $_.InterfaceDescription; status = "$($_.Status)"; linkSpeed = "$($_.LinkSpeed)"; mac = $_.MacAddress } }) } catch { }
  [ordered]@{
    ipconfig = Run 'ipconfig' @('/all')
    route    = Run 'route' @('print', '-4')
    arp      = Run 'arp' @('-a')
    netstat  = Run 'netstat' @('-ano')
    adapters = $ad
  }
}

$procNames = @{}
try { foreach ($p in Get-Process) { $procNames[[int]$p.Id] = $p.ProcessName } } catch { }

$report.listening = Section 'listening' {
  $l = @()
  $l += @(Get-NetTCPConnection -State Listen | ForEach-Object { [ordered]@{ proto = 'TCP'; address = $_.LocalAddress; port = [int]$_.LocalPort; pid = [int]$_.OwningProcess; process = $procNames[[int]$_.OwningProcess] } })
  $l += @(Get-NetUDPEndpoint | ForEach-Object { [ordered]@{ proto = 'UDP'; address = $_.LocalAddress; port = [int]$_.LocalPort; pid = [int]$_.OwningProcess; process = $procNames[[int]$_.OwningProcess] } })
  $l
}

$report.processes = Section 'processes' {
  @(Get-Process | ForEach-Object {
      $path = $null; try { $path = $_.Path } catch { }
      $cpuS = $null; try { $cpuS = [math]::Round($_.CPU, 1) } catch { }
      [ordered]@{ name = $_.ProcessName; pid = $_.Id; cpuS = $cpuS; workingSetMB = [math]::Round($_.WorkingSet64 / 1MB, 1); privateMB = [math]::Round($_.PrivateMemorySize64 / 1MB, 1); path = $path }
    })
}

$report.firewall = Section 'firewall' {
  $pf = @{}; foreach ($x in Get-NetFirewallPortFilter -All) { $pf[$x.InstanceID] = $x }
  $af = @{}; foreach ($x in Get-NetFirewallAddressFilter -All) { $af[$x.InstanceID] = $x }
  $apf = @{}; foreach ($x in Get-NetFirewallApplicationFilter -All) { $apf[$x.InstanceID] = $x }
  $profiles = @(Get-NetFirewallProfile | ForEach-Object { [ordered]@{ name = $_.Name; enabled = "$($_.Enabled)"; inbound = "$($_.DefaultInboundAction)"; outbound = "$($_.DefaultOutboundAction)" } })
  $rules = @(Get-NetFirewallRule -Enabled True | ForEach-Object {
      $k = $_.InstanceID; $p = $pf[$k]; $a = $af[$k]; $ap = $apf[$k]
      if (-not $p) { $p = $pf[$_.Name] }; if (-not $a) { $a = $af[$_.Name] }; if (-not $ap) { $ap = $apf[$_.Name] }
      [ordered]@{
        name          = $_.Name
        display       = $_.DisplayName
        group         = $_.DisplayGroup
        direction     = "$($_.Direction)"
        action        = "$($_.Action)"
        profile       = "$($_.Profile)"
        protocol      = if ($p) { "$($p.Protocol)" } else { $null }
        localPort     = if ($p) { (@($p.LocalPort) -join ',') } else { $null }
        remoteAddress = if ($a) { (@($a.RemoteAddress) -join ',') } else { $null }
        program       = if ($ap) { $ap.Program } else { $null }
      }
    })
  [ordered]@{ profiles = $profiles; rules = $rules }
}

$report.accounts = Section 'accounts' {
  $users = @(); $admins = @(); $rdp = @()
  try {
    $users = @(Get-LocalUser | ForEach-Object { [ordered]@{ name = $_.Name; enabled = [bool]$_.Enabled; lastLogon = (Iso $_.LastLogon); passwordLastSet = (Iso $_.PasswordLastSet); passwordExpires = (Iso $_.PasswordExpires); passwordRequired = [bool]$_.PasswordRequired; sid = "$($_.SID)"; description = $_.Description } })
  } catch { [void]$script:skipped.Add([pscustomobject]@{ section = 'accounts:users'; reason = (Txt $_.Exception.Message 200) }) }
  try { $admins = @(Get-LocalGroupMember -SID 'S-1-5-32-544' | ForEach-Object { [ordered]@{ name = $_.Name; source = "$($_.PrincipalSource)"; class = $_.ObjectClass } }) }
  catch { $admins = @((Run 'net' @('localgroup', 'administrators')) -split "`r?`n" | Where-Object { $_ -and $_ -notmatch '^(Alias|Comment|Members|-+|The command)' } | ForEach-Object { [ordered]@{ name = $_.Trim(); source = 'net localgroup'; class = '' } }) }
  try { $rdp = @(Get-LocalGroupMember -SID 'S-1-5-32-555' | ForEach-Object { [ordered]@{ name = $_.Name; source = "$($_.PrincipalSource)"; class = $_.ObjectClass } }) } catch { }
  [ordered]@{ users = $users; admins = $admins; rdpUsers = $rdp; netAccounts = (Run 'net' @('accounts')) }
}

$report.security = Section 'security' {
  $def = $null
  try { $m = Get-MpComputerStatus; $def = [ordered]@{ serviceEnabled = [bool]$m.AMServiceEnabled; antivirusEnabled = [bool]$m.AntivirusEnabled; realTime = [bool]$m.RealTimeProtectionEnabled; signaturesUpdated = (Iso $m.AntivirusSignatureLastUpdated); productVersion = $m.AMProductVersion } } catch { }
  $smb1 = $null; try { $smb1 = [bool](Get-SmbServerConfiguration).EnableSMB1Protocol } catch { }
  [ordered]@{
    rdpDenied          = RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server' 'fDenyTSConnections'
    nla                = RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' 'UserAuthentication'
    smb1               = $smb1
    enableLUA          = RegVal 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' 'EnableLUA'
    usbStorStart       = RegVal 'HKLM:\SYSTEM\CurrentControlSet\Services\USBSTOR' 'Start'
    noDriveTypeAutoRun = RegVal 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer' 'NoDriveTypeAutoRun'
    llmnrEnableMulticast = RegVal 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient' 'EnableMulticast'
    defender           = $def
    auditpol           = if ($isAdmin) { Run 'auditpol' @('/get', '/category:*') } else { $null }
  }
}

$report.domain = Section 'domain' {
  $cs = Get-CimInstance Win32_ComputerSystem
  if (-not $cs.PartOfDomain) { return [ordered]@{ partOfDomain = $false; workgroup = $cs.Workgroup } }
  $sc = $null; if ($isAdmin) { try { $sc = [bool](Test-ComputerSecureChannel) } catch { } }
  [ordered]@{
    partOfDomain  = $true
    name          = $cs.Domain
    secureChannel = $sc
    scVerify      = if ($isAdmin) { Run 'nltest' @("/sc_verify:$($cs.Domain)") } else { $null }
    dsgetdc       = Run 'nltest' @("/dsgetdc:$($cs.Domain)")
    gpresult      = if ($isAdmin) { Run 'gpresult' @('/r', '/scope', 'computer') } else { Run 'gpresult' @('/r', '/scope', 'user') }
  }
}

$report.software = Section 'software' {
  $keys = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
  @(Get-ItemProperty -Path $keys -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName } | Sort-Object DisplayName -Unique | ForEach-Object {
      [ordered]@{ name = $_.DisplayName; version = $_.DisplayVersion; publisher = $_.Publisher; installDate = $_.InstallDate }
    })
}

$report.certificates = Section 'certificates' {
  $out = @()
  foreach ($store in 'My', 'Remote Desktop', 'WebHosting') {
    $path = "Cert:\LocalMachine\$store"
    if (-not (Test-Path $path)) { continue }
    foreach ($c in Get-ChildItem $path) {
      $ks = $null; try { $ks = $c.PublicKey.Key.KeySize } catch { }
      $out += [ordered]@{
        store = $store; subject = $c.Subject; issuer = $c.Issuer; notBefore = (Iso $c.NotBefore); notAfter = (Iso $c.NotAfter)
        thumbprint = $c.Thumbprint; hasPrivateKey = [bool]$c.HasPrivateKey; sigAlg = $c.SignatureAlgorithm.FriendlyName; keySize = $ks
        eku = @($c.EnhancedKeyUsageList | ForEach-Object { $_.FriendlyName }); dns = @($c.DnsNameList | ForEach-Object { $_.Unicode })
      }
    }
  }
  $out
}

$report.skipped = $script:skipped
$report.meta.durationS = [math]::Round($sw.Elapsed.TotalSeconds, 1)

$name = 'AJCollector_{0}_{1}.json' -f $env:COMPUTERNAME, (Get-Date -Format 'yyyyMMdd-HHmm')
$file = Join-Path $OutFolder $name
$report | ConvertTo-Json -Depth 6 | Out-File -FilePath $file -Encoding UTF8
Write-Host ""
Write-Host "Report written: $file"
Write-Host "Open it in the Windows Health Analyser: https://www.ajpowerapps.com/calculators/windows-health-analyser"
Write-Host "Use 'Download anonymised copy' there before sending it to anyone."
