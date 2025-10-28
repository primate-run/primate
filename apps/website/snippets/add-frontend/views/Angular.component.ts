import { CommonModule } from "@angular/common";
import type { OnInit } from "@angular/core";
import { Component, Input } from "@angular/core";

@Component({
  imports: [CommonModule],
  selector: "app-counter",
  standalone: true,
  template: `
    <div style="text-align: center; margin-top: 2rem;">
      <h2>Counter Example</h2>
      <div>
        <button (click)="decrement()">-</button>
        <span style="margin: 0 1rem;">{{ count }}</span>
        <button (click)="increment()">+</button>
      </div>
    </div>
  `,
})
export default class CounterComponent implements OnInit {
  @Input() start = 0;
  counter = 0;

  ngOnInit() {
    this.counter = this.start;
  }

  increment() {
    this.counter++;
  }

  decrement() {
    this.counter--;
  }
}
