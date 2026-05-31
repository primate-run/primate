export default function createRoot(depth: number) {
  const build_view = (index: number): string => {
    if (index > depth) return `h("div")`;
    if (index === depth) return `h(p.views[${index}], p.props[${index}] || {})`;

    const child = build_view(index + 1);

    return `h(p.views[${index}], p.props[${index}] || {}, () => [${child}])`;
  };

  const body = `h(Suspense, null, { default: () => ${build_view(0)} })`;

  return `
import { defineComponent, h, Suspense } from "vue";
import { setRequest } from "@primate/vue/app";

export default defineComponent({
  name: "root",
  props: { p: { type: Object, required: true } },

  setup(props) {
    return () => {
      const p = props.p;

      setRequest(p.request);

      return ${body};
    };
  },
});
`;
}
