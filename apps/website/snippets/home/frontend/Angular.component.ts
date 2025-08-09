import { Component, Input } from "@angular/core";

@Component({
  template: `
    <h1>All posts</h1>
    <div *ngFor="let post of posts">
      <h2>
        <a href="/post/{{post.id}}">
          {{post.title}}
        </a>
      </h2>
    </div>
  `,
})
export default class Index {
  @Input() posts = [];
}
