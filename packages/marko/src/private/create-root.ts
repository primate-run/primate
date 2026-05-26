export default (depth: number, i18n_active: boolean) => {
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

  const i18n_imports = i18n_active
    ? `
import t from "#i18n";
import { internal } from "primate/i18n";
`
    : "";

  const i18n_init = i18n_active
    ? `
<const/i18n_state=typeof document === "undefined"
  ? undefined
  : render_runtime.slot(invalidate => ({
    initialized: false,
    invalidate,
  })) />
<const/server=input.request.context.i18n.locale/>
<const/should_init=i18n_state === undefined || render_runtime.once(i18n_state)/>
<const/_server_init=server !== undefined
  && should_init
  && server !== t.locale.get()
  && t[internal].init(server)/>
<lifecycle
  onMount() {
    let first = true;
    this.off = t.onChange(() => {
      if (first) {
        first = false;
        return;
      }

      i18n_state?.invalidate();
    });
    t[internal].restore();
  }
  onDestroy() {
    this.off?.();
  }
>
`
    : "";

  return `
import { render_runtime, request } from "@primate/marko/app";
${i18n_imports}
<const/{ context, path, ...public_request }=input.request/>
<const/_request=request.set(public_request)/>
${i18n_init}
${body}
`;
};
