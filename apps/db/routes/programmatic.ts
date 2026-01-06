import assert from "@rcompat/assert";
import stores from "app:stores";
import Store from "primate/db/Store";
import route from "primate/route";

route.get(() => {
  return app => {
    const key = Object.keys(stores).filter(k => k === "User")[0];
    assert.defined(key);
    assert.instance(stores[key], Store);

    return new Response(key);
  };
});
