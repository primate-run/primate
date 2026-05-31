import { Component, computed, input } from "@angular/core";
import client from "@primate/angular/client";

@Component({
  template: `
    <div style="margin-top: 2rem; text-align: center;">
      <h2>Counter Example</h2>
      <div>
        <button (click)="decrement()" [disabled]="loading">-</button>
        <span style="margin: 0 1rem;">{{ value }}</span>
        <button (click)="increment()" [disabled]="loading">+</button>
      </div>
      @if (error) {
        <p style="color:red; margin-top: 1rem;">
          {{ error?.message }}
        </p>
      }
    </div>
  `,
})
export default class CounterComponent {
  id = input<boolean>(false);
  counter = input<number>(0);
  c = computed(() => {
    return client.field(this.counter()).post(`/counter?id=${this.id()}`);
  });

  get value() {
    return this.c().value();
  }

  get loading() {
    return this.c().loading();
  }

  get error() {
    return this.c().error();
  }

  increment() {
    this.c().update(n => n + 1);
  }

  decrement() {
    this.c().update(n => n - 1);
  }
}
