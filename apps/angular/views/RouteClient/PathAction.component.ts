import route from "@/routes/route-client/path-action/[name]";
import type { OnInit } from "@angular/core";
import { Component, input } from "@angular/core";
import client from "@primate/angular/client";

@Component({
  template: `
    <form [id]="form.id" (submit)="form.submit($event)">
      <input id="foo" name="foo" />
      <button id="send" type="submit">Send</button>
      @if (form.submitted()) {
        <span id="result">{{ stringify(form.result()) }}</span>
      }
      @if (form.field('foo').error()) {
        <span id="error">{{ form.field('foo').error() }}</span>
      }
    </form>
  `,
})
export default class PathAction implements OnInit {
  name = input.required<string>();
  form!: ReturnType<typeof client.form>;
  stringify = JSON.stringify;

  ngOnInit() {
    this.form = client.form(route.post, { path: { name: this.name() } });
  }
}
