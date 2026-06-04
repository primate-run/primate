import route from "#route/route-client/action-redirect";
import type { OnInit } from "@angular/core";
import { Component } from "@angular/core";
import client from "@primate/angular/client";

@Component({
  template: `
    @if (form) {
      <form [id]="form.id" (submit)="form.submit($event)">
        <button id="send" type="submit">Send</button>
      </form>
    }
  `,
})
export default class ActionComponent implements OnInit {
  form!: ReturnType<typeof client.form>;

  ngOnInit() {
    this.form = client.form(route.post);
  }
}
