import test from "@primate/core/db/test";
import Database from "#Database";
import Client from "@rcompat/sqlite";

test(new Database(new Client(":memory:", { safeIntegers: true })));
