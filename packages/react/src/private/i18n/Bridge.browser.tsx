import AppContext from "#context/app";
import type API from "@primate/core/i18n/API";
import type Catalogs from "@primate/core/i18n/Catalogs";
import sInternal from "@primate/core/i18n/sInternal";
import { useContext, useEffect, type ReactNode } from "react";

export default function I18nBridge<C extends Catalogs>(
  { t, children }: { t: API<C>; children?: ReactNode },
) {
  const { context, setContext } = useContext(AppContext);
  const server = context.i18n.locale;
  if (server !== undefined && server !== t.locale.get()) {
    t[sInternal].init(server);
  }

  useEffect(() => { t[sInternal].restore(); }, []);

  useEffect(() => t.subscribe(() => {
    setContext(prev => ({
      ...prev,
      i18n: { ...prev.i18n, locale: t.locale.get() },
    }));
  }), [setContext, t]);

  return <>{children}</>;
}
