import type { Init } from "@primate/core/frontend";
import type { Component } from "svelte";
import { render } from "svelte/server";

const module: Init<Component> = {
  name: "svelte",
  extensions: [".svelte.js", ".svelte.ts", ".svelte"],
  layouts: true,
  client: true,
  async render(view, props) {
    const { body, head } = await render(view, { props: { p: { ...props } } });
    return { body, head };
  },
  conditions: ["svelte"],
};

export default module;
