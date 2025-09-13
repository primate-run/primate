import t from "#i18n";

export default function Translated({ count }: { count: number }) {
  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("greet_user", { name: "John" })}</p>
      <p>{t("counter", { count })}</p>

      <button onClick={() => t.locale.set("en-US")}>{t("english")}</button>
      <button onClick={() => t.locale.set("de-DE")}>{t("german")}</button>
    </>
  );
}
