import route from "#route/route-client/path/[name]";
import { Component, signal } from "@angular/core";

@Component({
  template: `
    <button (click)="send()">Send</button>
    @if (result() !== null) {
      <span id="result">{{ stringify(result()) }}</span>
    }
  `,
})
export default class Path {
  result = signal<unknown>(null);
  stringify = JSON.stringify;

  async send() {
    const response = await route.post({ path: { name: "hello" } });
    this.result.set(await response.json());
  }
}
