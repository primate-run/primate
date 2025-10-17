import t from "#i18n";
import { CommonModule } from "@angular/common";
import type { TemplateRef } from "@angular/core";
import { Component, Input } from "@angular/core";

@Component({
  imports: [CommonModule],
  template: `
    <ul>
      <li>
        <a href="/">overview</a>
        <div>Id: {{ user.name }}</div>
      </li>
    </ul>
    <div>
layout start — <ng-container *ngTemplateOutlet="slot"></ng-container> — layout end

    </div>
    <h3>{{ t("switch_language") }}</h3>
    <button (click)="setLocale('en-US')">{{ t("english") }}</button>
    <button (click)="setLocale('de-DE')">{{ t("german") }}</button>
  `,
})
export default class LayoutComponent {
  @Input() user: any;
  @Input({ required: true }) slot!: TemplateRef<unknown>;

  // Expose t to the template
  t = (key: string) => t(key);

  setLocale(locale: string) {
    t.locale.set(locale);
  }
}
