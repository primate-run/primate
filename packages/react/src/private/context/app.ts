import type ContextData from "@primate/core/i18n/ContextData";
import type { Dict } from "@rcompat/type";
import { createContext } from "react";

type Context = {
  i18n: ContextData;
} & Dict;

export type AppContextValue = {
  context: Context;
  setContext: React.Dispatch<React.SetStateAction<Context>>;
};

export default createContext<AppContextValue>({
  context: {
    i18n: {
      locale: "en-US",
    },
  },
  setContext: (() => { }) as React.Dispatch<React.SetStateAction<Context>>,
});
