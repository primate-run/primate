import type Verb from "@primate/core/request/Verb";
import route from "primate/route";
import instantiate from "primate/wasm/instantiate";

const instantiated = await instantiate({
  filename: "__FILENAME__",
  // @ts-expect-error: this identifier is replaced by an index of stores at
  // compile time
  stores: __STORES__,
});

Object.entries(instantiated.api).forEach(([verb, fn]) => {
  route[verb as Verb](fn);
});
