// Category guide: Commissioning, Change & Configuration management.

import type { GuideDoc } from "./types";

export const COMMISSIONING_GUIDE: GuideDoc = {
  slug: "change-configuration-management-substation-automation",
  groupId: "commissioning",
  title: "Change and Configuration Management for Substation Automation and SCADA",
  dek: "How to keep a commissioned substation automation and SCADA system in its approved state: baselines, version control of SCD, CID and switch files, comparing revisions before and after a change, tag database checks, patch control and the records to hand over.",
  readTime: "13 min read",
  intro: [
    "A substation automation system leaves commissioning in a tested, approved state. From then on every change — a new bay, a replaced relay, a firmware update, a Windows patch, an edited register — moves it away from that state. Most faults found years later trace back to a change that was not compared, recorded or tested: a CID that no longer matches the SCD, a data set changed without a new confRev, a firewall rule nobody remembers adding.",
    "Change and configuration management is the discipline of knowing what the approved configuration is, comparing every proposed change with it, testing what the change affects, and recording the result. IEC 62443 requires it for cybersecurity; good engineering requires it for reliability.",
  ],
  coreConcepts: [
    { heading: "The baseline", body: ["The baseline is the set of records that describe the approved system: the SCD, the CID of every IED, switch configurations, the IP and asset registers, the SCADA tag database, firewall rules, the installed software and patch level of each computer. Take it at the end of commissioning and store it with the as-built documents.", "Every later change is described as a difference from the baseline, and once approved and tested, becomes part of the next baseline."] },
    { heading: "Fingerprints instead of file names", body: ["File names and dates are not reliable: 'S13_final_v3_rev2.scd' says nothing certain. A SHA-256 fingerprint is calculated from the content; any change, even one character, gives a different value. Recording the fingerprint of each approved file makes it possible to prove later that a file in use is — or is not — the approved one.", "Read files back from devices (CID from the relay, configuration backup from the switch) and compare their fingerprints with the log before and after each intervention."] },
    { heading: "Compare before you change, and after", body: ["Before a change, compare the proposed revision with the baseline so that every difference is seen and assessed; after the change, compare what is actually installed with what was approved. Unexpected differences in either comparison are the warning signs.", "The impact of a difference depends on its kind. An IP address change touches the register, the SCD, firewall rules and the SCADA connection. A data set change requires a new confRev and a reload of the publisher and every subscriber. A firewall change needs security review. A firmware change needs the tests the release notes require."] },
    { heading: "The SCADA tag database", body: ["Large point lists are built by copying rows, and copy errors load without complaint: two points on one address, a description not edited, alarm limits in the wrong order, an analog value placed in the wrong data table. Validating the list before loading finds them in minutes, instead of during point-to-point testing or in operation."] },
    { heading: "Patches on SCADA computers", body: ["SCADA vendors test operating-system updates against their software and publish approval lists. Installing an untested update can break drivers, OPC DA or redundancy; not installing approved security updates leaves known vulnerabilities open. Redundant servers should always run the same patch level, so that a failover behaves as tested.", "Collect the installed updates from each computer, compare them with the vendor's list and between redundant pairs, and plan the differences into maintenance windows."] },
    { heading: "As-built verification of the network", body: ["The design says which VLANs each switch port carries, which device is on it and which multicast filters it has; the installed switches say what was really configured and connected. Compare the configuration exported from every switch with the plan, trace every GOOSE and sampled-value stream from publisher to subscriber through the configured ports, and compare the LLDP neighbours and MAC address tables with the planned port map. A missing VLAN on one port silently stops a trip or interlock; a swapped cable or an unknown laptop shows up only this way.", "Then scan the subnets (with permission) and compare what answers with the IP register: devices nobody registered, a replaced device with a new MAC address, a device at the wrong address, and services such as Telnet or HTTP that should be disabled."] },
    { heading: "Handover records", body: ["At handover, the client should receive the records needed to operate and maintain the system: the network design and IP plan, GOOSE/SV addressing, switch port and cable schedules with test results, the asset register with firmware and lifecycle, firewall rules, the configuration log with fingerprints, and the open items. Signed and dated, they are the first baseline."] },
  ],
  standardsLandscape: [
    { standard: "IEC 62443-2-1, -2-3, -3-3", scope: "Security programme, patch management and system requirements for configuration and change control." },
    { standard: "IEC 61850-6", scope: "SCL engineering process; Header version, revision and History; confRev of data sets and control blocks." },
    { standard: "FIPS 180-4", scope: "SHA-256 secure hash used as file fingerprint." },
    { standard: "ISA-18.2 / EEMUA 191", scope: "Alarm management: alarm limits, priorities and normal states in the tag database." },
    { standard: "TIA-568.3-D", scope: "Fibre link loss limits used when recording cable test results." },
    { standard: "IEEE 802.1Q, IEEE 802.1AB, IEC TR 61850-90-4", scope: "VLAN membership and priority, LLDP neighbour discovery, and network engineering guidelines for IEC 61850 systems." },
  ],
  workflow: [
    { title: "Record the baseline", body: "At the end of commissioning, fingerprint the SCD, CIDs and switch configurations and mark them Installed.", calculatorHref: "/calculators/configuration-version-log", calculatorName: "Configuration Version Log" },
    { title: "Check the tag database before loading", body: "Validate every new or changed point list.", calculatorHref: "/calculators/scada-tag-validator", calculatorName: "SCADA Tag Database Validator" },
    { title: "Compare each proposed change", body: "Compare the new register, tag list or network design with the approved one and plan the tests for each difference.", calculatorHref: "/calculators/change-comparison", calculatorName: "Network & Configuration Change Comparison" },
    { title: "Keep patches in line", body: "Compare installed updates with the vendor's approval list and between redundant servers.", calculatorHref: "/calculators/patch-compatibility-register", calculatorName: "SCADA Patch Compatibility Register" },
    { title: "Verify computers after the change", body: "Run the AJ Collector and compare the report with the baseline report.", calculatorHref: "/calculators/windows-health-analyser", calculatorName: "Windows Health Analyser" },
    { title: "Audit the switches", body: "Import the switch configuration exports, LLDP and MAC tables and fix every broken stream path, missing VLAN, untrusted priority and misplaced cable.", calculatorHref: "/calculators/scl-netstudio", calculatorName: "SCL NetStudio → Switch audit" },
    { title: "Check what is on the network", body: "Compare a scan of each subnet with the register and close unknown devices, MAC mismatches and unapproved services.", calculatorHref: "/calculators/discovery-result-checker", calculatorName: "Network Discovery Result Checker" },
    { title: "Test point to point", body: "Turn the signal list into FAT/SAT test steps, record each result as you test and link the IEC 104 capture as evidence.", calculatorHref: "/calculators/commissioning-test-manager", calculatorName: "Commissioning Test Manager" },
    { title: "Hand over", body: "Record cable tests and lifecycle data and issue the handover pack from SCL NetStudio.", calculatorHref: "/calculators/scl-netstudio", calculatorName: "SCL NetStudio" },
    { title: "Review the alarm load after energisation", body: "Measure the first weeks of the alarm journal against EEMUA 191 and fix chattering, standing and consequential alarms.", calculatorHref: "/calculators/alarm-rationalisation-analyser", calculatorName: "Alarm Rationalisation Analyser" },
    { title: "Report communication availability", body: "Compute availability, MTBF and MTTR per link from the status log and find outages with a common cause.", calculatorHref: "/calculators/comm-availability-analyser", calculatorName: "Communication Availability Analyser" },
  ],
  commonMistakes: [
    { mistake: "Trusting file names and dates to identify the approved configuration.", whyItMatters: "Copies are renamed and dates change on copying; only the content fingerprint is certain." },
    { mistake: "Changing a GOOSE data set without raising confRev and reloading every subscriber.", whyItMatters: "Subscribers decode by position; a mismatch silently drops the signal — including trips." },
    { mistake: "Updating only one server of a redundant pair.", whyItMatters: "The standby runs a different software level from the one tested, and the failover may not behave as expected." },
    { mistake: "Loading a tag database without checking it.", whyItMatters: "Duplicate addresses and wrong limits load without error and appear only during testing or operation." },
    { mistake: "Keeping the change record only in someone's laptop.", whyItMatters: "When that person leaves, the history leaves with them; download logs and store them with the project records." },
  ],
  faqs: [
    { q: "Which files should be in the configuration log?", a: "At least the SCD, the CID (or equivalent configuration) of every IED, switch and firewall configurations, gateway/RTU configurations, the SCADA project or database export, and the firmware of every device type." },
    { q: "How often should the baseline be compared?", a: "Before and after every change, and periodically (for example yearly) to detect unrecorded changes." },
    { q: "Do these tools upload my files?", a: "No. Files are read and fingerprinted in your browser; download the logs and reports to keep them." },
  ],
};
