import root_selector from "#root-selector";

export default (depth: number) => {
  const n = depth;

  const layer = (i: number, child: string | null) => {
    const slot = `slot_${i}`;
    const childTemplate = child
      ? `<ng-template #${slot}>${child}</ng-template>`
      : "";

    const inputs = child
      ? `(has(${i + 1}) ? slotInputs(${i}, ${slot}) : inputs(${i}))`
      : `inputs(${i})`;

    return `${childTemplate}
      <ng-container *ngComponentOutlet="comp(${i}); inputs: ${inputs}">
      </ng-container>
    `;
  };

  let body = layer(n, null);
  for (let i = n - 1; i >= 0; i--) body = layer(i, body);

  return `
import {
  Component,
  Input,
  inject,
  ChangeDetectorRef,
  TemplateRef,
} from "@angular/core";
import { CommonModule, NgComponentOutlet } from "@angular/common";
import INITIAL_PROPS from "@primate/angular/INITIAL_PROPS";
import { request } from "@primate/angular/app";

type Dict = Record<string, any>;
type RootProps = {
  views: any[];
  props: Dict[];
  request: any;
  update?: () => void
};

@Component({
  standalone: true,
  selector: "${root_selector}",
  imports: [CommonModule, NgComponentOutlet],
  template: \`<ng-container *ngIf="P as P">${body}</ng-container>\`
})
export default class RootComponent {
  #p!: RootProps;
  #cdr = inject(ChangeDetectorRef);

  constructor() {
    try {
      const initial = inject<any>(INITIAL_PROPS);
      if (initial) {
        this.#p = initial;
        request.set(initial.request);
      }
    } catch {}
  }

  @Input({ required: true })
  set p(value: RootProps) {
    this.#p = value;
    request.set(value.request);
    this.#cdr.markForCheck();
  }

  get p(): RootProps { return this.#p; }
  get P(): RootProps { return this.#p; }

  has(i: number) { return !!this.P?.views?.[i]; }

  comp(i: number) { return this.P?.views?.[i]; }

  inputs(i: number) {
    return (this.P?.props?.[i] ?? {}) as Dict;
  }

  slotInputs(i: number, slot: TemplateRef<unknown>) {
    const base = (this.P?.props?.[i] ?? {}) as Dict;
    return { ...base, slot };
  }
}
`;
};
