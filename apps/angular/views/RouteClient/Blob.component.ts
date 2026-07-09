import route from "@/routes/route-client/blob";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  template: `
    <button (click)="send()">Send</button>
    @if (result !== null) { <span id="result">{{ result }}</span> }
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
