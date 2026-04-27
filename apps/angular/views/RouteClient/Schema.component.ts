import route from "#route/route-client/schema";
import { NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  imports: [NgIf],
  template: `
    <button id="send" (click)="send()">Send</button>
    <button id="send-invalid" (click)="send_invalid()">Send Invalid</button>
    <span id="result" *ngIf="result !== null">{{ result }}</span>
    <span id="error" *ngIf="error !== null">{{ error }}</span>
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
