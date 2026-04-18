import INITIAL_PROPS from "#INITIAL_PROPS";
import root from "#root-selector";
import "@angular/compiler";
import type { Type } from "@angular/core";
import { enableProdMode, importProvidersFrom } from "@angular/core";
import type { BootstrapContext } from "@angular/platform-browser";
import {
  bootstrapApplication,
  BrowserModule,
  provideClientHydration,
} from "@angular/platform-browser";
import {
  provideServerRendering,
  renderApplication,
} from "@angular/platform-server";
import type { Init } from "@primate/core/frontend";

const module: Init<Type<any>> = {
  name: "angular",
  extensions: [".component.ts"],
  layouts: true,
  client: true,
  async render(view, props) {
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
    const bodyRegex = new RegExp(`(<${root}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${root}>)`);
    const bodyMatch = html.match(bodyRegex);

    return {
      body: bodyMatch?.[1] || html,
      head: headMatch?.[1] || "",
    };
  },
  onServe(app) {
    app.mode === "production" && enableProdMode();
  },
};

export default module;
