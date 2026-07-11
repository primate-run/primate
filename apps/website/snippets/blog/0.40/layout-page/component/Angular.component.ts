import type route from "./+layout";
import { Component, input } from "@angular/core";

type Props = typeof route.get.Page;

@Component({
  template: `<main [attr.data-section]="section()"><ng-content /></main>`,
})
export default class Layout {
  section = input.required<Props["section"]>();
}
