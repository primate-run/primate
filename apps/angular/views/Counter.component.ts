import { NgIf } from "@angular/common";
import { Component, Input } from "@angular/core";
import validate from "@primate/angular/validate";
import type Validated from "@primate/angular/Validated";

@Component({
  imports: [NgIf],
  template: `
    <div style="margin-top: 2rem; text-align: center;">
      <h2>Counter Example</h2>
      <div>
        <button (click)="decrement()" [disabled]="loading">-</button>
        <span style="margin: 0 1rem;">{{ value }}</span>
        <button (click)="increment()" [disabled]="loading">+</button>
      </div>
      <p *ngIf="error" style="color:red; margin-top: 1rem;">
        {{ error?.message }}
      </p>
    </div>
  `,
})
export default class CounterComponent {
  @Input() id: string = "";
  @Input("counter") initial: number = 0;

  counter!: Validated<number>;

  get value() {
    return this.counter.value();
  }

  get loading() {
    return this.counter.loading();
  }

  get error() {
    return this.counter.error();
  }

  ngOnInit() {
    this.counter = validate.field<number>(this.initial)
      .post(`/counter?id=${this.id}`);
  }

  increment() {
    this.counter.update(n => n + 1);
  }

  decrement() {
    this.counter.update(n => n - 1);
  }
}
