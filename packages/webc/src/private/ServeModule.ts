import client from "#client/index";
import type Frontend from "@primate/core/frontend";
import ServeModule from "@primate/core/frontend/ServeModule";
import inline from "@primate/core/inline";

export default class ServeWebComponents extends ServeModule {
  name = "webc";
  root = false;
  handler: Frontend = (name, props = {}, options = {}) => async app => {
    const [component] = name.split(".");
    const assets = [await inline(client(component, props), "module")];
    const head = assets.map(asset => asset.head).join("\n");
    const script_src = assets.map(asset => asset.integrity);
    const headers = app.headers({ "script-src": script_src });

    return app.view({ head, headers, body: "", ...options });
  };
}
