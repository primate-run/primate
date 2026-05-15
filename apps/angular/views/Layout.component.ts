import t from "#i18n";
import { CommonModule } from "@angular/common";
import type { TemplateRef } from "@angular/core";
import { Component, Input, input } from "@angular/core";

@Component({
  imports: [CommonModule],
  template: `
    <ul>
      <li>
        <a href="/">overview</a>
        <div>Id: {{ $user.name }}</div>
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
  user = input<any>();
  @Input({ required: true }) slot!: TemplateRef<unknown>;

  t = t;

  setLocale(locale: string) {
    t.locale.set(locale);
  }

  get $user() {
    return this.user();
  }
}
