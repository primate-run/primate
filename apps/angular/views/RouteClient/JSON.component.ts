import route from "@/routes/route-client/json";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  template: `
    <button (click)="send()">Send</button>
    @if (result !== null) { <span id="result">{{ result }}</span> }
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
