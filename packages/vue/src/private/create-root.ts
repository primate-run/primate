export default (depth: number, i18n_active: boolean) => {
  const n = depth - 1;

  const build_view = (index: number): string => {
    // anchor case: render the deepest view
    if (index === n) return `h(p.views[${index}], p.props[${index}] || {})`;
    else {
      // recursive case: render view with child
      const child = build_view(index + 1);
      return `h(p.views[${index}], p.props[${index}] || {}, () => [${child}])`;
    }
  };

  const body = depth > 0 ? build_view(0) : "h(\"div\")";

  const vueImports =
    `import {
    defineComponent, h${i18n_active ? ", ref, onMounted, onUnmounted" : ""}
    } from "vue";`;
  const i18nImports = i18n_active
    ? `
import t from "#i18n";
import sInternal from "primate/s/internal";`
    : "";
  const i18nSetup = i18n_active
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
${vueImports}
${i18nImports}
export default defineComponent({
  name: "root",
  props: { p: { type: Object, required: true } },
  setup(props) {
    ${i18nSetup}
    return () => {
      const p = props.p;
      return ${body};
    };
  },
});
`;
};
