import type Font from "#asset/Font";
import type Script from "#asset/Script";
import type Style from "#asset/Style";
import empty from "@rcompat/record/empty";
import type Dict from "@rcompat/type/Dict";

const attribute = (attributes: Dict<string>) => empty(attributes)
  ? ""
  : " ".concat(Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`).join(" "))
  ;
const tag = (name: string, { attributes = {}, close = true, code = "" }) =>
  `<${name}${attribute(attributes)}${close ? `>${code}</${name}>` : "/>"}`;
const nctag = (name: string, properties: Dict) =>
  tag(name, { ...properties, close: false });

export default {
  font({ as = "font", crossorigin = "true", href, rel = "preload", type }: Font) {
    return nctag("link", { attributes: { as, crossorigin, href, rel, type } });
  },
  // inline: <script type integrity>...</script>
  // outline: <script type integrity src></script>
  script({ code, id, inline, integrity, src, type }: Script) {
    return inline
      ? id === undefined
        ? tag("script", { attributes: { integrity, type }, code })
        : tag("script", { attributes: { id, integrity, type }, code })
      : tag("script", { attributes: { integrity, src, type } });
  },
  // inline: <style>...</style>
  // outline: <link rel="stylesheet" href />
  style({ code, href, inline }: Style) {
    return inline
      ? tag("style", { code })
      : nctag("link", { attributes: { href, rel: "stylesheet" } });
  },
};
