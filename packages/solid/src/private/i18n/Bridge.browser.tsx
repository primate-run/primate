import AppContext from "#context/app";
import type { API, Catalogs } from "@primate/core/i18n";
import { internal } from "@primate/core/i18n";
import type { JSX } from "solid-js";
import { createSignal, onCleanup, onMount, useContext } from "solid-js";

export default function I18nBridge<C extends Catalogs>(
  props: { t: API<C>; children?: JSX.Element },
) {
  const { context } = useContext(AppContext);
  const server = context().i18n.locale;
  if (server !== undefined && server !== props.t.locale.get()) {
    props.t[internal].init(server);
  }

  // tick when locale changes
  const [version, setVersion] = createSignal(props.t[internal].version);

  const removeDepend = props.t[internal].depend(() => { version(); });

  const off = props.t.subscribe(() => setVersion(v => v + 1));

  onMount(() => props.t[internal].restore());

  onCleanup(() => {
    off();
    removeDepend();
  });

  return <>{props.children}</>;
}
