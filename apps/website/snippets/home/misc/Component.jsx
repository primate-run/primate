import t from "@primate/react/i18n";
import locale from "@primate/react/locale";

export default function({ username }) {
  return <>
    <h3>{t("switch-language")}</h3>
    <div>
      <a onClick={() => locale.set("en-US")}>
        {t("English")}
      </a>
    </div>
    <div>
      <a onClick={() => locale.set("de-DE")}>
        {t("German")}
      </a>
    </div>
  </>;
}
