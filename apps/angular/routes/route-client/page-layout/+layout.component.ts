import { CommonModule } from "@angular/common";
import type { TemplateRef } from "@angular/core";
import { Component, Input, input } from "@angular/core";
import type route from "./+layout";

type Props = typeof route.get.Page;

@Component({
  imports: [CommonModule],
  template: `
    <section>
      <span id="layout-page">{{ layout() }}</span>
      <ng-container *ngTemplateOutlet="slot" />
    </section>
  `,
})
export default class Layout {
  layout = input.required<Props["layout"]>();
  @Input({ required: true }) slot!: TemplateRef<unknown>;
}
