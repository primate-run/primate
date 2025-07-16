import root_selector from "#root-selector";
import {
  Component, reflectComponentType, type ComponentDecorator,
} from "@angular/core";
import stringify from "@rcompat/record/stringify";
import type Dict from "@rcompat/type/Dict";

type ComponentParameters = Parameters<ComponentDecorator>;

const root_component = ({ template, imports }: ComponentParameters[0]) =>
  Component({
    selector: root_selector,
    imports,
    template,
    standalone: true,
  })(class {});

const double_to_single = (string: string) => string.replaceAll("\"", "'");

export default (component: ComponentDecorator, props: Dict) => {
  const { selector } = reflectComponentType(component)!;
  const attributes = Object.entries(props)
    .map(([key, value]) =>
      `[${key}]="${double_to_single(stringify(value as Dict))}"`)
    .join(" ");

  return root_component({
    imports: [component],
    template: `<${selector} ${attributes}></${selector}>`,
  });
};
