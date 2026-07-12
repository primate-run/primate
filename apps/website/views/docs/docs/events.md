---
title: Events
---

# Events

Use `primate/events` for small in-memory event channels inside one running app
process.

```ts
// services/ItemEvents.ts
import events from "primate/events";

type ItemEvent =
  | { type: "comment.created"; comment: { id: number; body: string } }
  | { type: "item.status.changed"; status: string };

export default events.channel<number, ItemEvent>();
```

Emit events with a key.

```ts
import ItemEvents from "@/services/ItemEvents";

ItemEvents.emit(item.id, {
  type: "comment.created",
  comment: { id: comment.id, body: comment.body },
});
```

Subscribe to events for a key. `subscribe` returns an unsubscribe function.

```ts
const unsubscribe = ItemEvents.subscribe(item.id, event => {
  console.log(event.type);
});

unsubscribe();
```

## With SSE

Channels pair naturally with `response.sse`.

```ts
import ItemEvents from "@/services/ItemEvents";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    const item_id = Number(request.query.get("item"));

    return response.sse(source => {
      return ItemEvents.subscribe(item_id, event => {
        source.send(event.type, event);
      });
    });
  },
});
```

When the browser disconnects, Primate calls the function returned from
`response.sse`, which unsubscribes from the channel.

## Scope

`primate/events` is local and in-memory. It does not persist events and does not
broadcast across multiple server processes or machines. If your app runs more
than one instance, events only reach clients connected to the same instance that
emitted them.
