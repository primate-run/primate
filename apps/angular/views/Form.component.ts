import { Component, Input, type OnInit } from "@angular/core";
import { NgIf } from "@angular/common";
import client from "@primate/angular/client";

@Component({
  imports: [NgIf],
  template: `
    <form
      *ngIf="form"
      [id]="form.id"
      method="post"
      [attr.action]="'/form?id=' + id"
      (submit)="form.submit($event)"
    >
      <p *ngIf="form.errors().length" style="color: red">
        {{ form.errors()[0] }}
      </p>

      <label>
        Counter:
        <input
          type="number"
          [attr.name]="counterField.name"
          [attr.value]="counterField.value"
        />
      </label>

      <p *ngIf="counterField.error() as err" style="color: red">
        {{ err }}
      </p>

      <button type="submit" [disabled]="form.submitting()">Save</button>
    </form>
  `,
})
export default class FormComponent implements OnInit {
  @Input({ required: true }) counter!: number;
  @Input({ required: true }) id!: string;

  form!: ReturnType<typeof client.form>;
  counterField!: ReturnType<ReturnType<typeof client.form>["field"]>;

  ngOnInit() {
    this.form = client.form({ initial: { counter: this.counter } });
    this.counterField = this.form.field("counter");
  }
}
