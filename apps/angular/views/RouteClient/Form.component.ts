import route from "#route/route-client/form";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  template: `
    <button (click)="send()">Send</button>
    @if (result !== null) { <span id="result">{{ result }}</span> }
  `,
})
export default class FormComponent {
  #cdr = inject(ChangeDetectorRef);
  result: string | null = null;

  async send() {
    const response = await route.post({ body: { foo: "bar" } });
    this.result = JSON.stringify(await response.json());
    this.#cdr.detectChanges();
  }
}
