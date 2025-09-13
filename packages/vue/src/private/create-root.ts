export default (depth: number, i18n_active: boolean) => {
  const n = depth - 1;

  // Build the nested component structure more carefully
  const buildComponent = (index: number): string => {
    if (index === n) {
      // Base case: render the deepest component
      return `h(p.components[${index}], p.props[${index}] || {})`;
    } else {
      // Recursive case: render component with child
      const child = buildComponent(index + 1);
      return `h(p.components[${index}], p.props[${index}] || {}, () => [${child}])`;
    }
  };

  const body = depth > 0 ? buildComponent(0) : "h(\"div\")";

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
