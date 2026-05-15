import { Component } from "@angular/core";
import { client } from "@primate/angular";

@Component({
  template: `
    @if (form.submitted()) {
      <p id="submitted">submitted</p>
    }
    @else {
      <form method="post" [id]="form.id" (submit)="form.submit($event)">
        <button type="submit">Submit</button>
      </form>
    }
  `,
})
export default class Submit {
  form = client.form({ initial: { email: "" } });
}
