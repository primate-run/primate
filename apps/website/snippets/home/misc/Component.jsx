import t from "#lib/i18n";

export default function({ username }) {
  return <>
    <h3>{t("switch-language")}</h3>
    <div>
      <a onClick={() => t.locale.set("en-US")}>
        {t("English")}
      </a>
    </div>
    <div>
      <a onClick={() => t.locale.set("de-DE")}>
        {t("German")}
      </a>
    </div>
  </>;
}
