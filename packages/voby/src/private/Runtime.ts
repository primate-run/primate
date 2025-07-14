import Module from "@primate/core/frontend/Module";
import type Props from "@primate/core/frontend/Props";
import "linkedom-global";
// @ts-expect-error no-types
import { createElement, renderToString } from "voby";

export default class Runtime extends Module {
  name = "voby";
  defaultExtension = ".voby";
  layouts = false;
  client = false;
  render = async (component: any, props: Props) =>
    renderToString(createElement(component, props));
}
