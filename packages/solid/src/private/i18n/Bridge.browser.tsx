import AppContext from "#context/app";
import type API from "@primate/core/i18n/API";
import type Catalogs from "@primate/core/i18n/Catalogs";
import sInternal from "@primate/core/i18n/sInternal";
import { createSignal, onCleanup, useContext, type JSX } from "solid-js";

export default function I18nBridge<C extends Catalogs>(
  props: { t: API<C>; children?: JSX.Element },
) {
  const { context } = useContext(AppContext);
  props.t[sInternal].init(context().i18n.locale);
  // tick when locale changes
  const [version, setVersion] = createSignal(props.t[sInternal].version);

  const removeDepend = props.t[sInternal].depend(() => { version(); });

  const unsubscribe = props.t.onChange(() =>
    setVersion(props.t[sInternal].version));

  onCleanup(() => {
    unsubscribe();
    removeDepend();
  });

  return <>{props.children}</>;
}
