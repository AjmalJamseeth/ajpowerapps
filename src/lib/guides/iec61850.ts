// Category guide: IEC 61850 & Substation Automation.

import type { GuideDoc } from "./types";

const SCL = "/calculators/iec-61850-scl-editor";
const SCL_NAME = "IEC 61850 SCL Editor (SCL Studio)";

export const IEC61850_GUIDE: GuideDoc = {
  slug: "iec-61850-substation-automation",
  groupId: "iec-61850",
  title: "IEC 61850 Guide: SCL Files, GOOSE and Sampled Values",
  dek: "How IEC 61850 models a substation, what SCD, ICD and CID files are for, how GOOSE and sampled values travel on the station and process bus, and the configuration mistakes that most often stop signals arriving.",
  readTime: "12 min read",
  intro: [
    "IEC 61850 is the international standard for communication in electrical substations. Instead of hard-wired contacts between protection relays, IEDs (intelligent electronic devices) exchange trips, interlocks, measurements and sampled currents and voltages as messages on an Ethernet network. The standard defines both what the information means (a common data model) and how it is sent (the communication services and their mapping to Ethernet and MMS).",
    "Everything about a system is described in configuration files written in SCL, the System Configuration description Language of IEC 61850-6. Because these files are long XML documents produced by several vendors' tools, reviewing them by hand is slow. The SCL Studio tool on this site opens them in the browser so you can see the substation, IEDs and data flows, find mistakes and correct them.",
  ],
  coreConcepts: [
    {
      heading: "The data model: logical devices, logical nodes and data objects",
      body: [
        "IEC 61850-7-4 breaks every substation function into logical nodes with standard four-letter names. The first letter gives the group: P for protection (PTOC time overcurrent, PDIS distance, PDIF differential), R for protection-related functions (RREC auto-reclose, RBRF breaker failure), X for switchgear (XCBR circuit breaker, XSWI switch), C for control (CSWI switch controller, CILO interlocking), M for measurement (MMXU), T for instrument transformers (TCTR, TVTR), G for generic functions (GGIO) and L for system nodes (LLN0, LPHD).",
        "Logical nodes sit inside logical devices, which sit inside an IED's server. Each logical node holds data objects built from the common data classes of IEC 61850-7-3, for example Pos (position, a DPC) on XCBR or Op (operate, an ACT) on PTOC. A signal is therefore addressed by a path such as IED1/PROT/PTOC1.Op.general, which is the same in every vendor's device.",
      ],
    },
    {
      heading: "SCL files and the engineering process",
      body: [
        "Each IED manufacturer supplies an ICD file that describes what its device can do. The system integrator imports the ICD files into a system configuration tool, adds the substation single-line structure, assigns network addresses and links the data flows between IEDs. The result is the SCD file, which describes the complete substation.",
        "Each manufacturer's IED configuration tool then reads the SCD and generates the CID file loaded into its own device. Edition 2 added the IID file (a configured IED returned to the system tool) and the SED file (signals exchanged between projects, for example two substations). An SSD file can describe the required functions before any IED is chosen. Keeping one SCD as the single source of truth, and regenerating CID files from it, avoids devices drifting out of step with the documentation.",
      ],
    },
    {
      heading: "GOOSE: fast peer-to-peer signals on the station bus",
      body: [
        "GOOSE (Generic Object Oriented Substation Event) messages carry trips, interlocks and status between IEDs. They are sent as Ethernet multicast frames directly at layer 2 (EtherType 0x88B8), with no IP routing, and repeated rapidly after every change and then at a slower heartbeat so subscribers can detect a lost publisher.",
        "IEC 61850-5 puts fast trip messages in its most demanding transfer-time class (3 ms for the highest performance classes). Each GOOSE control block needs a data set, a unique APPID (0x0000–0x3FFF), a multicast MAC address in the range 01-0C-CD-01-00-00 to 01-0C-CD-01-01-FF and usually a VLAN ID and priority. Subscribers bind the received values to their own inputs through ExtRef elements in the SCD.",
      ],
    },
    {
      heading: "Sampled values and the process bus",
      body: [
        "Sampled values (SV, IEC 61850-9-2, with the instrument transformer profile in IEC 61869-9) stream digitised current and voltage samples from merging units or non-conventional instrument transformers to protection and metering IEDs. They also use layer-2 multicast (EtherType 0x88BA), with APPIDs from 0x4000 to 0x7FFF and MAC addresses from 01-0C-CD-04-00-00 to 01-0C-CD-04-01-FF.",
        "Sampled-value streams are continuous and heavy, so the process bus is usually kept separate from the station bus or segregated with VLANs, and accurate time synchronisation (typically IEEE 1588 / IEC 61850-9-3 PTP) is essential.",
      ],
    },
    {
      heading: "MMS reports for SCADA and the station HMI",
      body: [
        "Client-server communication between IEDs and the station computer or gateway uses MMS over TCP/IP (IEC 61850-8-1). Report control blocks send changes in a data set to a client: buffered reports (BRCB) keep events while the connection is down, unbuffered reports (URCB) do not. Each report control block lists which clients may use it, so a missing client entry is a common reason for an empty SCADA point.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "IEC 61850-5", scope: "Communication requirements for functions and device models, including message types and transfer-time classes." },
    { standard: "IEC 61850-6", scope: "SCL, the configuration description language, and the SSD, ICD, IID, CID, SCD and SED file types." },
    { standard: "IEC 61850-7-1 to 7-4", scope: "Principles, abstract communication services (ACSI), common data classes and logical node classes." },
    { standard: "IEC 61850-8-1", scope: "Mapping of the services to MMS (ISO 9506) over TCP/IP and of GOOSE to Ethernet (ISO/IEC 8802-3)." },
    { standard: "IEC 61850-9-2 / IEC 61869-9", scope: "Sampled values over Ethernet, and the digital interface profile for instrument transformers and merging units." },
    { standard: "IEC 61850-9-3", scope: "Precision Time Protocol profile for power utility automation." },
    { standard: "IEC 61850-10", scope: "Conformance testing of devices." },
  ],
  workflow: [
    { title: "Open the SCD (or ICD) and read the overview", body: "Check the header and history, the number of IEDs, logical devices and logical nodes, and whether the file validates without errors.", calculatorHref: SCL, calculatorName: SCL_NAME },
    { title: "Review the substation structure", body: "Confirm voltage levels, bays and equipment match the single-line diagram, and that each logical node is linked to the right primary equipment.", calculatorHref: SCL, calculatorName: SCL_NAME },
    { title: "Check communication and addressing", body: "Make sure every access point is connected to a subnetwork, IP addresses are unique and in the subnet, and every GOOSE and SV control block has a unique APPID and MAC address.", calculatorHref: SCL, calculatorName: SCL_NAME },
    { title: "Trace the data flows", body: "For each GOOSE and SV publication, confirm the data set contents and that every subscriber's inputs (ExtRef) point to an existing publisher and attribute. Check report clients for SCADA.", calculatorHref: SCL, calculatorName: SCL_NAME },
    { title: "Correct, compare and export", body: "Fix errors, compare the result with the previous version so only intended changes remain, then export the SCD and the CID files for the vendors' tools.", calculatorHref: SCL, calculatorName: SCL_NAME },
  ],
  commonMistakes: [
    { mistake: "Duplicate GOOSE or SV APPIDs or MAC addresses", whyItMatters: "Subscribers may accept the wrong stream or reject both, and a mis-addressed multicast stream can flood parts of the network that were never meant to carry it." },
    { mistake: "Subscriber inputs (ExtRef) pointing to signals that no longer exist", whyItMatters: "After an IED is renamed or its data set changed, the subscriber silently loses the signal; an interlock or intertrip that looks configured never arrives." },
    { mistake: "Editing a CID directly and not the SCD", whyItMatters: "The device then differs from the system file, and the next CID regenerated from the SCD overwrites the fix." },
    { mistake: "Mixing editions without checking", whyItMatters: "An IED that only supports Edition 1 may reject a CID containing Edition 2 attributes." },
    { mistake: "Missing report clients", whyItMatters: "SCADA points stay empty because the gateway is not listed as a client of the report control block." },
  ],
  faqs: [
    { q: "What does SCD stand for?", a: "Substation Configuration Description: the SCL file describing the complete substation automation system, including all IEDs, the network and the data flows between them." },
    { q: "Do I need vendor software to view an SCD file?", a: "No. Any SCL file can be viewed with a general SCL tool such as SCL Studio on this site. Vendor tools are still needed to load configurations into their own IEDs." },
    { q: "What is the difference between GOOSE and MMS?", a: "GOOSE is fast, multicast, layer-2 peer-to-peer messaging between IEDs for trips and interlocks. MMS is client-server communication over TCP/IP, used by SCADA and HMIs for reports, control and file transfer." },
  ],
};
