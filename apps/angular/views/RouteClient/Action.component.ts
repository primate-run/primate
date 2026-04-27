import route from "#route/route-client/action";
import { NgIf } from "@angular/common";
import type { OnInit } from "@angular/core";
import { Component } from "@angular/core";
import { client } from "@primate/angular";

@Component({
  imports: [NgIf],
  template: `
    <form *ngIf="form" [id]="form.id" (submit)="form.submit($event)">
      <input id="foo" name="foo" />
      <button id="send" type="submit">Send</button>
      <span id="result" *ngIf="form.submitted()">{{ result }}</span>
      <span id="error" *ngIf="foo.error()">{{ foo.error() }}</span>
    </form>
  `,
})
export default class ActionComponent implements OnInit {
  form!: ReturnType<typeof client.form>;
  foo!: ReturnType<ReturnType<typeof client.form>["field"]>;
  result = JSON.stringify({ foo: "hello" });

  ngOnInit() {
    this.form = client.form(route.post);
    this.foo = this.form.field("foo");
  }
}
