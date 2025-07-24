import Module from "#Module";
import test from "@primate/core/db/test";

const m = new Module({
  username: "primate",
  database: "primate",
});
test(m.init(), () => m.deinit());
