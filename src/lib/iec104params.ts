// IEC 60870-5-104 link parameter checker: k, w and the timers t0–t3, checked
// against the rules and default values of IEC 60870-5-104, plus optional link
// figures (round-trip time, bit rate) to see whether t1 leaves enough time.

export interface Iec104Input {
  k: number; // max unacknowledged I-frames the sender may have outstanding
  w: number; // receiver acknowledges at the latest after w I-frames
  t0: number; // s, connection establishment time-out
  t1: number; // s, time-out of sent frames (APDU) waiting for acknowledgement
  t2: number; // s, acknowledgement time-out when no data to send
  t3: number; // s, idle time before a TESTFR is sent
  rttMs: number; // measured round-trip time of the link, 0 = unknown
  kbps: number; // link bit rate, 0 = unknown
  apduBytes: number; // typical I-frame size in bytes
}

export const IEC104_DEFAULTS: Iec104Input = { k: 12, w: 8, t0: 30, t1: 15, t2: 10, t3: 20, rttMs: 0, kbps: 0, apduBytes: 60 };

export const PARAM_HELP: Record<"k" | "w" | "t0" | "t1" | "t2" | "t3", string> = {
  k: "Maximum number of I-frames the sender may send without an acknowledgement. When k frames are outstanding it stops sending until an S- or I-frame acknowledges them.",
  w: "The receiver acknowledges at the latest after receiving w I-frames. A smaller w means more acknowledgements; it must be well below k so the sender never stalls.",
  t0: "Time-out for establishing the TCP connection.",
  t1: "Time-out for sent I-frames or test frames: if no acknowledgement arrives within t1, the connection is closed and must be re-established.",
  t2: "If the receiver has no data to send, it sends an S-frame acknowledgement at the latest t2 after the first unacknowledged I-frame.",
  t3: "After t3 with no frames in either direction, a TESTFR act is sent to check the connection is still alive.",
};

export type Sev = "error" | "warning" | "info" | "ok";
export interface Iec104Result {
  findings: { sev: Sev; text: string }[];
  windowKbits: number | null; // k frames in kbit
  windowSendMs: number | null; // time to send k frames at the link rate
  ok: boolean;
}

export function checkIec104(i: Iec104Input): Iec104Result {
  const F: { sev: Sev; text: string }[] = [];
  const add = (sev: Sev, text: string) => F.push({ sev, text });
  const int = (x: number) => Number.isInteger(x);
  if (!(i.k >= 1 && i.k <= 32767 && int(i.k))) add("error", `k = ${i.k} must be a whole number from 1 to 32767.`);
  if (!(i.w >= 1 && i.w <= 32767 && int(i.w))) add("error", `w = ${i.w} must be a whole number from 1 to 32767.`);
  if (i.w > i.k) add("error", `w (${i.w}) is larger than k (${i.k}): the sender would stop after k frames waiting for an acknowledgement that the receiver only sends after w. The link stalls until t2 or t1 expires.`);
  else if (i.w > (2 * i.k) / 3) add("warning", `w (${i.w}) is more than two thirds of k (${i.k}). IEC 60870-5-104 recommends w ≤ 2/3 k so acknowledgements arrive before the sender reaches k (with k = ${i.k}, w ≤ ${Math.floor((2 * i.k) / 3)}).`);
  else add("ok", `w = ${i.w} ≤ 2/3 × k = ${((2 * i.k) / 3).toFixed(1)}.`);
  for (const [n, v] of [["t0", i.t0], ["t1", i.t1], ["t2", i.t2], ["t3", i.t3]] as const) if (!(v >= 1 && v <= 255)) add("error", `${n} = ${v} s is outside the range of 1 to 255 s.`);
  if (i.t2 >= i.t1) add("error", `t2 (${i.t2} s) must be shorter than t1 (${i.t1} s): the receiver must acknowledge before the sender's time-out closes the connection.`);
  else add("ok", `t2 (${i.t2} s) < t1 (${i.t1} s).`);
  if (i.t3 <= i.t1) add("warning", `t3 (${i.t3} s) is not longer than t1 (${i.t1} s). Test frames would be sent almost as often as the time-out; the default ratio is t3 = 20 s with t1 = 15 s.`);
  if (i.t0 < i.t1) add("info", `t0 (${i.t0} s) is shorter than t1 (${i.t1} s); on slow or radio links a longer connection time-out avoids failed reconnections.`);
  let windowKbits: number | null = null, windowSendMs: number | null = null;
  if (i.kbps > 0 && i.apduBytes > 0) {
    // each I-frame carries ~40 bytes of TCP/IP header in addition to the APDU
    windowKbits = (i.k * (i.apduBytes + 40) * 8) / 1000;
    windowSendMs = (windowKbits / i.kbps) * 1000;
  }
  if (i.rttMs > 0) {
    const need = (i.rttMs + (windowSendMs ?? 0)) / 1000 + i.t2;
    if (i.t1 * 1000 <= i.rttMs * 2) add("error", `t1 (${i.t1} s) is not even twice the round-trip time (${i.rttMs} ms). Expect connection drops on this link.`);
    else if (i.t1 < need) add("warning", `Worst case before an acknowledgement arrives ≈ round trip ${i.rttMs} ms${windowSendMs ? ` + sending k frames ${windowSendMs.toFixed(0)} ms` : ""} + t2 ${i.t2} s = ${need.toFixed(1)} s, which exceeds t1 = ${i.t1} s.`);
    else add("ok", `t1 (${i.t1} s) covers the round trip${windowSendMs ? `, sending k frames` : ""} and t2 (≈ ${need.toFixed(1)} s).`);
  }
  const d = IEC104_DEFAULTS;
  const diffs = (["k", "w", "t0", "t1", "t2", "t3"] as const).filter((x) => i[x] !== d[x]).map((x) => `${x} = ${i[x]} (default ${d[x]})`);
  add("info", diffs.length ? `Different from the IEC 60870-5-104 defaults: ${diffs.join(", ")}. Both ends of the link must use matching values.` : "All parameters are at the IEC 60870-5-104 defaults (k 12, w 8, t0 30 s, t1 15 s, t2 10 s, t3 20 s).");
  return { findings: F, windowKbits, windowSendMs, ok: !F.some((f) => f.sev === "error") };
}
