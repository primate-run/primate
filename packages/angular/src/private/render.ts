import render_root from "#render-root";
import root_selector from "#root-selector";
import "@angular/compiler";
import type { ComponentDecorator } from "@angular/core";
import {
  bootstrapApplication,
  provideClientHydration,
} from "@angular/platform-browser";
import {
  provideServerRendering,
  ɵSERVER_CONTEXT,
} from "@angular/platform-server";
import { CommonEngine } from "@angular/ssr/node";
import type Dict from "@rcompat/type/Dict";

const common_engine = new CommonEngine();

export default async (component: ComponentDecorator, props: Dict) => {
  const root_component = render_root(component, props);
  const document = `<${root_selector}></${root_selector}>`;
  const bootstrap = () => bootstrapApplication(root_component, {
    providers: [
      provideServerRendering(),
      { provide: ɵSERVER_CONTEXT, useValue: "analog" },
      ...(root_component as any).renderProviders || [],
      provideClientHydration(),
    ],
  });
  const b_s = "<body>";
  const b_e = "</body>";
  const html = await common_engine.render({ bootstrap, document });
  const body = html.slice(html.indexOf(b_s) + b_s.length, html.indexOf(b_e));

  return { body };
};
