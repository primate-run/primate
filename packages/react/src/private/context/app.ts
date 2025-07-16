import type ContextData from "@primate/i18n/ContextData";
import type Dict from "@rcompat/type/Dict";
import { createContext } from "react";

type Context = {
  i18n: ContextData;
};

type AppContext = {
  context: Context;
  setContext: React.Dispatch<Context>;
};

export default createContext<AppContext>({
  context: {
    i18n: {
      locales: {},
      locale: "en-US",
    },
  },
  setContext: (_: Dict) => {},
});
