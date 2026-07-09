import route from "@/routes/route-client/text";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  template: `
    <button (click)="send()">Send</button>
    @if (result !== null) { <span id="result">{{ result }}</span> }
  `,
})
export default class TextComponent {
  #cdr = inject(ChangeDetectorRef);
  result: string | null = null;

  async send() {
    const response = await route.post({ body: "hello" });
    this.result = await response.text();
    this.#cdr.detectChanges();
  }
}
