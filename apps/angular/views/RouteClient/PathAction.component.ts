import route from "#route/route-client/path-action/[name]";
import type { OnInit } from "@angular/core";
import { Component, Input } from "@angular/core";
import { client } from "@primate/angular";

@Component({
  selector: "app-path-action",
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
  @Input() name!: string;
  stringify = JSON.stringify;
  form!: ReturnType<typeof client.form>;

  ngOnInit() {
    this.form = client.form(route.post, { path: { name: this.name } });
  }
}
