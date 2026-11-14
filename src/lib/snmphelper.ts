// SNMP helper: OID decoder for the MIBs a substation engineer meets (MIB-II
// system and interfaces, IF-MIB, EtherLike, BRIDGE, Q-BRIDGE, LLDP, ENTITY,
// HOST-RESOURCES, standard traps), an snmpwalk interface analyser and an
// SNMPv3 settings explainer.

export interface OidDef {
  oid: string;
  name: string;
  mib: string;
  desc: string;
  table?: boolean; // the OID is a column: instance (index) follows
}

export const OIDS: OidDef[] = [
  { oid: "1.3.6.1.2.1.1.1", name: "sysDescr", mib: "SNMPv2-MIB", desc: "Text description of the device: model, firmware or software version." },
  { oid: "1.3.6.1.2.1.1.2", name: "sysObjectID", mib: "SNMPv2-MIB", desc: "The vendor's identifier of the device type (under 1.3.6.1.4.1.<enterprise>)." },
  { oid: "1.3.6.1.2.1.1.3", name: "sysUpTime", mib: "SNMPv2-MIB", desc: "Time since the SNMP agent (re)started, in hundredths of a second. A small value means the device restarted recently." },
  { oid: "1.3.6.1.2.1.1.4", name: "sysContact", mib: "SNMPv2-MIB", desc: "Contact person, as configured." },
  { oid: "1.3.6.1.2.1.1.5", name: "sysName", mib: "SNMPv2-MIB", desc: "Device name, as configured." },
  { oid: "1.3.6.1.2.1.1.6", name: "sysLocation", mib: "SNMPv2-MIB", desc: "Location, as configured (panel, room)." },
  { oid: "1.3.6.1.2.1.1.7", name: "sysServices", mib: "SNMPv2-MIB", desc: "Layers the device works at (2 = bridge/switch, 3 = router …), as a bit sum." },
  { oid: "1.3.6.1.2.1.2.1", name: "ifNumber", mib: "IF-MIB", desc: "Number of interfaces." },
  { oid: "1.3.6.1.2.1.2.2.1.1", name: "ifIndex", mib: "IF-MIB", desc: "Interface number used as the index of every interface table.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.2", name: "ifDescr", mib: "IF-MIB", desc: "Interface description (port name).", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.3", name: "ifType", mib: "IF-MIB", desc: "Interface type (6 = Ethernet, 24 = loopback, 53 = virtual, 161 = link aggregate …).", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.4", name: "ifMtu", mib: "IF-MIB", desc: "Largest frame the interface sends, in bytes.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.5", name: "ifSpeed", mib: "IF-MIB", desc: "Speed in bit/s (saturates at 4 294 967 295 for 10 Gb/s and above; use ifHighSpeed).", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.6", name: "ifPhysAddress", mib: "IF-MIB", desc: "MAC address of the interface.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.7", name: "ifAdminStatus", mib: "IF-MIB", desc: "Configured state: 1 up, 2 down (shut down), 3 testing.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.8", name: "ifOperStatus", mib: "IF-MIB", desc: "Actual state: 1 up, 2 down, 3 testing, 5 dormant, 6 not present, 7 lower layer down.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.9", name: "ifLastChange", mib: "IF-MIB", desc: "sysUpTime value when the interface last changed state.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.10", name: "ifInOctets", mib: "IF-MIB", desc: "Bytes received (32-bit counter; wraps quickly on fast links).", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.11", name: "ifInUcastPkts", mib: "IF-MIB", desc: "Unicast packets received.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.13", name: "ifInDiscards", mib: "IF-MIB", desc: "Received packets dropped although received without errors (buffer full, filtered).", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.14", name: "ifInErrors", mib: "IF-MIB", desc: "Received packets with errors (CRC, alignment): a cabling, SFP or duplex problem.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.15", name: "ifInUnknownProtos", mib: "IF-MIB", desc: "Received packets of an unknown protocol.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.16", name: "ifOutOctets", mib: "IF-MIB", desc: "Bytes sent (32-bit counter).", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.17", name: "ifOutUcastPkts", mib: "IF-MIB", desc: "Unicast packets sent.", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.19", name: "ifOutDiscards", mib: "IF-MIB", desc: "Packets dropped before sending (queue full: congestion).", table: true },
  { oid: "1.3.6.1.2.1.2.2.1.20", name: "ifOutErrors", mib: "IF-MIB", desc: "Packets that could not be sent because of errors.", table: true },
  { oid: "1.3.6.1.2.1.31.1.1.1.1", name: "ifName", mib: "IF-MIB", desc: "Short interface name (e.g. Gi1/0/3, port 3).", table: true },
  { oid: "1.3.6.1.2.1.31.1.1.1.2", name: "ifInMulticastPkts", mib: "IF-MIB", desc: "Multicast packets received (GOOSE, SV, PTP count here).", table: true },
  { oid: "1.3.6.1.2.1.31.1.1.1.3", name: "ifInBroadcastPkts", mib: "IF-MIB", desc: "Broadcast packets received.", table: true },
  { oid: "1.3.6.1.2.1.31.1.1.1.4", name: "ifOutMulticastPkts", mib: "IF-MIB", desc: "Multicast packets sent.", table: true },
  { oid: "1.3.6.1.2.1.31.1.1.1.5", name: "ifOutBroadcastPkts", mib: "IF-MIB", desc: "Broadcast packets sent.", table: true },
  { oid: "1.3.6.1.2.1.31.1.1.1.6", name: "ifHCInOctets", mib: "IF-MIB", desc: "Bytes received (64-bit counter — use this one for traffic rates).", table: true },
  { oid: "1.3.6.1.2.1.31.1.1.1.10", name: "ifHCOutOctets", mib: "IF-MIB", desc: "Bytes sent (64-bit counter).", table: true },
  { oid: "1.3.6.1.2.1.31.1.1.1.15", name: "ifHighSpeed", mib: "IF-MIB", desc: "Speed in Mb/s.", table: true },
  { oid: "1.3.6.1.2.1.31.1.1.1.18", name: "ifAlias", mib: "IF-MIB", desc: "Port description configured by the administrator (often the connected device).", table: true },
  { oid: "1.3.6.1.2.1.10.7.2.1.19", name: "dot3StatsDuplexStatus", mib: "EtherLike-MIB", desc: "Duplex: 1 unknown, 2 half duplex, 3 full duplex. Half duplex on a switch port to an IED usually means a negotiation mismatch.", table: true },
  { oid: "1.3.6.1.2.1.10.7.2.1.3", name: "dot3StatsFCSErrors", mib: "EtherLike-MIB", desc: "Frames received with a bad checksum (CRC): cable, connector, SFP or interference.", table: true },
  { oid: "1.3.6.1.2.1.10.7.2.1.8", name: "dot3StatsLateCollisions", mib: "EtherLike-MIB", desc: "Late collisions: the classic sign of a duplex mismatch.", table: true },
  { oid: "1.3.6.1.2.1.4.20.1.1", name: "ipAdEntAddr", mib: "IP-MIB", desc: "IP addresses of the device.", table: true },
  { oid: "1.3.6.1.2.1.4.20.1.3", name: "ipAdEntNetMask", mib: "IP-MIB", desc: "Subnet mask of each address.", table: true },
  { oid: "1.3.6.1.2.1.4.22.1.2", name: "ipNetToMediaPhysAddress", mib: "IP-MIB", desc: "The device's ARP table: MAC address for each IP.", table: true },
  { oid: "1.3.6.1.2.1.17.1.4.1.2", name: "dot1dBasePortIfIndex", mib: "BRIDGE-MIB", desc: "Maps bridge port numbers to ifIndex.", table: true },
  { oid: "1.3.6.1.2.1.17.2.3", name: "dot1dStpTimeSinceTopologyChange", mib: "BRIDGE-MIB", desc: "Time since the last spanning-tree topology change (hundredths of a second)." },
  { oid: "1.3.6.1.2.1.17.2.4", name: "dot1dStpTopChanges", mib: "BRIDGE-MIB", desc: "Number of spanning-tree topology changes. A rising count means links or devices are flapping, which flushes MAC tables and floods traffic." },
  { oid: "1.3.6.1.2.1.17.2.5", name: "dot1dStpDesignatedRoot", mib: "BRIDGE-MIB", desc: "The current spanning-tree root bridge." },
  { oid: "1.3.6.1.2.1.17.2.7", name: "dot1dStpRootPort", mib: "BRIDGE-MIB", desc: "The port towards the root bridge." },
  { oid: "1.3.6.1.2.1.17.4.3.1.1", name: "dot1dTpFdbAddress", mib: "BRIDGE-MIB", desc: "MAC address table: learned MAC addresses.", table: true },
  { oid: "1.3.6.1.2.1.17.4.3.1.2", name: "dot1dTpFdbPort", mib: "BRIDGE-MIB", desc: "MAC address table: the bridge port where each MAC was learned.", table: true },
  { oid: "1.3.6.1.2.1.17.7.1.4.3.1.1", name: "dot1qVlanStaticName", mib: "Q-BRIDGE-MIB", desc: "VLAN names.", table: true },
  { oid: "1.3.6.1.2.1.17.7.1.4.3.1.2", name: "dot1qVlanStaticEgressPorts", mib: "Q-BRIDGE-MIB", desc: "Ports that are members of each VLAN (bit map).", table: true },
  { oid: "1.3.6.1.2.1.17.7.1.4.3.1.4", name: "dot1qVlanStaticUntaggedPorts", mib: "Q-BRIDGE-MIB", desc: "Ports that send each VLAN untagged (bit map).", table: true },
  { oid: "1.3.6.1.2.1.17.7.1.4.5.1.1", name: "dot1qPvid", mib: "Q-BRIDGE-MIB", desc: "Untagged (native) VLAN of each port.", table: true },
  { oid: "1.0.8802.1.1.2.1.4.1.1.5", name: "lldpRemChassisId", mib: "LLDP-MIB", desc: "Neighbour's chassis ID (usually its MAC address).", table: true },
  { oid: "1.0.8802.1.1.2.1.4.1.1.7", name: "lldpRemPortId", mib: "LLDP-MIB", desc: "Neighbour's port ID.", table: true },
  { oid: "1.0.8802.1.1.2.1.4.1.1.8", name: "lldpRemPortDesc", mib: "LLDP-MIB", desc: "Neighbour's port description.", table: true },
  { oid: "1.0.8802.1.1.2.1.4.1.1.9", name: "lldpRemSysName", mib: "LLDP-MIB", desc: "Neighbour's system name — who is connected to each port.", table: true },
  { oid: "1.0.8802.1.1.2.1.4.1.1.10", name: "lldpRemSysDesc", mib: "LLDP-MIB", desc: "Neighbour's system description.", table: true },
  { oid: "1.3.6.1.2.1.47.1.1.1.1.2", name: "entPhysicalDescr", mib: "ENTITY-MIB", desc: "Description of each hardware component.", table: true },
  { oid: "1.3.6.1.2.1.47.1.1.1.1.7", name: "entPhysicalName", mib: "ENTITY-MIB", desc: "Name of each component.", table: true },
  { oid: "1.3.6.1.2.1.47.1.1.1.1.8", name: "entPhysicalHardwareRev", mib: "ENTITY-MIB", desc: "Hardware revision.", table: true },
  { oid: "1.3.6.1.2.1.47.1.1.1.1.9", name: "entPhysicalFirmwareRev", mib: "ENTITY-MIB", desc: "Firmware revision — for the asset register.", table: true },
  { oid: "1.3.6.1.2.1.47.1.1.1.1.10", name: "entPhysicalSoftwareRev", mib: "ENTITY-MIB", desc: "Software revision.", table: true },
  { oid: "1.3.6.1.2.1.47.1.1.1.1.11", name: "entPhysicalSerialNum", mib: "ENTITY-MIB", desc: "Serial number — for the asset register.", table: true },
  { oid: "1.3.6.1.2.1.47.1.1.1.1.12", name: "entPhysicalMfgName", mib: "ENTITY-MIB", desc: "Manufacturer name.", table: true },
  { oid: "1.3.6.1.2.1.47.1.1.1.1.13", name: "entPhysicalModelName", mib: "ENTITY-MIB", desc: "Model name.", table: true },
  { oid: "1.3.6.1.2.1.25.1.1", name: "hrSystemUptime", mib: "HOST-RESOURCES-MIB", desc: "Time since the host (not only the agent) started." },
  { oid: "1.3.6.1.2.1.25.2.3.1.3", name: "hrStorageDescr", mib: "HOST-RESOURCES-MIB", desc: "Storage (disk, memory) description.", table: true },
  { oid: "1.3.6.1.2.1.25.2.3.1.4", name: "hrStorageAllocationUnits", mib: "HOST-RESOURCES-MIB", desc: "Size of one allocation unit in bytes.", table: true },
  { oid: "1.3.6.1.2.1.25.2.3.1.5", name: "hrStorageSize", mib: "HOST-RESOURCES-MIB", desc: "Size in allocation units.", table: true },
  { oid: "1.3.6.1.2.1.25.2.3.1.6", name: "hrStorageUsed", mib: "HOST-RESOURCES-MIB", desc: "Used space in allocation units.", table: true },
  { oid: "1.3.6.1.2.1.25.3.3.1.2", name: "hrProcessorLoad", mib: "HOST-RESOURCES-MIB", desc: "Average load of each processor over the last minute, in %.", table: true },
  { oid: "1.3.6.1.6.3.1.1.4.1", name: "snmpTrapOID", mib: "SNMPv2-MIB", desc: "In a trap or inform: which trap it is." },
  { oid: "1.3.6.1.6.3.1.1.5.1", name: "coldStart", mib: "SNMPv2-MIB (trap)", desc: "Trap: the agent restarted and its configuration may have changed (device power-up)." },
  { oid: "1.3.6.1.6.3.1.1.5.2", name: "warmStart", mib: "SNMPv2-MIB (trap)", desc: "Trap: the agent restarted without configuration change." },
  { oid: "1.3.6.1.6.3.1.1.5.3", name: "linkDown", mib: "IF-MIB (trap)", desc: "Trap: an interface went down (carries ifIndex, ifAdminStatus, ifOperStatus)." },
  { oid: "1.3.6.1.6.3.1.1.5.4", name: "linkUp", mib: "IF-MIB (trap)", desc: "Trap: an interface came up." },
  { oid: "1.3.6.1.6.3.1.1.5.5", name: "authenticationFailure", mib: "SNMPv2-MIB (trap)", desc: "Trap: a request used a wrong community or credentials — a misconfigured manager, or someone probing." },
];

/** Private enterprise numbers (IANA) of vendors often met in substations and IT. */
export const ENTERPRISES: Record<number, string> = { 9: "Cisco", 11: "Hewlett-Packard", 248: "Hirschmann", 311: "Microsoft", 674: "Dell", 2011: "Huawei", 2636: "Juniper", 4329: "Siemens", 8072: "Net-SNMP", 8691: "Moxa", 12356: "Fortinet", 25461: "Palo Alto Networks" };

export function normOid(s: string): string {
  return String(s || "").trim().replace(/^iso/i, "1").replace(/^\./, "");
}

export function decodeOid(input: string): { def: OidDef | null; instance: string; enterprise: string | null; note: string } {
  const o = normOid(input);
  if (!/^\d+(\.\d+)*$/.test(o)) return { def: null, instance: "", enterprise: null, note: "Not a numeric OID (use dotted numbers, e.g. 1.3.6.1.2.1.2.2.1.8.3)." };
  let best: OidDef | null = null;
  for (const d of OIDS) if ((o === d.oid || o.startsWith(d.oid + ".")) && (!best || d.oid.length > best.oid.length)) best = d;
  const ent = o.match(/^1\.3\.6\.1\.4\.1\.(\d+)/);
  const enterprise = ent ? ENTERPRISES[+ent[1]] ?? `enterprise ${ent[1]} (look it up in the IANA private enterprise numbers registry)` : null;
  const instance = best && o.length > best.oid.length ? o.slice(best.oid.length + 1) : "";
  let note = "";
  if (best) note = instance === "0" ? "Instance .0: a single (scalar) value." : instance ? (best.table ? `Instance ${instance}: the row index (for interface tables, the ifIndex).` : `Suffix ${instance}.`) : "";
  else if (enterprise) note = `A vendor-specific (private) OID of ${enterprise}. Its meaning is in that vendor's MIB file.`;
  else note = "Not in the list of common OIDs.";
  return { def: best, instance, enterprise, note };
}

export function fmtTicks(t: number): string {
  const s = Math.floor(t / 100), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return `${d} d ${h} h ${m} min ${s % 60} s`;
}

// --------------------------------------------------------------- snmpwalk analysis
export interface WalkLine {
  oid: string;
  name: string;
  index: string;
  type: string;
  value: string;
}

const BY_NAME = new Map(OIDS.map((d) => [d.name, d]));

export function parseWalk(text: string): WalkLine[] {
  const out: WalkLine[] = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) continue;
    let m = l.match(/^([A-Za-z0-9-]+)::([A-Za-z0-9]+)\.?([\d.]*)\s*=\s*(?:([A-Za-z0-9 -]+):\s*)?(.*)$/);
    if (m) {
      const d = BY_NAME.get(m[2]);
      out.push({ oid: d ? d.oid + (m[3] ? "." + m[3] : "") : "", name: m[2], index: m[3] || "", type: (m[4] || "").trim(), value: m[5].trim() });
      continue;
    }
    m = l.match(/^((?:iso|\.?1)(?:\.\d+)+)\s*=\s*(?:([A-Za-z0-9 -]+):\s*)?(.*)$/i);
    if (m) {
      const o = normOid(m[1]);
      const dec = decodeOid(o);
      out.push({ oid: o, name: dec.def?.name ?? "", index: dec.instance, type: (m[2] || "").trim(), value: m[3].trim() });
    }
  }
  return out;
}

const num = (v: string) => {
  const m = String(v).match(/-?\d+/);
  return m ? Number(m[0]) : NaN;
};
const enumv = (v: string) => {
  const m = String(v).match(/\((\d+)\)/);
  return m ? +m[1] : num(v);
};
const strv = (v: string) => String(v).replace(/^"|"$/g, "");

export interface IfRow {
  index: string;
  name: string;
  alias: string;
  speedMb: number | null;
  admin: number | null;
  oper: number | null;
  inErr: number;
  outErr: number;
  inDisc: number;
  outDisc: number;
  fcs: number;
  late: number;
  duplex: number | null;
  inOct: number | null;
  outOct: number | null;
}

export interface WalkResult {
  sys: { label: string; value: string }[];
  ifs: IfRow[];
  lldp: { local: string; name: string; port: string }[];
  findings: { sev: "error" | "warning" | "info" | "ok"; text: string }[];
  unknown: number;
}

export function analyseWalk(text: string): WalkResult {
  const L = parseWalk(text);
  const sys: { label: string; value: string }[] = [];
  const ifs = new Map<string, IfRow>();
  const row = (i: string) => {
    if (!ifs.has(i)) ifs.set(i, { index: i, name: "", alias: "", speedMb: null, admin: null, oper: null, inErr: 0, outErr: 0, inDisc: 0, outDisc: 0, fcs: 0, late: 0, duplex: null, inOct: null, outOct: null });
    return ifs.get(i)!;
  };
  const lldpMap = new Map<string, { local: string; name: string; port: string }>();
  let unknown = 0;
  let topo: number | null = null;
  for (const w of L) {
    const i = w.index;
    switch (w.name) {
      case "sysDescr": case "sysName": case "sysLocation": case "sysContact": case "sysObjectID": sys.push({ label: w.name, value: strv(w.value) }); break;
      case "sysUpTime": { const m = w.value.match(/\((\d+)\)/); sys.push({ label: "sysUpTime", value: m ? fmtTicks(+m[1]) : w.value }); break; }
      case "ifDescr": if (!row(i).name) row(i).name = strv(w.value); break;
      case "ifName": row(i).name = strv(w.value); break;
      case "ifAlias": row(i).alias = strv(w.value); break;
      case "ifSpeed": if (row(i).speedMb == null) row(i).speedMb = num(w.value) / 1e6; break;
      case "ifHighSpeed": row(i).speedMb = num(w.value); break;
      case "ifAdminStatus": row(i).admin = enumv(w.value); break;
      case "ifOperStatus": row(i).oper = enumv(w.value); break;
      case "ifInErrors": row(i).inErr = num(w.value); break;
      case "ifOutErrors": row(i).outErr = num(w.value); break;
      case "ifInDiscards": row(i).inDisc = num(w.value); break;
      case "ifOutDiscards": row(i).outDisc = num(w.value); break;
      case "dot3StatsFCSErrors": row(i).fcs = num(w.value); break;
      case "dot3StatsLateCollisions": row(i).late = num(w.value); break;
      case "dot3StatsDuplexStatus": row(i).duplex = enumv(w.value); break;
      case "ifHCInOctets": row(i).inOct = num(w.value); break;
      case "ifHCOutOctets": row(i).outOct = num(w.value); break;
      case "ifInOctets": if (row(i).inOct == null) row(i).inOct = num(w.value); break;
      case "ifOutOctets": if (row(i).outOct == null) row(i).outOct = num(w.value); break;
      case "dot1dStpTopChanges": topo = num(w.value); break;
      case "lldpRemSysName": case "lldpRemPortId": case "lldpRemPortDesc": {
        const parts = i.split("."), local = parts[1] ?? i; // index = timeMark.localPortNum.remIndex
        const e = lldpMap.get(local) ?? { local, name: "", port: "" };
        if (w.name === "lldpRemSysName") e.name = strv(w.value);
        else if (!e.port || w.name === "lldpRemPortDesc") e.port = strv(w.value);
        lldpMap.set(local, e);
        break;
      }
      default: if (!w.name) unknown++;
    }
  }
  const F: WalkResult["findings"] = [];
  const list = [...ifs.values()].filter((r) => r.name || r.oper != null).sort((a, b) => +a.index - +b.index);
  for (const r of list) {
    const n = r.name || `ifIndex ${r.index}`;
    if (r.admin === 1 && r.oper === 2) F.push({ sev: "warning", text: `${n}${r.alias ? ` (${r.alias})` : ""}: enabled but down — no link. Expected if nothing is connected; a fault if a device should be there.` });
    if (r.inErr > 0 || r.fcs > 0) F.push({ sev: "warning", text: `${n}: ${Math.max(r.inErr, r.fcs)} receive errors (CRC/FCS). Check the cable, connectors or SFP and the duplex setting. Counters are totals since the last reset — read them twice, some minutes apart, to see whether they are still rising.` });
    if (r.late > 0 || r.duplex === 2) F.push({ sev: "error", text: `${n}: ${r.duplex === 2 ? "half duplex" : ""}${r.late > 0 ? `${r.duplex === 2 ? ", " : ""}${r.late} late collisions` : ""} — a duplex mismatch. Set both ends to auto-negotiation (or both to the same fixed speed and duplex).` });
    if (r.outDisc > 0) F.push({ sev: "info", text: `${n}: ${r.outDisc} output discards — the port's queue overflowed (congestion or bursts, for example sampled values or a GOOSE avalanche).` });
    if (r.speedMb != null && r.speedMb > 0 && r.speedMb < 100 && r.oper === 1) F.push({ sev: "warning", text: `${n}: running at ${r.speedMb} Mb/s. A 10 Mb/s link to an IED or switch usually means a negotiation problem or a damaged cable pair.` });
  }
  if (topo != null && topo > 0) F.push({ sev: topo > 100 ? "warning" : "info", text: `Spanning tree has changed topology ${topo} times since the switch started. Frequent changes flush MAC tables and flood traffic; look for a flapping port or a device that bridges two ports.` });
  if (!F.length && list.length) F.push({ sev: "ok", text: "No errors, discards, duplex or link problems in the counters read." });
  return { sys, ifs: list, lldp: [...lldpMap.values()], findings: F, unknown };
}

export const SAMPLE_WALK = `SNMPv2-MIB::sysDescr.0 = STRING: Industrial Ethernet switch, 8 ports, firmware 6.2
SNMPv2-MIB::sysUpTime.0 = Timeticks: (25920000) 3 days, 0:00:00.00
SNMPv2-MIB::sysName.0 = STRING: SW2
SNMPv2-MIB::sysLocation.0 = STRING: Control building, panel +S03
IF-MIB::ifName.1 = STRING: port1
IF-MIB::ifName.2 = STRING: port2
IF-MIB::ifName.3 = STRING: port3
IF-MIB::ifName.4 = STRING: port4
IF-MIB::ifName.8 = STRING: port8
IF-MIB::ifAlias.1 = STRING: GW1
IF-MIB::ifAlias.2 = STRING: HMI1
IF-MIB::ifAlias.3 = STRING: GPS1
IF-MIB::ifAlias.4 = STRING: BCU_J01
IF-MIB::ifAlias.8 = STRING: Uplink SW1
IF-MIB::ifHighSpeed.1 = Gauge32: 100
IF-MIB::ifHighSpeed.2 = Gauge32: 100
IF-MIB::ifHighSpeed.3 = Gauge32: 100
IF-MIB::ifHighSpeed.4 = Gauge32: 10
IF-MIB::ifHighSpeed.8 = Gauge32: 1000
IF-MIB::ifAdminStatus.1 = INTEGER: up(1)
IF-MIB::ifAdminStatus.2 = INTEGER: up(1)
IF-MIB::ifAdminStatus.3 = INTEGER: up(1)
IF-MIB::ifAdminStatus.4 = INTEGER: up(1)
IF-MIB::ifAdminStatus.8 = INTEGER: up(1)
IF-MIB::ifOperStatus.1 = INTEGER: up(1)
IF-MIB::ifOperStatus.2 = INTEGER: down(2)
IF-MIB::ifOperStatus.3 = INTEGER: up(1)
IF-MIB::ifOperStatus.4 = INTEGER: up(1)
IF-MIB::ifOperStatus.8 = INTEGER: up(1)
IF-MIB::ifInErrors.1 = Counter32: 0
IF-MIB::ifInErrors.4 = Counter32: 1843
IF-MIB::ifInErrors.8 = Counter32: 0
IF-MIB::ifOutDiscards.8 = Counter32: 212
IF-MIB::ifHCInOctets.1 = Counter64: 412339120
IF-MIB::ifHCInOctets.3 = Counter64: 9120330
IF-MIB::ifHCInOctets.4 = Counter64: 71200455
IF-MIB::ifHCInOctets.8 = Counter64: 88412907551
IF-MIB::ifHCOutOctets.1 = Counter64: 1203348810
IF-MIB::ifHCOutOctets.3 = Counter64: 30551204
IF-MIB::ifHCOutOctets.4 = Counter64: 190220771
IF-MIB::ifHCOutOctets.8 = Counter64: 61007215302
EtherLike-MIB::dot3StatsDuplexStatus.4 = INTEGER: halfDuplex(2)
EtherLike-MIB::dot3StatsLateCollisions.4 = Counter32: 37
BRIDGE-MIB::dot1dStpTopChanges.0 = Counter32: 14`;

/** The same switch read again 5 minutes later (for the two-reading comparison). */
export const SAMPLE_WALK_2 = `SNMPv2-MIB::sysDescr.0 = STRING: Industrial Ethernet switch, 8 ports, firmware 6.2
SNMPv2-MIB::sysUpTime.0 = Timeticks: (25950000) 3 days, 0:05:00.00
SNMPv2-MIB::sysName.0 = STRING: SW2
IF-MIB::ifName.1 = STRING: port1
IF-MIB::ifName.2 = STRING: port2
IF-MIB::ifName.3 = STRING: port3
IF-MIB::ifName.4 = STRING: port4
IF-MIB::ifName.8 = STRING: port8
IF-MIB::ifAlias.1 = STRING: GW1
IF-MIB::ifAlias.2 = STRING: HMI1
IF-MIB::ifAlias.3 = STRING: GPS1
IF-MIB::ifAlias.4 = STRING: BCU_J01
IF-MIB::ifAlias.8 = STRING: Uplink SW1
IF-MIB::ifHighSpeed.1 = Gauge32: 100
IF-MIB::ifHighSpeed.2 = Gauge32: 100
IF-MIB::ifHighSpeed.3 = Gauge32: 100
IF-MIB::ifHighSpeed.4 = Gauge32: 10
IF-MIB::ifHighSpeed.8 = Gauge32: 1000
IF-MIB::ifAdminStatus.1 = INTEGER: up(1)
IF-MIB::ifAdminStatus.2 = INTEGER: up(1)
IF-MIB::ifAdminStatus.3 = INTEGER: up(1)
IF-MIB::ifAdminStatus.4 = INTEGER: up(1)
IF-MIB::ifAdminStatus.8 = INTEGER: up(1)
IF-MIB::ifOperStatus.1 = INTEGER: up(1)
IF-MIB::ifOperStatus.2 = INTEGER: down(2)
IF-MIB::ifOperStatus.3 = INTEGER: down(2)
IF-MIB::ifOperStatus.4 = INTEGER: up(1)
IF-MIB::ifOperStatus.8 = INTEGER: up(1)
IF-MIB::ifInErrors.1 = Counter32: 0
IF-MIB::ifInErrors.4 = Counter32: 2068
IF-MIB::ifInErrors.8 = Counter32: 0
IF-MIB::ifOutDiscards.8 = Counter32: 212
IF-MIB::ifHCInOctets.1 = Counter64: 418339120
IF-MIB::ifHCInOctets.3 = Counter64: 9120330
IF-MIB::ifHCInOctets.4 = Counter64: 71850455
IF-MIB::ifHCInOctets.8 = Counter64: 90412907551
IF-MIB::ifHCOutOctets.1 = Counter64: 1599348810
IF-MIB::ifHCOutOctets.3 = Counter64: 30551204
IF-MIB::ifHCOutOctets.4 = Counter64: 193220771
IF-MIB::ifHCOutOctets.8 = Counter64: 91007215302
EtherLike-MIB::dot3StatsDuplexStatus.4 = INTEGER: halfDuplex(2)
EtherLike-MIB::dot3StatsLateCollisions.4 = Counter32: 41
BRIDGE-MIB::dot1dStpTopChanges.0 = Counter32: 15`;

// --------------------------------------------------------------- two readings: rates
export interface DeltaRow {
  index: string;
  name: string;
  alias: string;
  speedMb: number | null;
  operA: number | null;
  operB: number | null;
  dInErr: number | null;
  dOutErr: number | null;
  dInDisc: number | null;
  dOutDisc: number | null;
  dLate: number | null;
  inMbps: number | null;
  outMbps: number | null;
  utilPct: number | null;
}
export interface DeltaResult {
  seconds: number;
  source: "sysUpTime" | "entered" | "none";
  restarted: boolean;
  rows: DeltaRow[];
  findings: { sev: "error" | "warning" | "info" | "ok"; text: string }[];
}

const ticks = (text: string) => {
  const w = parseWalk(text).find((x) => x.name === "sysUpTime");
  const m = w?.value.match(/\((\d+)\)/);
  return m ? +m[1] : null;
};

/**
 * Compare two snmpwalk readings of the same device. The interval is taken from
 * sysUpTime when both readings have it, otherwise from enteredSeconds.
 * 32-bit counters (ifInOctets/ifOutOctets, error counters) that went backwards
 * are treated as one wrap at 2^32; 64-bit counters that went backwards mean a reset.
 */
export function compareWalks(a: string, b: string, enteredSeconds = 0): DeltaResult {
  const A = analyseWalk(a), B = analyseWalk(b);
  const ta = ticks(a), tb = ticks(b);
  let seconds = enteredSeconds > 0 ? enteredSeconds : 0, source: DeltaResult["source"] = enteredSeconds > 0 ? "entered" : "none";
  let restarted = false;
  if (ta != null && tb != null) {
    if (tb < ta) restarted = true;
    else if (tb > ta) { seconds = (tb - ta) / 100; source = "sysUpTime"; }
  }
  const hcA = new Set(parseWalk(a).filter((x) => /^ifHC/.test(x.name)).map((x) => x.index));
  const F: DeltaResult["findings"] = [];
  if (restarted) F.push({ sev: "warning", text: "sysUpTime is lower in the second reading: the device (or its SNMP agent) restarted between the readings, so the counters started again from zero. Take two new readings." });
  if (!seconds && !restarted) F.push({ sev: "info", text: "No interval: sysUpTime is missing in one reading and no interval was entered. Changes are shown as counts, without rates." });
  const d32 = (x: number, y: number) => (y >= x ? y - x : y + 2 ** 32 - x);
  const rows: DeltaRow[] = [];
  for (const rb of B.ifs) {
    const ra = A.ifs.find((r) => r.index === rb.index);
    if (!ra) continue;
    const dc = (x: number, y: number) => (restarted ? null : d32(x, y));
    const oct = (x: number | null, y: number | null) => {
      if (restarted || x == null || y == null) return null;
      if (y >= x) return y - x;
      return hcA.has(rb.index) ? null : d32(x, y);
    };
    const dIn = oct(ra.inOct, rb.inOct), dOut = oct(ra.outOct, rb.outOct);
    const inMbps = dIn != null && seconds ? (dIn * 8) / seconds / 1e6 : null, outMbps = dOut != null && seconds ? (dOut * 8) / seconds / 1e6 : null;
    const sp = rb.speedMb ?? ra.speedMb;
    const utilPct = sp && (inMbps != null || outMbps != null) ? (100 * Math.max(inMbps ?? 0, outMbps ?? 0)) / sp : null;
    const r: DeltaRow = { index: rb.index, name: rb.name || ra.name, alias: rb.alias || ra.alias, speedMb: sp, operA: ra.oper, operB: rb.oper, dInErr: dc(Math.max(ra.inErr, ra.fcs), Math.max(rb.inErr, rb.fcs)), dOutErr: dc(ra.outErr, rb.outErr), dInDisc: dc(ra.inDisc, rb.inDisc), dOutDisc: dc(ra.outDisc, rb.outDisc), dLate: dc(ra.late, rb.late), inMbps, outMbps, utilPct };
    rows.push(r);
    const n = `${r.name || "ifIndex " + r.index}${r.alias ? ` (${r.alias})` : ""}`;
    const per = (x: number) => (seconds ? ` (${((x * 60) / seconds).toFixed(x * 60 / seconds < 10 ? 1 : 0)} per minute)` : "");
    if (r.operA !== r.operB && r.operA != null && r.operB != null) F.push({ sev: "warning", text: `${n}: link state changed from ${r.operA === 1 ? "up" : "down"} to ${r.operB === 1 ? "up" : "down"} between the readings. If nobody unplugged it, look for a loose connector, a failing SFP or a device that restarted.` });
    if (r.dInErr) F.push({ sev: "error", text: `${n}: ${r.dInErr} new receive errors${per(r.dInErr)}. The fault is active now — check the cable, connectors, SFP and duplex setting.` });
    if (r.dLate) F.push({ sev: "error", text: `${n}: ${r.dLate} new late collisions — the duplex mismatch is still there.` });
    if (r.dOutDisc) F.push({ sev: "warning", text: `${n}: ${r.dOutDisc} new output discards${per(r.dOutDisc)} — the port is congested now. Find what fills it (bursts of sampled values, a GOOSE avalanche, a backup or file copy on the station bus).` });
    if (r.dInDisc) F.push({ sev: "info", text: `${n}: ${r.dInDisc} new input discards (filtered or unknown frames, or a full input buffer).` });
    if (utilPct != null && utilPct >= 70) F.push({ sev: utilPct >= 90 ? "error" : "warning", text: `${n}: average ${utilPct.toFixed(0)} % of ${sp} Mb/s over ${Math.round(seconds)} s. Peaks are higher than the average; on a station or process bus keep the average well below the line rate so a GOOSE burst still fits.` });
  }
  if (!restarted) {
    const stA = parseWalk(a).find((x) => x.name === "dot1dStpTopChanges"), stB = parseWalk(b).find((x) => x.name === "dot1dStpTopChanges");
    if (stA && stB) {
      const dt = d32(num(stA.value), num(stB.value));
      if (dt > 0) F.push({ sev: "warning", text: `Spanning tree changed topology ${dt} time${dt > 1 ? "s" : ""} between the readings. Each change flushes MAC tables and floods traffic; find the port that went up or down.` });
    }
  }
  if (!F.length && rows.length) F.push({ sev: "ok", text: `No new errors, discards or link changes in ${seconds ? Math.round(seconds) + " s" : "the interval"}.` });
  return { seconds, source, restarted, rows, findings: F };
}

// --------------------------------------------------------------- SNMPv3
export type SecLevel = "noAuthNoPriv" | "authNoPriv" | "authPriv";
export function v3Advice(level: SecLevel, auth: string, priv: string): { sev: "error" | "warning" | "ok"; text: string }[] {
  const out: { sev: "error" | "warning" | "ok"; text: string }[] = [];
  if (level === "noAuthNoPriv") out.push({ sev: "error", text: "noAuthNoPriv: no authentication and no encryption — no better than SNMPv1/v2c communities. Use authPriv." });
  if (level === "authNoPriv") out.push({ sev: "warning", text: "authNoPriv: requests are authenticated but sent in clear text; anyone on the path can read the values. Use authPriv where the device supports it." });
  if (level !== "noAuthNoPriv") {
    if (auth === "MD5") out.push({ sev: "warning", text: "MD5 authentication (HMAC-MD5-96) is the weakest option; prefer SHA-2 (SHA-256 or above, RFC 7860) or at least SHA-1." });
    else if (auth === "SHA") out.push({ sev: "ok", text: "SHA-1 (HMAC-SHA-96) is the most widely supported option; SHA-2 (RFC 7860) is stronger where both ends support it." });
    else out.push({ sev: "ok", text: `${auth} authentication (RFC 7860): strong, if both the device and the management system support it.` });
  }
  if (level === "authPriv") {
    if (priv === "DES") out.push({ sev: "warning", text: "DES privacy is obsolete; use AES-128 (RFC 3826) or stronger." });
    else out.push({ sev: "ok", text: `${priv} privacy: traffic is encrypted.` });
  }
  out.push({ sev: "ok", text: "Both ends must match exactly: user name, security level, authentication protocol and password, privacy protocol and password. A mismatch gives time-outs or 'unknown user name' / 'wrong digest' errors and often an authenticationFailure trap." });
  return out;
}
