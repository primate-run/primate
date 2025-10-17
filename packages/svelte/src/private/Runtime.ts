import FrontendModule from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import type { Component } from "svelte";
import { render } from "svelte/server";

export default class Runtime extends FrontendModule<Component> {
  name = "svelte";
  defaultExtensions = [".svelte"];
  layouts = true;
  client = true;
  render: Render<Component> = (view, props) => {
    const { head, html } = render(view, { props: { p: { ...props } } });
    return { body: html, head };
  };
}
