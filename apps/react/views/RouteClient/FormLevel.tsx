import { client } from "@primate/react";
import route from "#route/route-client/form-level";

export default function ClientRouteFormLevel() {
  const form = client.form(route.post);

  return (
    <form id={form.id} onSubmit={form.submit}>
      <input id="foo" name="foo" />
      <button id="send" type="submit">Send</button>
      {form.submitted && <span id="result">ok</span>}
      {form.errors.length > 0 && <span id="error">{form.errors[0]}</span>}
    </form>
  );
}
