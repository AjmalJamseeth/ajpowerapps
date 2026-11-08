import { runValidation, validationCsv } from "@/lib/validation";
import { BUILD_LABEL } from "@/lib/buildInfo";

export const dynamic = "force-static";

export function GET() {
  const csv = validationCsv(runValidation(), BUILD_LABEL);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ajapps-validation-register.csv"',
    },
  });
}
