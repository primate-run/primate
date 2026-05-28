import test from "@primate/test";

const browser = test.frontend(import.meta.dirname);

test.frontend.imports(browser);
test.frontend.head(browser);
