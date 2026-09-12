"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { SelectField, Section, ResultCard, ResultRow } from "@/components/fields";
import {
  DEFAULT_AFCI_GFCI_INPUT,
  AfciGfciInput,
  DwellingLocation,
  DWELLING_LOCATIONS,
  lookupAfciGfci,
} from "@/lib/afciGfciRequirements";

function fmt(v: boolean | "verify"): string {
  if (v === true) return "Required ✓";
  if (v === false) return "Not required (by the enumerated list)";
  return "Verify locally";
}

export default function AfciGfciRequirementsPage() {
  const [input, setInput] = useState<AfciGfciInput>(DEFAULT_AFCI_GFCI_INPUT);
  const update = (patch: Partial<AfciGfciInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => lookupAfciGfci(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          AFCI / GFCI Protection Requirements
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Check whether a dwelling-unit branch circuit typically requires
          AFCI and/or GFCI protection, based on the commonly enumerated
          NEC location lists.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="AFCI / GFCI Protection Requirements" standardsLine="NEC 210.12(A) (AFCI) and NEC 210.8(A) (GFCI) dwelling-unit location lists" />
          <FeedbackButton calculatorName="AFCI / GFCI Protection Requirements" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Looks up whether a dwelling-unit branch circuit serving a given room or area typically requires AFCI protection (NEC 210.12(A)) and/or GFCI protection (NEC 210.8(A)), based on the commonly enumerated location lists most recent NEC cycles use. This is a code-reference lookup, not a calculation — it's meant as a quick planning check, not a final code-compliance ruling."
            standards={[
              "NEC 210.12(A) — arc-fault circuit-interrupter (AFCI) protection, dwelling units",
              "NEC 210.8(A) — ground-fault circuit-interrupter (GFCI) protection, dwelling units",
            ]}
            capabilities={[
              "Per-location AFCI and GFCI requirement lookup with the specific citation.",
              "Flags locations where the requirement depends on additional context (e.g. proximity to a sink, or isn't explicitly enumerated) as \"verify locally\" rather than guessing.",
            ]}
            example={{
              problem: "Kitchen branch circuit.",
              steps: [
                "210.12(A) lists kitchens — AFCI required.",
                "210.8(A)(6) requires GFCI on all 125-250V, 15/20A kitchen receptacles (not just countertop, since the 2020 NEC cycle) — GFCI required.",
              ],
              result: "Both AFCI and GFCI required — many installations use a dual-function AFCI/GFCI breaker here.",
            }}
            notes="These enumerated lists change between NEC editions (GFCI coverage for laundry areas and all kitchen receptacles was added in the 2020 cycle, for example) and many jurisdictions apply local amendments. Always confirm against the specific NEC edition and any local amendments adopted by the AHJ before finalizing a design."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Location">
              <SelectField<DwellingLocation>
                label="Room / area"
                value={input.location}
                onChange={(v) => update({ location: v })}
                options={(Object.keys(DWELLING_LOCATIONS) as DwellingLocation[]).map((k) => ({ value: k, label: DWELLING_LOCATIONS[k].label }))}
              />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <ResultCard title="Protection requirement">
                <ResultRow label="AFCI" value={fmt(result.afciRequired)} />
                <ResultRow label="AFCI citation" value={result.afciCitation} />
                <ResultRow label="GFCI" value={fmt(result.gfciRequired)} />
                <ResultRow label="GFCI citation" value={result.gfciCitation} />
              </ResultCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
