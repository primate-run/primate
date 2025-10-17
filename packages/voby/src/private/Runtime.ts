import FrontendModule from "@primate/core/frontend/Module";
import type Dict from "@rcompat/type/Dict";
import "linkedom-global";
// @ts-expect-error no-types
import { createElement, renderToString } from "voby";

export default class Runtime extends FrontendModule {
  name = "voby";
  defaultExtensions = [".jsx", ".tsx"];
  layouts = false;
  client = false;
  render = async (views: any, props: Dict) =>
    renderToString(createElement(views, props));
}
