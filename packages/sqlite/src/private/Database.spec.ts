import Module from "#Module";
import test from "@primate/core/database/test";

const m = new Module();
test(m.init(), () => m.deinit());
