---
name: Implement a real-time chat with `WebSocket`
---

You can use the `ws` handler to upgrade a `GET` route to `WebSocket`. To use
this to implement a real-time chat application, first create a HTML client.

!!!
This assumes you have [installed and loaded](/guides/load-modules)
`@primate/html` in your config file.
!!!

---

The HTML frontend will automatically extract `<style>` and `<script>` tags and
bundle them into the rest of your application.

[s=guides/responses/websocket-chat/component]

---

Serve the client from the index route (`/`).

[s=guides/responses/websocket-chat/index]

---

At the `/ws` route, upgrade with the `ws` handler, maintaining a list of active
web socket connections and distributing messages to all active chat
participants.

[s=guides/responses/websocket-chat/ws]
