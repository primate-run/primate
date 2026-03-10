import type { Init } from "@primate/core/frontend";
import type { Component } from "svelte";
import { render } from "svelte/server";

const module: Init<Component> = {
  name: "svelte",
  extensions: [".svelte.js", ".svelte.ts", ".svelte"],
  layouts: true,
  client: true,
  render(view, props) {
    const { head, html } = render(view, { props: { p: { ...props } } });
    return { body: html, head };
  },
  conditions: ["svelte"],
};

export default module;
