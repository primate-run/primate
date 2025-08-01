import root_selector from "#root-selector";
import {
  Component, reflectComponentType, type ComponentDecorator,
} from "@angular/core";
import type Dict from "@rcompat/type/Dict";

type ComponentParameters = Parameters<ComponentDecorator>;

const root_component = ({ imports, template }: ComponentParameters[0]) =>
  Component({
    imports,
    selector: root_selector,
    standalone: true,
    template,
  })(class { });

const double_to_single = (string: string) => string.replaceAll("\"", "'");

export default (component: ComponentDecorator, props: Dict) => {
  const { selector } = reflectComponentType(component)!;
  const attributes = Object.entries(props)
    .map(([key, value]) =>
      `[${key}]="${double_to_single(JSON.stringify(value as Dict, null, 2))}"`)
    .join(" ");

  return root_component({
    imports: [component],
    template: `<${selector} ${attributes}></${selector}>`,
  });
};
