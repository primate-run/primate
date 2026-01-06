import PostgreSQL from "#PostgreSQL";
import test from "@primate/core/db/test";

test(new PostgreSQL({ database: "primate", username: "primate" }));
