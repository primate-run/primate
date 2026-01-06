import MongoDB from "#MongoDB";
import test from "@primate/core/db/test";

test(new MongoDB({ database: "primate", username: "primate" }));
