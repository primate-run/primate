import route from "#route/route-client/text";
import { NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  imports: [NgIf],
  template: `
    <button (click)="send()">Send</button>
    <span id="result" *ngIf="result !== null">{{ result }}</span>
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
