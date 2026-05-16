import t from "#i18n";
import { Component } from "@angular/core";

@Component({
  template: `
    <span id="locale">{{ t.locale.get() }}</span>
    <span id="title">{{ t("title") }}</span>
    <button id="de" (click)="t.locale.set('de-DE')">{{ t("german") }}</button>
    <button id="en" (click)="t.locale.set('en-US')">{{ t("english") }}</button>
  `,
})
export default class I18nIndex {
  t = t;
}
