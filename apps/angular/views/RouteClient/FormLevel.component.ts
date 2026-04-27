import route from "#route/route-client/form-level";
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
      <span id="result" *ngIf="form.submitted()">ok</span>
      <span id="error" *ngIf="form.errors().length > 0">{{ form.errors()[0] }}</span>
    </form>
  `,
})
export default class FormLevelComponent implements OnInit {
  form!: ReturnType<typeof client.form>;

  ngOnInit() {
    this.form = client.form(route.post);
  }
}
