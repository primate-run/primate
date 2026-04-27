import route from "#route/route-client/blob";
import { NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  imports: [NgIf],
  template: `
    <button (click)="send()">Send</button>
    <span id="result" *ngIf="result !== null">{{ result }}</span>
  `,
})
export default class BlobComponent {
  #cdr = inject(ChangeDetectorRef);
  result: string | null = null;

  async send() {
    const body = new Blob(["hello"], { type: "application/octet-stream" });
    const response = await route.post({ body });
    this.result = new TextDecoder().decode(await response.arrayBuffer());
    this.#cdr.detectChanges();
  }
}
