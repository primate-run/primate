import t from "#i18n";
import { Component, Input } from "@angular/core";

@Component({
  template: `
    <h1>{{ t("title") }}</h1>
    <p>{{ t("greet_user", { name: "John" }) }}</p>
    <p>{{ t("counter", { count: count }) }}</p>
    <button (click)="setLocale('en-US')">{{ t("english") }}</button>
    <button (click)="setLocale('de-DE')">{{ t("german") }}</button>
  `,
})
export class TranslatedComponent {
  @Input() count!: number;

  t = t;

  setLocale(locale: string) {
    t.locale.set(locale);
  }
}
