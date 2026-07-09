import route from "@/routes/route-client/optional-path/[[name]]";
import { Component, input, signal } from "@angular/core";

@Component({
  template: `
    <button (click)="send()">Send</button>
    @if (result() !== null) {
      <span id="result">{{ stringify(result()) }}</span>
    }
  `,
})
export default class Path {
  name = input.required<string>();
  result = signal<unknown>(null);
  stringify = JSON.stringify;

  async send() {
    const response = await route.post({ path: { name: this.name() } });
    this.result.set(await response.json());
  }
}
