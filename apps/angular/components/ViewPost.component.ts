import t from "#i18n";
import { Component, Input } from "@angular/core";

@Component({
  selector: "post-detail",
  template: `
    <h1>{{ t("title") }}: {{ post.title }}</h1>
    <div>Id: {{ post.id }}</div>
    <h3>{{ t("switch_language") }}</h3>
    <button (click)="setLocale('en-US')">{{ t("english") }}</button>
    <button (click)="setLocale('de-DE')">{{ t("german") }}</button>
  `,
})
export default class PostDetail {
  @Input() post: any;

  // Expose t to the template
  t = (key: string) => t(key);

  setLocale(locale: string) {
    t.locale.set(locale);
  }
}
