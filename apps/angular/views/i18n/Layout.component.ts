import t from "#i18n";
import { CommonModule } from "@angular/common";
import type { TemplateRef } from "@angular/core";
import { Component, Input } from "@angular/core";

@Component({
  imports: [CommonModule],
  template: `
    <span id="layout-locale">{{ t.locale.get() }}</span>
    <ng-container *ngTemplateOutlet="slot"></ng-container>
  `,
})
export default class I18nLayout {
  @Input({ required: true }) slot!: TemplateRef<unknown>;
  t = t;
}
