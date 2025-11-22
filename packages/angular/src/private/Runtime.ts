import INITIAL_PROPS from "#INITIAL_PROPS";
import root from "#root-selector";
import "@angular/compiler";
import {
  enableProdMode,
  importProvidersFrom,
  type Type,
} from "@angular/core";
import type {
  BootstrapContext,
} from "@angular/platform-browser";
import {
  bootstrapApplication,
  BrowserModule,
  provideClientHydration,
} from "@angular/platform-browser";
import {
  provideServerRendering,
  renderApplication,
} from "@angular/platform-server";
import FrontendModule from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import type NextServe from "@primate/core/NextServe";
import type ServeApp from "@primate/core/ServeApp";

export default class Runtime extends FrontendModule<Type<any>> {
  name = "angular";
  defaultExtensions = [".component.ts"];
  layouts = true;
  client = true;

  render: Render<Type<any>> = async (view, props) => {
    const providers = [
      importProvidersFrom(BrowserModule),
      provideServerRendering(),
      provideClientHydration(),
      {
        provide: INITIAL_PROPS,
        useValue: props,
      },
    ];
    const bootstrap = (context: BootstrapContext) =>
      bootstrapApplication(view, { providers }, context);

    const html = await renderApplication(bootstrap, {
      document: `<${root}></${root}>`,
    });

    const headMatch = html.match(/<head>(.*?)<\/head>/s);
    const bodyRegex = new RegExp(`<${root}>([\\s\\S]*?)<\\/${root}>`);
    const bodyMatch = html.match(bodyRegex);

    return {
      body: bodyMatch?.[1] || html,
      head: headMatch?.[1] || "",
    };
  };

  async serve(app: ServeApp, next: NextServe) {
    app.mode === "production" && enableProdMode();

    return super.serve(app, next);
  }
}
