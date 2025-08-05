import { AsyncPipe, NgIf } from "@angular/common";
import { Component, Input } from "@angular/core";
import validate from "@primate/angular/validate";

@Component({
  imports: [AsyncPipe, NgIf],
  selector: "app-counter",
  standalone: true,
  template: `
    <div style="margin-top: 2rem; text-align: center;">
      <h2>Counter Example</h2>
      <div>
        <button (click)="decrement()" [disabled]="loading$ | async">-</button>
        <span style="margin: 0 1rem;">{{ value$ | async }}</span>
        <button (click)="increment()" [disabled]="loading$ | async">+</button>
      </div>
      <p *ngIf="(error$ | async) as error" style="color:red; margin-top: 1rem;">
        {{ error.message }}
      </p>
    </div>
  `,
})
export default class CounterComponent {
  @Input() id!: string;
  @Input() value!: number;

  counter!: ReturnType<ReturnType<typeof validate<number>>["post"]>;
  value$!: typeof this.counter.value;
  loading$!: typeof this.counter.loading;
  error$!: typeof this.counter.error;

  ngOnInit() {
    this.counter = validate<number>(this.value).post(
      `/counter?id=${this.id}`,
      value => ({ value }),
    );

    this.value$ = this.counter.value;
    this.loading$ = this.counter.loading;
    this.error$ = this.counter.error;
  }

  increment() {
    this.counter.update(n => n + 1);
  }

  decrement() {
    this.counter.update(n => n - 1);
  }
}
