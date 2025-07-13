import client from "#client/index";
import type ClientRoot from "@primate/core/frontend/ClientRoot";
import type Render from "@primate/core/frontend/Render";
import ServeModule from "@primate/core/frontend/ServeModule";
import type { Component } from "svelte";
import { render } from "svelte/server";

export default class ServeSvelte extends ServeModule<Component, ClientRoot> {
  name = "svelte";
  root = true;
  client = client;
  render: Render<Component> = (component, props) => {
    const { html, head } = render(component, { props: { p: { ...props } } });
    return { body: html, head };
  };
}
