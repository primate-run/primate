import Link from "#component/Link";
import t from "#i18n";
import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  imports: [CommonModule, Link],
  template: `
    <a href="/redirect">redirect</a>
    <h1 (click)="onHeaderClick()">
      {{ t("all_posts") }}
    </h1>
    <ng-container *ngFor="let post of posts">
      <app-link [post]="post"></app-link>
    </ng-container>
    <h3>{{ t("counter") }}</h3>
    <div>
      <button (click)="count = count - 1">-</button>
      <button (click)="count = count + 1">+</button>
      {{ count }}
    </div>
    <h3>{{ t("switch_language") }}</h3>
    <button (click)="setLocale('en-US')">{{ t("english") }}</button>
    <button (click)="setLocale('de-DE')">{{ t("german") }}</button>
    <p>Current locale: {{ getCurrentLocale() }}</p>
  `,
})
export default class PostIndex {
  @Input() posts: any[] = [];
  @Input() title: string = "";

  count: number = 0;

  // Expose t to the template
  t = (key: string) => t(key);

  onHeaderClick() {
    console.log("clicked!");
  }

  setLocale(locale: string) {
    t.locale.set(locale);
  }

  getCurrentLocale() {
    return t.locale.get();
  }
}
