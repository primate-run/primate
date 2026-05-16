import AppContext from "#context/app";
import type { API, Catalogs } from "@primate/core/i18n";
import { internal } from "@primate/core/i18n";
import type { ReactNode } from "react";
import { useContext, useEffect } from "react";

export default function I18nBridge<C extends Catalogs>(
  { t, children }: { t: API<C>; children?: ReactNode },
) {
  const { context, setContext } = useContext(AppContext);
  const server = context.i18n.locale;
  if (server !== undefined && server !== t.locale.get()) {
    t[internal].init(server);
  }

  useEffect(() => { t[internal].restore(); }, []);

  useEffect(() => t.subscribe(() => {
    setContext(prev => ({
      ...prev,
      i18n: { ...prev.i18n, locale: t.locale.get() },
    }));
  }), [setContext, t]);

  return <>{children}</>;
}
