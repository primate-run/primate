import { Component, Input, model } from "@angular/core";

@Component({
  selector: "post-index",
  standalone: true,
  template: `
    <h1>{{test}}</h1>
    <h3>{{posts.length}} says:</h3>
    <button (click)="update(-1)">-</button>
    <span>{{ count() }}</span>
    <button (click)="update(+1)">+</button>
  `,
})
export default class PostIndex {
  @Input() posts = [];
  @Input() test = "bar";
  count = model<number>(0);

  update(amount: number): void {
    this.count.update(currentCount => currentCount + amount);
  }
}
