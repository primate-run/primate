import route from "#route/route-client/json";
import { NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  imports: [NgIf],
  template: `
    <button (click)="send()">Send</button>
    <span id="result" *ngIf="result !== null">{{ result }}</span>
  `,
})
export default class JSONComponent {
  #cdr = inject(ChangeDetectorRef);
  result: string | null = null;

  async send() {
    const response = await route.post({ body: { foo: "bar" } });
    this.result = JSON.stringify(await response.json());
    this.#cdr.detectChanges();
  }
}
