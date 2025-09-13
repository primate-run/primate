import root_selector from "#root-selector";

export default (depth: number, i18n_active: boolean) => {
  const n = depth - 1;

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

  const i18n_imports = i18n_active
    ? `import t from "#i18n";
import sInternal from "primate/s/internal";`
    : "";

  const i18n_setup = i18n_active ?
    `if (this.#p.request.context.i18n.locale) {
  t[sInternal].init(this.#p.request.context.i18n.locale);
  }
  this.#off = t.subscribe(() => this.#cdr.markForCheck());
`
    : "";

  return `
import {
  Component,
  Input,
  inject,
  ChangeDetectorRef,
  OnDestroy,
  TemplateRef,
  AfterViewInit,
} from "@angular/core";
import { CommonModule, NgComponentOutlet } from "@angular/common";
import INITIAL_PROPS from "@primate/angular/INITIAL_PROPS";
${i18n_imports}

type Dict = Record<string, any>;
type RootProps = {
  components: any[];
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
export default class RootComponent implements OnDestroy {
  #p!: RootProps;
  #cdr = inject(ChangeDetectorRef);
  #off?: () => void;

  constructor() {
    try {
      const initial = inject<any>(INITIAL_PROPS);
      if (initial) this.#p = initial;
    } catch {}
    ${i18n_setup}
  }

  @Input({ required: true })
  set p(value: RootProps) {
    this.#p = value;
    this.#cdr.markForCheck();  // root on default CD, zone ticks traverse
  }
  get p(): RootProps { return this.#p; }
  get P(): RootProps { return this.#p; }

  // is there a component at index i?
  has(i: number) { return !!this.P?.components?.[i]; }

  // component type for index i
  comp(i: number) { return this.P?.components?.[i]; }

  // per-layer inputs without slot
  inputs(i: number) {
    return (this.P?.props?.[i] ?? {}) as Dict;
  }

  // per-layer inputs + slot template (only used when has(i+1) is true)
  slotInputs(i: number, slot: TemplateRef<unknown>) {
    const base = (this.P?.props?.[i] ?? {}) as Dict;
    return { ...base, slot };
  }

  ngAfterViewInit() {
    t[sInternal].restore();
  }

  ngOnDestroy() { this.#off?.(); }
}
`;
};
