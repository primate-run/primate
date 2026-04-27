import route from "#route/route-client/multipart";
import { NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";

@Component({
  imports: [NgIf],
  template: `
    <button (click)="send()">Send</button>
    <span id="result" *ngIf="result !== null">{{ result }}</span>
  `,
})
export default class MultipartComponent {
  #cdr = inject(ChangeDetectorRef);
  result: string | null = null;

  async send() {
    const body = new FormData();
    body.append("foo", "bar");
    body.append("file", new File(["hello"], "hello.txt", { type: "text/plain" }));
    const response = await route.post({ body });
    this.result = JSON.stringify(await response.json());
    this.#cdr.detectChanges();
  }
}
