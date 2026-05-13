import route from "#route/route-client/path-action/[name]";
import { client } from "@primate/solid";

export default function PathAction({ name }: { name: string }) {
  const form = client.form(route.post, { path: { name } });
  return (
    <form id={form.id} onSubmit={form.submit}>
      <input id="foo" name="foo" />
      <button id="send" type="submit">Send</button>
      {form.submitted && <span id="result">{JSON.stringify(form.result)}</span>}
      {form.field("foo").error && <span id="error">{form.field("foo").error}</span>}
    </form>
  );
}
