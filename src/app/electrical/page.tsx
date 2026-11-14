import { DomainHub } from "@/components/DomainHub";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/electrical", "Electrical Power Engineering Calculators & Software", "Electrical power engineering tools: short circuit and arc flash, protection and relay coordination, COMTRADE fault records, cable sizing, earthing, transformers, power quality, motors and renewables — every method explained.");

export default function ElectricalPage() {
  return <DomainHub id="electrical" />;
}
