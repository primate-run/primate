import init from "#init";
import frontend from "@primate/core/frontend";
import "linkedom-global";
// @ts-expect-error no-types
import { createElement, renderToString } from "voby";

export default frontend({
  ...init,
  async render(views: any, props: any) {
    return { body: await renderToString(createElement(views, props)) };
  },
});
