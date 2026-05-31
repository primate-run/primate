export default (depth: number) => {
  const view = (i: number) =>
    `<\${input.views[${i}]} ...input.props[${i}] />`;

  const layout = (i: number, child: string) => [
    `<if=input.views[${i + 1}]>`,
    `<\${input.views[${i}]} ...input.props[${i}]>`,
    child,
    "</>",
    "</if>",
    "<else>",
    view(i),
    "</else>",
  ].join("\n");

  const body = Array.from({ length: depth }, (_, i) => i)
    .reduceRight(
      (child, i) => layout(i, child),
      view(depth),
    );

  return `import { request } from "@primate/marko/app";
<const/{ context, path, ...public_request }=input.request/>
<const/_request=request.set(public_request)/>
${body}`;
};
