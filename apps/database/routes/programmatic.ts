import assert from "@rcompat/assert";
import stores from "app:stores";
import Store from "primate/database/Store";
import route from "primate/route";

route.get(() => {
  return app => {
    const key = Object.keys(stores).filter(k => k === "User")[0];
    assert(key !== undefined);
    assert(stores[key] instanceof Store);

    return new Response(key);
  };
});
