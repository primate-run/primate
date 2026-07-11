import type route from "./+layout";

export default function Layout(
  props: typeof route.get.Page & { children: React.ReactNode },
) {
  return <main data-section={props.section}>{props.children}</main>;
}
