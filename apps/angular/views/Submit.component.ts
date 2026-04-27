import { NgIf } from "@angular/common";
import { Component } from "@angular/core";
import { client } from "@primate/angular";

@Component({
  imports: [NgIf],
  template: `
    <p *ngIf="form.submitted(); else formTpl" id="submitted">submitted</p>

    <ng-template #formTpl>
      <form method="post" [id]="form.id" (submit)="form.submit($event)">
        <button type="submit">Submit</button>
      </form>
    </ng-template>
  `,
})
export default class Submit {
  form = client.form({ initial: { email: "" } });
}
