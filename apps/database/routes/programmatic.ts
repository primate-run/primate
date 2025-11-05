import assert from "@rcompat/assert";
import Store from "primate/database/Store";
import route from "primate/route";

route.get(() => {
  return app => {
    const key = Object.keys(app.stores).filter(k => k === "User")[0];
    assert(key !== undefined);
    assert(app.stores[key] instanceof Store);

    return new Response(key);
  };
});
