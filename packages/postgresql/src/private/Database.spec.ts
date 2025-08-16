import Module from "#Module";
import test from "@primate/core/database/test";

const m = new Module({
  database: "primate",
  username: "primate",
});
test(m.init(), () => m.deinit());
