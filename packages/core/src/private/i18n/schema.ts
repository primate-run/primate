import p from "pema";

export default p({
  defaultLocale: p.string,
  locales: p.dict(p.unknown),
  currency: p.string.default("USD"),
  persist: p.union("cookie", "localStorage", "sessionStorage", false)
    .default("cookie"),
});
