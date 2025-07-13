type CSPProperties = "script-src" | "style-src";

type CSP = {
  [K in CSPProperties]?: string[];
};

export type { CSP as default };
