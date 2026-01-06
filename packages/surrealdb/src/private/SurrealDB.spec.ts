import SurrealDB from "#SurrealDB";
import test from "@primate/core/db/test";

test(new SurrealDB({ database: "primate", host: "mem", namespace: "primate" }));
