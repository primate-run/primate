import Head from "@primate/react/Head";
import t from "@primate/react/i18n";
import locale from "@primate/react/locale";

export default function Translated() {
  const count = 3;

  return (
    <>
      <Head>
        <title>{t("seo.title_home")}</title>
      </Head>

      <h1>{t("home.heading_all_posts")}</h1>

      <p>{t("home.greeting", { name: "Ada" })}</p>
      <p>
        {t("home.counter")}: {t("home.counter_value", { count })}
      </p>
      <p>{t("home.items_count", { count })}</p>

      {/* language switch: use buttons for a11y */}
      <button type="button" onClick={() => locale.set("en-US")}>
        {t("common.english")}
      </button>
      <button type="button" onClick={() => locale.set("de-DE")}>
        {t("common.german")}
      </button>
    </>
  );
}
