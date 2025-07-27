import Module from "#Module";
import test from "@primate/core/db/test";

const m = new Module({
  username: "primate",
  database: "primate",
});
test(await m.init(), () => m.deinit());
