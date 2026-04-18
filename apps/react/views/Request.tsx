export default function Request(props: { request?: "foo" }) {
  return <span id="request">{props.request}</span>;
}
