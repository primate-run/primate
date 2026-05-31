import type { OnInit } from "@angular/core";
import { Component, input } from "@angular/core";
import client from "@primate/angular/client";

@Component({
  template: `
    @if (form) {
      <form
        [id]="form.id"
        method="post"
        [attr.action]="'/form?id=' + id()"
        (submit)="form.submit($event)"
      >
        @if (form.errors().length) {
          <p style="color: red">{{ form.errors()[0] }}</p>
        }

        <label>
          Counter:
          <input
            type="number"
            [attr.name]="counterField.name"
            [attr.value]="counterField.value"
          />
        </label>

        @if (counterField.error()) {
          <p id="counter-error" style="color: red">
            {{ counterField.error() }}
          </p>
        }

        @if (form.submitted()) {
          <span id="submitted">saved</span>
        }

        <button type="submit" [disabled]="form.submitting()">Save</button>
      </form>
    }
  `,
})
export default class FormComponent implements OnInit {
  counter = input.required<number>();
  id = input.required<string>();

  form!: ReturnType<typeof client.form>;
  counterField!: ReturnType<ReturnType<typeof client.form>["field"]>;

  ngOnInit() {
    this.form = client.form({
      initial: {
        counter: this.counter(),
      },
    });

    this.counterField = this.form.field("counter");
  }
}
