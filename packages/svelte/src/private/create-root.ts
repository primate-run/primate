export default (depth: number) => {
  const view = (i: number) =>
    `<\${input.views[${i}]} ...input.props[${i}] request=primateRequest />`;

  const layout = (i: number, child: string) => [
    `<if=input.views[${i + 1}]>`,
    `<\${input.views[${i}]} ...input.props[${i}] request=primateRequest>`,
    child,
    "</>",
    "</if>",
    "<else>",
    view(i),
    "</else>",
  ].join("\n");

  return [
    "<const/primateRequest={ ...input.request, url: new URL(input.request.url) }/>",
    Array.from({ length: depth }, (_, i) => i)
      .reduceRight(
        (child, i) => layout(i, child),
        view(depth),
      ),
  ].join("\n");
};
