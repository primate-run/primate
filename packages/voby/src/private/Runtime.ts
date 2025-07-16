import Module from "@primate/core/frontend/Module";
import type Dict from "@rcompat/type/Dict";
import "linkedom-global";
// @ts-expect-error no-types
import { createElement, renderToString } from "voby";

export default class Runtime extends Module {
  name = "voby";
  defaultExtension = ".voby";
  layouts = false;
  client = false;
  render = async (component: any, props: Dict) =>
    renderToString(createElement(component, props));
}
