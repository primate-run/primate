import MongoDB from "#MongoDB";
import test from "@primate/core/db/test";

test(new MongoDB({
  host: "127.0.0.1",
  database: "primate",
  username: "primate",
  password: "primate",
}));
