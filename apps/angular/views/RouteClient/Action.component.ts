import route from "@/routes/route-client/action";
import type { OnInit } from "@angular/core";
import { Component } from "@angular/core";
import client from "@primate/angular/client";

@Component({
  template: `
    @if (form) {
      <form [id]="form.id" (submit)="form.submit($event)">
        <input id="foo" name="foo" />
        <button id="send" type="submit">Send</button>
        @if (form.submitted()) { <span id="result">{{ result }}</span> }
        @if (foo.error()) { <span id="error">{{ foo.error() }}</span> }
      </form>
    }
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
