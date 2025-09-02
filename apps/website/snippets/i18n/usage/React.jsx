import t from "@primate/react/i18n";
import locale from "@primate/react/locale";

export default function Translated() {
  return (
    <>
      <h1>{t("All posts")}</h1>

      {/* switch language */}
      <a onClick={() => locale.set("en-US")}>{t("English")}</a>
      <a onClick={() => locale.set("de-DE")}>{t("German")}</a>
    </>
  );
}
