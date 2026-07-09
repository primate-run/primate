import route from "@/routes/route-client/action-redirect";
import client from "@primate/solid/client";

export default function ClientRouteActionRedirect() {
  const form = client.form(route.post);

  return <form id={form.id} onSubmit={form.submit}>
    <button id="send" type="submit">Send</button>
  </form>;
}
