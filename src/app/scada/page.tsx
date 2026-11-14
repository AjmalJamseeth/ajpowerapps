import { DomainHub } from "@/components/DomainHub";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/scada", "SCADA, IEC 61850 & Substation Automation Tools", "SCADA and IEC 61850 engineering tools: SCL Studio, network design, GOOSE and sampled values, IEC 104 / Modbus / DNP3 captures, time sync, commissioning tests and incident timelines — files stay in your browser.");

export default function ScadaPage() {
  return <DomainHub id="scada" />;
}
