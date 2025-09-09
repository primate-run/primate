import Store from "@primate/core/database/Store";
import assert from "@rcompat/assert";
import route from "primate/route";

route.get(() => {
  return app => {
    const key = Object.keys(app.stores)[0];
    assert(key === "User");
    assert(app.stores[key] instanceof Store);

    return new Response(key);
  };
});
