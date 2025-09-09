import AppContext from "#context/app";
import type API from "@primate/core/i18n/API";
import type Catalogs from "@primate/core/i18n/Catalogs";
import sInternal from "@primate/core/i18n/sInternal";
import { useContext, type JSX } from "solid-js";

export default function I18nBridge<C extends Catalogs>(
  props: { t: API<C>; children?: JSX.Element },
) {
  const { context } = useContext(AppContext);
  props.t[sInternal].init(context().i18n.locale);

  return <>{props.children}</>;
}
