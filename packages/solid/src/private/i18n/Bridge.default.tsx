import AppContext from "#context/app";
import type { API, Catalogs } from "@primate/core/i18n";
import { internal } from "@primate/core/i18n";
import { useContext, type JSX } from "solid-js";

export default function I18nBridge<C extends Catalogs>(
  props: { t: API<C>; children?: JSX.Element },
) {
  const { context } = useContext(AppContext);
  props.t[internal].init(context().i18n.locale);

  return <>{props.children}</>;
}
