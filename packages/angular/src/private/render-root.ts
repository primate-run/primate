import root_selector from "#root-selector";
import {
  Component, reflectComponentType, type ComponentDecorator,
} from "@angular/core";
import type Props from "@primate/core/frontend/Props";
import stringify from "@rcompat/record/stringify";
import type Dictionary from "@rcompat/type/Dictionary";

const root_component = ({ template, imports }: Parameters<ComponentDecorator>[0]) =>
  Component({
    selector: root_selector,
    imports,
    template,
    standalone: true,
  })(class {});

const double_to_single = (string: string) => string.replaceAll("\"", "'");

export default (component: ComponentDecorator, props: Props) => {
  const { selector } = reflectComponentType(component)!;
  const attributes = Object.entries(props)
    .map(([key, value]) => `[${key}]="${double_to_single(stringify(value as Dictionary))}"`)
    .join(" ");

  return root_component({
    imports: [component],
    template: `<${selector} ${attributes}></${selector}>`,
  });
};
