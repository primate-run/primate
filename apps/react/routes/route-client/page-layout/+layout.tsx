import type route from "./+layout";

export default function Layout(props: typeof route.get.Page & { children: any }) {
  return <section>
    <span id="layout-page">{props.layout}</span>
    {props.children}
  </section>;
}
