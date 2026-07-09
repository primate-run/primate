import t from "@/lib/i18n";

export default function I18NIndex() {
  return <>
    <span id="locale">{t.locale.get()}</span>
    <span id="title">{t("title")}</span>
    <button id="de" onClick={() => t.locale.set("de-DE")}>
      {t("german")}
    </button>
    <button id="en" onClick={() => t.locale.set("en-US")}>
      {t("english")}
    </button>
  </>;
}
