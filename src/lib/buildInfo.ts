// Release identifier set at build time in next.config.ts (commit + date).
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || "local";
export const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE || "";
export const BUILD_LABEL = `Build ${BUILD_ID}${BUILD_DATE ? ` · ${BUILD_DATE}` : ""}`;
