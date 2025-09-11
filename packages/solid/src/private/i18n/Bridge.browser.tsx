import AppContext from "#context/app";
import type API from "@primate/core/i18n/API";
import type Catalogs from "@primate/core/i18n/Catalogs";
import sInternal from "@primate/core/i18n/sInternal";
import {
  createSignal, onCleanup, onMount, useContext,
  type JSX,
} from "solid-js";

export default function I18nBridge<C extends Catalogs>(
  props: { t: API<C>; children?: JSX.Element },
) {
  const { context } = useContext(AppContext);
  const server = context().i18n.locale;
  if (server !== undefined && server !== props.t.locale.get()) {
    props.t[sInternal].init(server);
  }

  // tick when locale changes
  const [version, setVersion] = createSignal(props.t[sInternal].version);

  const removeDepend = props.t[sInternal].depend(() => { version(); });

  const off = props.t.subscribe(() => setVersion(v => v + 1));

  onMount(() => props.t[sInternal].restore());

  onCleanup(() => {
    off();
    removeDepend();
  });

  return <>{props.children}</>;
}
