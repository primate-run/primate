import root_selector from "#root-selector";

export default () => `
  import { Component, reflectComponentType } from "@angular/core";
  import stringify from "@primate/angular/stringify";

  const root_component = ({ template, imports }) => Component({
    selector: "${root_selector}",
    imports,
    template,
    standalone: true,
  })(class {});
  const singlify = string => string.replaceAll('"', "'");

export default (component, props) => {
  const { selector } = reflectComponentType(component);
  const attributes = Object.entries(props)
    .map(([key, value]) => \`[\${key}]="\${singlify(stringify(value))}"\`)
    .join(" ");

  return root_component({
    imports: [component],
    template: \`<\${selector} \${attributes}></\${selector}>\`,
  });
};`;
