import type ContextData from "@primate/core/i18n/ContextData";
import type Dict from "@rcompat/type/Dict";
import { createContext, type Accessor, type Setter } from "solid-js";

type Context = {
  i18n: ContextData;
} & Dict;

export type AppContextValue = {
  context: Accessor<Context>;
  setContext: Setter<Context>;
};

export default createContext<AppContextValue>({
  context: () => ({
    i18n: {
      locale: "en-US",
    },
  }),
  setContext: (() => { }) as Setter<Context>,
});
