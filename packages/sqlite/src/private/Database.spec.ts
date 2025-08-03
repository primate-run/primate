import Module from "#Module";
import test from "@primate/core/db/test";

const m = new Module();
test(m.init(), () => m.deinit());
