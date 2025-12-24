import p from "pema";

export default p({
  defaultLocale: p.string,
  locales: p.record(p.string, p.unknown),
  currency: p.string.default("USD"),
  persist: p.union("cookie", "localStorage", "sessionStorage", false)
    .default("cookie"),
});
