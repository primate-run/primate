import type Dict from "@rcompat/type/Dict";

type Strategy = {
  position: "prefix" | "suffix";
  other: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  zero?: string;
};

const STRATEGY: Dict<Strategy> = {
  EN: { position: "suffix", one: "st", two: "nd", few: "rd", other: "th" },
  FR: { position: "suffix", one: "er", other: "e" },
  NL: { position: "suffix", other: "e" },
  SV: { position: "suffix", one: ":a", other: ":e" },
  RU: { position: "suffix", other: "-й" },
  EL: { position: "suffix", other: "ος" },
  CA: { position: "suffix", one: "r", other: "a" },
  GA: { position: "suffix", other: "ú" },
  RO: { position: "suffix", one: "-lea", other: "-lea" },
  HY: { position: "suffix", one: "-ին", other: "-րդ" },
  DOT: { position: "suffix", other: "." },
  NUMERO: { position: "suffix", other: "º" },

  JA: { position: "prefix", other: "第" },
  ZH: { position: "prefix", other: "第" },
  TH: { position: "prefix", other: "ที่" },
  VI: { position: "prefix", other: "thứ " },
  MS: { position: "prefix", other: "ke-" },
};

const ordinals: Dict<Dict<string>> = Object.fromEntries(Object.entries({
  EN: ["en"], // English
  FR: ["fr"], // French
  NL: ["nl"], // Dutch
  SV: ["sv"], // Swedish
  GA: ["ga"], // Irish
  EL: ["el"], // Greek
  RO: ["ro"], // Romanian
  JA: ["ja"], // Japanese
  ZH: ["zh"], // Chinese
  TH: ["th"], // Thai
  VI: ["vi"], // Vietnamese
  HY: ["hy"], // Armenian
  RU: ["ru", "uk", "be"], // Russian Ukrainian Belarusian
  MS: ["ms", "id"], // Malay Indonesian
  NUMERO: ["es", "it", "pt", "gl"], // Spanish Italian Portuguese Galician
  DOT: [
    // German Danish Norwegian Icelandic
    "de", "da", "no", "is",
    // Polish Czech Slovak
    "pl", "cs", "sk",
    // Serbian Croatian Bosnian Slovenian Macedonian
    "sr", "hr", "bs", "sl", "mk",
    // Latvian Lithuanian
    "lv", "lt",
    // Finnish Estonian Hungarian Turkish
    "fi", "et", "hu", "tr",
    // Albanian
    "sq",
  ],
}).flatMap(([strategy, locales]) =>
  locales.map(l => [l, STRATEGY[strategy as keyof typeof STRATEGY]])));

export default ordinals;
