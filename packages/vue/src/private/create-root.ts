export default function createRoot(depth: number, i18n_active: boolean) {
  const build_view = (index: number): string => {
    if (index > depth) return `h("div")`;
    if (index === depth) return `h(p.views[${index}], p.props[${index}] || {})`;
    const child = build_view(index + 1);
    return `h(p.views[${index}], p.props[${index}] || {}, () => [${child}])`;
  };

  const body = `h(Suspense, null, { default: () => ${build_view(0)} })`;

  const vue_imports = `
    import {
      defineComponent, h, Suspense
      ${i18n_active ? ", ref, onMounted, onUnmounted" : ""}
    } from "vue";
    import { setRequest } from "@primate/vue/app";
    `;
  const i18n_imports = i18n_active
    ? `
import t from "#i18n";
import sInternal from "primate/s/internal";`
    : "";
  const i18n_setup = i18n_active
    ? `
const initialLocale = props.p?.request?.context?.i18n?.locale;
if (initialLocale) t[sInternal].init(initialLocale);

onMounted(() => { t[sInternal].restore(); });

if (typeof window !== "undefined") {
  const version = ref(t[sInternal].version);
  const removeDepend = t[sInternal].depend(() => { void version.value; });
  const unsubscribe = t.onChange(() => {
    version.value = t[sInternal].version;
  });
  onUnmounted(() => { unsubscribe?.(); removeDepend?.(); });
}`
    : "";
  return `
${vue_imports}
${i18n_imports}
export default defineComponent({
  name: "root",
  props: { p: { type: Object, required: true } },
  setup(props) {
    ${i18n_setup}
    return () => {
      const p = props.p;
      setRequest(props.p.request);
      return ${body};
    };
  },
});
`;
};
