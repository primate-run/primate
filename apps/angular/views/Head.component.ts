import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";

@Component({
  template: "<h1>{{ pageTitle }}</h1>",
})
export default class Page implements OnInit {
  pageTitle = "About Us";
  title = inject(Title);
  meta = inject(Meta);

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    this.meta.addTag({ name: "description", content: "Learn more about us" });
    this.meta.addTag({ property: "og:title", content: this.pageTitle });
  }
}
