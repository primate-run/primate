import AppContext from "#context/app";
import type { API, Catalogs } from "@primate/core/i18n";
import { internal } from "@primate/core/i18n";
import { useContext, type ReactNode } from "react";

export default function I18nBridge<C extends Catalogs>(
  { t, children }: { t: API<C>; children?: ReactNode },
) {
  const { context } = useContext(AppContext);

  t[internal].init(context.i18n.locale);

  return <>{children}</>;
}
