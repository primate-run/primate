import t from "#i18n";

export default function Translated(props: { count: number }) {
  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("greet_user", { name: "John" })}</p>
      <p>{t("counter", { count: props.count })}</p>
      <button onClick={() => t.locale.set("en")}>{t("english")}</button>
      <button onClick={() => t.locale.set("de")}>{t("german")}</button>
    </>
  );
}
