// Worked examples: IEC 61850 & Substation Automation (SCL Studio).
// These are configuration-checking examples rather than numeric ones: each
// step follows the checks the SCL editor's validation performs, with the
// messages it reports.

import type { WorkedExample } from "./types";

const HREF = "/calculators/iec-61850-scl-editor";
const NAME = "IEC 61850 SCL Editor (SCL Studio)";

export const IEC61850_EXAMPLES: WorkedExample[] = [
  {
    slug: "iec-61850-duplicate-goose-appid-mac-address",
    groupId: "iec-61850",
    calculatorHref: HREF,
    calculatorName: NAME,
    title: "Worked Example: Finding and Fixing Duplicate GOOSE APPIDs and MAC Addresses in an SCD File",
    dek: "Two protection IEDs from different manufacturers arrive with the same default GOOSE address. How the clash is found in the SCD, why it matters, and how to reassign the addresses without breaking subscriptions.",
    standard: "IEC 61850-6 / 61850-8-1",
    readTime: "8 min read",
    scenario: [
      { label: "System", value: "132/33 kV substation SCD, one station bus subnetwork" },
      { label: "Publisher 1", value: "Line protection IED F01_PROT, GOOSE control block gcbTrip" },
      { label: "Publisher 2", value: "Transformer protection IED T01_PROT (different manufacturer), GOOSE control block gcbTrip" },
      { label: "Address in both ICD files", value: "APPID 0001, MAC 01-0C-CD-01-00-01, VLAN-ID 000, priority 4" },
      { label: "Subscriber", value: "Busbar protection IED BB_PROT subscribes to both trip messages" },
    ],
    scenarioNote: "Manufacturers' ICD files often ship with the same first address. The system integrator must make every GOOSE stream unique when the SCD is assembled.",
    steps: [
      {
        title: "Run validation on the SCD",
        body: "Open the SCD and run the communication checks. Both GSE elements in the Communication section carry the same address, so validation reports:",
        result: "MAC 01-0C-CD-01-00-01 duplicated (F01_PROT/… and T01_PROT/…) — error; APPID 0001 duplicated — warning",
        note: "The MAC address is reported as an error because two publishers on one multicast address cannot be told apart by switches that filter on MAC. The APPID is a warning because subscribers filter on it, but the GoID and data set can still distinguish the streams in some IEDs.",
      },
      {
        title: "Understand why it matters",
        body: "A subscriber that filters on MAC and APPID receives both streams as if they were one. Depending on the IED, it may reject both (because the GoID or data set does not match what it expects) or accept the wrong one. Either way, the busbar protection may not see a breaker-fail trip from the transformer IED.",
      },
      {
        title: "Choose new, unique addresses",
        body: "Keep each value inside the ranges of IEC 61850-8-1 and unique on the subnetwork.",
        table: {
          headers: ["Publisher", "MAC address", "APPID", "VLAN-ID / priority"],
          rows: [
            ["F01_PROT gcbTrip", "01-0C-CD-01-00-01", "0001", "000 / 4 (unchanged)"],
            ["T01_PROT gcbTrip", "01-0C-CD-01-00-02", "0002", "000 / 4"],
          ],
        },
        note: "GOOSE MAC addresses run from 01-0C-CD-01-00-00 to 01-0C-CD-01-01-FF. GOOSE APPIDs run from 0000 to 3FFF, or 8000 to BFFF for Type 1A trip GOOSE where all the IEDs support that range.",
      },
      {
        title: "Edit the address and re-validate",
        body: "Change the T01_PROT GSE address in the Communication section (or use the editor's automatic address assignment for all control blocks), then run validation again.",
        result: "No MAC or APPID duplicates reported",
      },
      {
        title: "Export and load the configuration",
        body: "Export the CID files for both publishers and for the subscriber, because the subscriber's configuration also holds the expected address of each stream. Load them with each manufacturer's tool and confirm with a network analyser that two separate GOOSE streams are present.",
      },
    ],
    resultSummary: [
      { check: "MAC address unique on subnetwork", requirement: "Each GOOSE stream has its own multicast MAC", actual: "Was duplicated; now 01-0C-CD-01-00-01 and 01-0C-CD-01-00-02", pass: true },
      { check: "APPID unique on subnetwork", requirement: "Each GOOSE stream has its own APPID", actual: "Was duplicated; now 0001 and 0002", pass: true },
      { check: "Values inside IEC 61850-8-1 ranges", requirement: "MAC 01-0C-CD-01-00-00…01-FF, APPID 0000–3FFF", actual: "Both inside range", pass: true },
    ],
    finalAnswer: "The two trip messages shared MAC 01-0C-CD-01-00-01 and APPID 0001. Giving T01_PROT the address 01-0C-CD-01-00-02 / APPID 0002 makes both streams unique; after re-validation and loading the updated CID files into the publishers and the subscriber, the busbar protection receives both trips separately.",
    keyInsight: "Address clashes are a system-integration problem, not a fault in either IED: each ICD file is correct on its own. Checking the whole SCD for duplicates is the only place they show up before site testing.",
    faqs: [
      { q: "Is the APPID the same as the GoID?", a: "No. The APPID is a 16-bit value in the Ethernet frame used for fast filtering. The GoID (appID attribute of the GSEControl) is a text identifier carried inside the GOOSE message." },
      { q: "Do I need a different VLAN for each GOOSE message?", a: "No. VLANs separate traffic on the network; uniqueness of each stream comes from the MAC address and APPID. Many projects put all protection GOOSE on one VLAN." },
      { q: "Must the subscriber's configuration be reloaded after changing a publisher's address?", a: "Yes. The subscriber filters on the expected address, so its configuration must be updated and reloaded as well." },
    ],
  },

  {
    slug: "iec-61850-goose-subscription-extref-dataset",
    groupId: "iec-61850",
    calculatorHref: HREF,
    calculatorName: NAME,
    title: "Worked Example: Tracing a GOOSE Signal That Never Arrives — ExtRef and Data Set Checks",
    dek: "A breaker-fail backup trip from a bay IED does not reach the busbar protection. Following the ExtRef back to the publisher's control block and data set finds two configuration errors.",
    standard: "IEC 61850-6 / 61850-7-2",
    readTime: "8 min read",
    scenario: [
      { label: "Publisher", value: "Bay IED Q02_BCU, logical device CTRL, GOOSE control block gcbBF using data set dsBF" },
      { label: "Data set dsBF", value: "RBRF1.OpEx.general (ST) and RBRF1.OpEx.q (ST)" },
      { label: "Subscriber", value: "BB_PROT, input mapped by an ExtRef to Q02_BCU / CTRL / RBRF1.OpIn.general, srcCBName gcbBFail" },
      { label: "Symptom", value: "A breaker-fail backup trip from bay Q02 never trips the busbar zone during testing" },
    ],
    steps: [
      {
        title: "Validate the subscriber's ExtRef inputs",
        body: "The ExtRef in BB_PROT names the source IED, logical device, logical node, data object and the control block it expects the signal in. Validation checks each part against the publisher.",
        result: "ExtRef error: srcCBName \"gcbBFail\" not found in Q02_BCU",
        note: "The control block in the publisher is called gcbBF. The subscriber was configured from an earlier revision of the publisher's ICD file, where it had a different name.",
      },
      {
        title: "Correct the control block reference",
        body: "Point the ExtRef's srcCBName at gcbBF and validate again.",
        result: "New warning: RBRF1.OpIn.general is not a member of gcbBF data set dsBF",
      },
      {
        title: "Compare the ExtRef with the data set contents",
        body: "The data set carries RBRF1.OpEx, the breaker-fail backup trip to the surrounding breakers. The ExtRef asks for RBRF1.OpIn, the internal re-trip of the bay's own breaker, which is a different data object and is not published at all.",
        table: {
          headers: ["Item", "Configured", "Required"],
          rows: [
            ["Control block", "gcbBFail", "gcbBF"],
            ["Data object in ExtRef", "RBRF1.OpIn.general", "RBRF1.OpEx.general (or add the required signal to dsBF)"],
          ],
        },
        note: "Decide with the protection designer which signal the busbar scheme needs. If it really needs a signal that is not in the data set, add it to dsBF on the publisher side, which changes the data set and so the control block's configuration revision.",
      },
      {
        title: "Fix, re-validate and check the configuration revision",
        body: "Here the busbar scheme should use OpEx, so the ExtRef is corrected to RBRF1.OpEx.general. Validation now reports no ExtRef errors or warnings. If the data set had been changed instead, the publisher's confRev increases and the subscriber must be reloaded so both sides agree.",
        result: "ExtRef resolves to an existing control block and a member of its data set",
      },
      {
        title: "Export and test",
        body: "Export the updated CID for BB_PROT, load it with the manufacturer's tool, and repeat the breaker-fail backup-trip test, checking the GOOSE message on the network and the input status in the busbar IED.",
      },
    ],
    resultSummary: [
      { check: "ExtRef source control block exists", requirement: "srcCBName matches a GSEControl in the source IED", actual: "Was gcbBFail (not found); now gcbBF", pass: true },
      { check: "Subscribed signal is in the data set", requirement: "ExtRef points to a data set member", actual: "Was RBRF1.OpIn (not published); now RBRF1.OpEx.general", pass: true },
      { check: "Validation clean", requirement: "No ExtRef errors or warnings", actual: "None reported", pass: true },
    ],
    finalAnswer: "The signal never arrived because the subscriber expected it in a control block that no longer exists (gcbBFail) and asked for a data object (OpIn) that the publisher does not send. Correcting the ExtRef to gcbBF and RBRF1.OpEx.general resolves both, and the breaker-fail backup trip reaches the busbar protection after the updated CID is loaded.",
    keyInsight: "A GOOSE subscription only works when four things agree: the source IED, the control block name, the data set member and the configuration revision. Checking the ExtRef against all of them in the SCD finds most \"signal not arriving\" faults before anyone goes to site.",
    faqs: [
      { q: "Why does changing a data set matter to the subscriber?", a: "The subscriber decodes GOOSE values by their position in the data set. If members are added or reordered, the publisher's confRev changes and a subscriber still configured for the old revision should reject the message." },
      { q: "Is a clean SCD validation enough?", a: "No. It shows the configuration is consistent. The manufacturer's tools, the loaded CID files and a functional test on the network confirm that the IEDs actually behave as configured." },
      { q: "Should the quality attribute be subscribed as well?", a: "It is good practice to include and check the quality (q) of protection signals so the subscriber can treat invalid or test-mode data correctly." },
    ],
  },
];
