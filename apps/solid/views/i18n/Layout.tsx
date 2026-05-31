import t from "#lib/i18n";

export default function I18NLayout(props: any) {
  return <>
    <span id="layout-locale">{t.locale.get()}</span>
    {props.children}
  </>;
}
