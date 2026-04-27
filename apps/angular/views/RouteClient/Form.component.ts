import route from "#route/route-client/form";
import { NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  imports: [NgIf],
  template: `
    <button (click)="send()">Send</button>
    <span id="result" *ngIf="result !== null">{{ result }}</span>
  `,
})
export default class FormComponent {
  #cdr = inject(ChangeDetectorRef);
  result: string | null = null;

  async send() {
    const response = await route.post({ body: new URLSearchParams({ foo: "bar" }) });
    this.result = JSON.stringify(await response.json());
    this.#cdr.detectChanges();
  }
}
