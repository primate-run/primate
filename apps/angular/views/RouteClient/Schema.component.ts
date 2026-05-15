import route from "#route/route-client/schema";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  template: `
    <button id="send" (click)="send()">Send</button>
    <button id="send-invalid" (click)="send_invalid()">Send Invalid</button>
    @if (result !== null) { <span id="result">{{ result }}</span> }
    @if (error !== null) { <span id="error">{{ error }}</span> }
  `,
})
export default class SchemaComponent {
  #cdr = inject(ChangeDetectorRef);
  result: string | null = null;
  error: number | null = null;

  async send() {
    const response = await route.post({ body: { foo: "bar" } });
    this.result = JSON.stringify(await response.json());
    this.#cdr.detectChanges();
  }

  async send_invalid() {
    const response = await route.post({ body: { foo: 123 as any } });
    this.error = response.status;
    this.#cdr.detectChanges();
  }
}
