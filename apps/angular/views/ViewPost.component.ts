import t from "#i18n";
import { Component, input } from "@angular/core";

@Component({
  template: `
    <h1>{{ t("title") }}: {{ $post.title }}</h1>
    <div>Id: {{ $post.id }}</div>
    <h3>{{ t("switch_language") }}</h3>
    <button (click)="setLocale('en-US')">{{ t("english") }}</button>
    <button (click)="setLocale('de-DE')">{{ t("german") }}</button>
    <a href="/post/1">First post</a>
    <a href="/post/2">Second post</a>
  `,
})
export default class PostDetail {
  post = input();
  t = t;

  get $post() {
    return this.post();
  }

  setLocale(locale: string) {
    t.locale.set(locale);
  }

}
