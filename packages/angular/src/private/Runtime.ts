import render from "#render";
import type { ComponentDecorator } from "@angular/core";
import { enableProdMode } from "@angular/core";
import type App from "@primate/core/App";
import FrontendModule from "@primate/core/frontend/Module";
import type Next from "@primate/core/Next";
import type NextServe from "@primate/core/NextServe";
import type ServeApp from "@primate/core/ServeApp";

export default class Runtime extends FrontendModule<ComponentDecorator> {
  name = "angular";
  defaultExtensions = [".component.ts"];
  layouts = false;
  render = render;
  // whether this package exports client code
  client = true;

  init<T extends App>(app: T, next: Next<T>) {
    app.mode === "production" && enableProdMode();

    return super.init(app, next);
  }

  async serve(app: ServeApp, next: NextServe) {
    await import("zone.js");

    return super.serve(app, next);
  }
}
