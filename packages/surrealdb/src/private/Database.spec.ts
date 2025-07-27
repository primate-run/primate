import Module from "#Module";
import test from "@primate/core/db/test";

const m = new Module({
  namespace: "primate",
  database: "primate",
  host: "mem",
});
test(await m.init(), () => m.deinit());
