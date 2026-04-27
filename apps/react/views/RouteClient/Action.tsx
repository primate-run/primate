import { client } from "@primate/react";
import route from "#route/route-client/action";

export default function ClientRouteAction() {
  const form = client.form(route.post);

  return (
    <form id={form.id} onSubmit={form.submit}>
      <input id="foo" name="foo" />
      <button id="send" type="submit">Send</button>
      {form.submitted && <span id="result">{JSON.stringify({ foo: "hello" })}</span>}
      {form.field("foo").error && <span id="error">{form.field("foo").error}</span>}
    </form>
  );
}
