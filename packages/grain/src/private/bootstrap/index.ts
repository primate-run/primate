import type Verb from "@primate/core/request/Verb";
import route from "primate/route";
import instantiate from "primate/wasm/instantiate";

const instantiated = await instantiate({
  filename: "__FILENAME__",
});

Object.entries(instantiated.api).forEach(([verb, fn]) => {
  route[verb as Verb](fn);
});
