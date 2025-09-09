import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  selector: "app-link",
  imports: [CommonModule],
  template: `
    <h2><a [href]="'/post/' + post.id">{{ post.title }}</a></h2>
  `,
})
export default class Link {
  @Input() post!: any;
}
