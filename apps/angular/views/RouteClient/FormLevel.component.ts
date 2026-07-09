import route from "@/routes/route-client/form-level";
import type { OnInit } from "@angular/core";
import { Component } from "@angular/core";
import client from "@primate/angular/client";

@Component({
  template: `
    @if (form) {
      <form [id]="form.id" (submit)="form.submit($event)">
        <input id="foo" name="foo" />
        <button id="send" type="submit">Send</button>
        @if (form.submitted) { <span id="result">ok</span> }
        @if (form.errors().length > 0 ) {
          <span id="error">{{ form.errors()[0] }}</span>
        }
      </form>
    }
  `,
})
export default class FormLevelComponent implements OnInit {
  form!: ReturnType<typeof client.form>;

  ngOnInit() {
    this.form = client.form(route.post);
  }
}
