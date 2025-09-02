import Database from "#Database";
import test from "@primate/core/database/test";

test(new Database({ database: "primate", host: "mem", namespace: "primate" }));
