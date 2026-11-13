// Example outputs for the command explainer (realistic, from a commissioning laptop).
import type { CommandKey } from "./cmdexplain";

export const CMD_SAMPLES: Record<CommandKey, string> = {
  ipconfig: `Windows IP Configuration

   Host Name . . . . . . . . . . . . : ENG-LAPTOP-07
   Primary Dns Suffix  . . . . . . . :
   Node Type . . . . . . . . . . . . : Hybrid

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   Description . . . . . . . . . . . : Intel(R) Ethernet Connection I219-LM
   Physical Address. . . . . . . . . : 54-E1-AD-12-34-56
   DHCP Enabled. . . . . . . . . . . : No
   Autoconfiguration Enabled . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.13.0.200(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.13.1.1

Ethernet adapter Ethernet 2:

   Connection-specific DNS Suffix  . :
   Description . . . . . . . . . . . : USB 10/100/1000 LAN
   Physical Address. . . . . . . . . : 00-E0-4C-68-01-22
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   Autoconfiguration IPv4 Address. . : 169.254.31.7(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :

Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . : corp.example
   Description . . . . . . . . . . . : Intel(R) Wi-Fi 6 AX201 160MHz
   Physical Address. . . . . . . . . : 8C-C6-81-AA-BB-CC
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 192.168.20.45(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.20.1
   DNS Servers . . . . . . . . . . . : 192.168.20.1
`,
  route: `===========================================================================
IPv4 Route Table
===========================================================================
Active Routes:
Network Destination        Netmask          Gateway       Interface  Metric
          0.0.0.0          0.0.0.0     192.168.20.1    192.168.20.45     35
          0.0.0.0          0.0.0.0        10.13.0.1      10.13.0.200     25
        10.13.0.0    255.255.255.0         On-link       10.13.0.200    281
      10.13.0.200  255.255.255.255         On-link       10.13.0.200    281
      10.13.0.255  255.255.255.255         On-link       10.13.0.200    281
        127.0.0.0        255.0.0.0         On-link         127.0.0.1    331
     192.168.20.0    255.255.255.0         On-link     192.168.20.45    291
    192.168.20.45  255.255.255.255         On-link     192.168.20.45    291
        224.0.0.0        240.0.0.0         On-link         127.0.0.1    331
  255.255.255.255  255.255.255.255         On-link         127.0.0.1    331
===========================================================================
Persistent Routes:
  Network Address          Netmask  Gateway Address  Metric
       10.20.0.0    255.255.0.0        10.13.0.254       1
===========================================================================
`,
  arp: `
Interface: 10.13.0.200 --- 0x7
  Internet Address      Physical Address      Type
  10.13.0.1             00-1b-1b-aa-00-01     dynamic
  10.13.0.11            02-aa-00-00-01-01     dynamic
  10.13.0.14            02-aa-00-00-02-01     dynamic
  10.13.0.254           00-1b-1b-aa-00-01     dynamic
  10.13.0.255           ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
`,
  ping: `
Pinging 10.13.0.17 with 32 bytes of data:
Reply from 10.13.0.200: Destination host unreachable.
Reply from 10.13.0.200: Destination host unreachable.
Reply from 10.13.0.200: Destination host unreachable.
Reply from 10.13.0.200: Destination host unreachable.

Ping statistics for 10.13.0.17:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
`,
  tracert: `
Tracing route to 10.20.4.10 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  10.13.0.1
  2     1 ms     1 ms     1 ms  10.13.250.2
  3     *        *        *     Request timed out.
  4     *        *        *     Request timed out.

Trace complete.
`,
  netstat: `
Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1012
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:2404           0.0.0.0:0              LISTENING       3480
  TCP    0.0.0.0:3389           0.0.0.0:0              LISTENING       1260
  TCP    10.13.0.200:51022      10.13.0.14:102         ESTABLISHED     5520
  TCP    10.13.0.200:51030      10.13.0.17:102         SYN_SENT        5520
  TCP    10.13.0.200:51044      10.13.0.11:2404        ESTABLISHED     3480
  UDP    0.0.0.0:123            *:*                                    1532
  UDP    0.0.0.0:161            *:*                                    2210
`,
  w32tm: `Leap Indicator: 3(not synchronized)
Stratum: 0 (unspecified)
Precision: -23 (119.209ns per tick)
Root Delay: 0.0000000s
Root Dispersion: 10.0000000s
ReferenceId: 0x4C4F434C (source name:  "LOCL")
Last Successful Sync Time: unspecified
Source: Local CMOS Clock
Poll Interval: 10 (1024s)
`,
  stripchart: `Tracking 10.13.0.13 [10.13.0.13:123].
Collecting 5 samples.
The current time is 13/11/2026 09:41:02.
09:41:02, d:+00.0012000s o:-01.8420000s  [*                          |                           ]
09:41:04, d:+00.0011000s o:-01.8423000s  [*                          |                           ]
09:41:06, d:+00.0013000s o:-01.8425000s  [*                          |                           ]
09:41:08, d:+00.0012000s o:-01.8427000s  [*                          |                           ]
09:41:10, d:+00.0012000s o:-01.8430000s  [*                          |                           ]
`,
  nslookup: `Server:  UnKnown
Address:  10.13.0.5

*** UnKnown can't find hist01: Non-existent domain
`,
};
