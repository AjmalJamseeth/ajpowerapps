// AJ Collector script published at /tools/AJ-Collector.ps1. The regression
// suite recomputes the hash, so this value always matches the published file.
export const COLLECTOR_FILE = "/tools/AJ-Collector.ps1";
export const COLLECTOR_VERSION = "1.0";
export const COLLECTOR_SHA256 = "503C39909F9BA27C34BF65DFD3D176C0B13F44052CBE930DB749FD7E335506EC";

export const COLLECTOR_READS: [string, string, boolean][] = [
  ["System", "Windows version, last boot, hardware, domain or workgroup, installed updates, pending-restart flags", false],
  ["Disks", "Volumes and free space; physical disk health", false],
  ["Services", "State, start type, account, path and dependencies of every service", false],
  ["Event logs", "System and Application errors and warnings of the last 7 days; boots, shutdowns, time changes and service installs; boot duration", false],
  ["Security events", "Failed logons, lockouts, account and group changes, log clearing, new services", true],
  ["Time", "w32tm /query /status, /configuration and /source; time zone", false],
  ["Network", "ipconfig /all, route print, arp -a, netstat -ano, adapters, listening ports with their process", false],
  ["Processes", "Name, process ID, memory and CPU time", false],
  ["Windows Firewall", "Profiles and enabled rules (ports, addresses, programs)", false],
  ["Accounts", "Local users, members of Administrators and Remote Desktop Users, password policy (net accounts)", false],
  ["Security settings", "Remote Desktop and NLA, SMBv1, UAC, USB storage, AutoRun, LLMNR, Defender status", false],
  ["Audit policy", "auditpol /get /category:*", true],
  ["Domain", "Domain controller (nltest /dsgetdc), Group Policy summary (gpresult /r)", false],
  ["Secure channel", "Test-ComputerSecureChannel and nltest /sc_verify (read-only tests)", true],
  ["Software", "Installed programs: name, version, publisher, install date", false],
  ["Certificates", "Computer Personal, Remote Desktop and Web Hosting stores — public data only, never private keys", false],
];
