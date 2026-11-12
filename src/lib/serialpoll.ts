// Serial line and polling cycle calculator: character time from the UART
// framing, the Modbus RTU inter-frame gaps, and the time to poll N devices over
// a serial, radio or WAN link, compared with the scan time the SCADA needs.

export type Parity = "none" | "even" | "odd";
export type ProtocolKey = "modbus" | "custom";

export interface SerialInput {
  baud: number;
  dataBits: 7 | 8;
  parity: Parity;
  stopBits: 1 | 2;
  protocol: ProtocolKey;
  registers: number; // Modbus: registers read per poll (function 03/04)
  reqBytes: number; // custom: request frame bytes
  respBytes: number; // custom: response frame bytes
  devices: number;
  pollsPerDevice: number; // requests per device per cycle
  turnaroundMs: number; // device response (processing) time
  linkDelayMs: number; // extra one-way delay of radio / modem / WAN link, each direction
  requiredScanS: number; // the scan time the SCADA needs
  retries: number; // timed-out polls allowed per cycle (offline devices)
  timeoutMs: number; // response time-out per poll
}

export const SERIAL_DEFAULTS: SerialInput = { baud: 9600, dataBits: 8, parity: "even", stopBits: 1, protocol: "modbus", registers: 20, reqBytes: 8, respBytes: 45, devices: 12, pollsPerDevice: 2, turnaroundMs: 20, linkDelayMs: 0, requiredScanS: 2, retries: 0, timeoutMs: 500 };

export interface SerialResult {
  bitsPerChar: number;
  charMs: number;
  t15Ms: number; // Modbus RTU inter-character limit (1.5 characters, 0.75 ms fixed above 19200 baud)
  t35Ms: number; // Modbus RTU inter-frame gap (3.5 characters, 1.75 ms fixed above 19200 baud)
  reqBytes: number;
  respBytes: number;
  reqMs: number;
  respMs: number;
  transactionMs: number;
  cycleMs: number;
  updatesPerSecond: number;
  utilisationPct: number; // share of the cycle spent sending bits
  meetsScan: boolean;
  notes: string[];
}

export function calcSerial(i: SerialInput): SerialResult {
  const notes: string[] = [];
  const bitsPerChar = 1 + i.dataBits + (i.parity === "none" ? 0 : 1) + i.stopBits;
  const charMs = (bitsPerChar / i.baud) * 1000;
  const fixed = i.baud > 19200;
  const t15Ms = fixed ? 0.75 : 1.5 * charMs;
  const t35Ms = fixed ? 1.75 : 3.5 * charMs;
  if (i.protocol === "modbus" && bitsPerChar !== 11) notes.push(`Modbus RTU specifies 11 bits per character (1 start, 8 data, parity, 1 stop — or 2 stop bits without parity). This framing has ${bitsPerChar}; both ends must still match.`);
  const reqBytes = i.protocol === "modbus" ? 8 : i.reqBytes; // address, function, start (2), quantity (2), CRC (2)
  const respBytes = i.protocol === "modbus" ? 5 + 2 * i.registers : i.respBytes; // address, function, byte count, data, CRC (2)
  if (i.protocol === "modbus" && i.registers > 125) notes.push("Function 03/04 reads at most 125 registers per request; split the poll.");
  const reqMs = reqBytes * charMs, respMs = respBytes * charMs;
  const transactionMs = reqMs + t35Ms + i.linkDelayMs + i.turnaroundMs + respMs + i.linkDelayMs + t35Ms;
  const polls = i.devices * i.pollsPerDevice;
  const cycleMs = polls * transactionMs + i.retries * (reqMs + t35Ms + i.timeoutMs);
  const updatesPerSecond = cycleMs > 0 ? 1000 / cycleMs : 0;
  const utilisationPct = cycleMs > 0 ? (100 * polls * (reqMs + respMs)) / cycleMs : 0;
  const meetsScan = cycleMs / 1000 <= i.requiredScanS;
  if (!meetsScan) notes.push(`The cycle (${(cycleMs / 1000).toFixed(2)} s) is longer than the required scan time (${i.requiredScanS} s). Raise the baud rate, read more registers per request, poll slow-changing data less often, or split the devices over more ports.`);
  if (i.retries > 0) notes.push(`Each offline device costs a full time-out (${i.timeoutMs} ms) per poll; ${i.retries} time-out(s) are included in the cycle.`);
  if (i.linkDelayMs > 0) notes.push("Radio, modem and WAN links add delay in both directions on every transaction; for many small polls this, not the baud rate, sets the cycle time.");
  if (i.baud > 115200) notes.push("Above 115 200 baud check that every device and converter supports the rate.");
  return { bitsPerChar, charMs, t15Ms, t35Ms, reqBytes, respBytes, reqMs, respMs, transactionMs, cycleMs, updatesPerSecond, utilisationPct, meetsScan, notes };
}
