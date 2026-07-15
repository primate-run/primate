import { Component, Input } from "@angular/core";
import frontend_links from "../lib/frontends.ts";
import type route from "./angular";

type Props = typeof route.get.Page;

@Component({
  template: `<main>
    <h1 id="current">{{ current }}</h1>
    <nav>@for (frontend of frontends; track frontend.name) { <a id="to-{{ frontend.name }}" href="/{{ frontend.name }}">{{ frontend.name }}</a> }</nav>
  </main>`,
})
export default class AngularPage {
  @Input({ required: true }) current!: Props["current"];
  frontends = frontend_links;
}
