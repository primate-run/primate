import test from "@primate/test";

const browser = test.frontend(import.meta.dirname);

test.frontend.style(browser);
test.frontend.imports(browser);
test.frontend.head(browser);
