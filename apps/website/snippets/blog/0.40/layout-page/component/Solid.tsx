import type route from "./+layout";
import type { JSX } from "solid-js";

export default function Layout(
  props: typeof route.get.Page & { children: JSX.Element },
) {
  return <main data-section={props.section}>{props.children}</main>;
}
