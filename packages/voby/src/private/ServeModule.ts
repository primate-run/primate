import type Props from "@primate/core/frontend/Props";
import ServeModule from "@primate/core/frontend/ServeModule";
import "linkedom-global";
// @ts-expect-error no-types
import { createElement, renderToString } from "voby";

export default class ServeVoby extends ServeModule {
  name = "voby";
  root = false;
  render = async (component: any, props: Props) =>
    renderToString(createElement(component, props));
}
