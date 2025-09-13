import pema from "pema";
import record from "pema/record";
import string from "pema/string";
import union from "pema/union";
import unknown from "pema/unknown";

export default pema({
  defaultLocale: string,
  locales: record(string, unknown),
  currency: string.default("USD"),
  persist: union("cookie", "localStorage", "sessionStorage", false)
    .default("cookie"),
});
