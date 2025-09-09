import AppContext from "#context/app";
import type API from "@primate/core/i18n/API";
import type Catalogs from "@primate/core/i18n/Catalogs";
import sInternal from "@primate/core/i18n/sInternal";
import { useContext, useEffect, type ReactNode } from "react";

export default function I18nBridge<C extends Catalogs>(
  { t, children }: { t: API<C>; children?: ReactNode },
) {
  const { context, setContext } = useContext(AppContext);

  t[sInternal].init(context.i18n.locale);

  useEffect(() => t.onChange(locale =>
    setContext(previous => ({
      ...previous, i18n: { ...previous.i18n, locale },
    })),
  ), [setContext, t]);

  return <>{children}</>;
}
