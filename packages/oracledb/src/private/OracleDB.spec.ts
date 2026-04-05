import OracleDB from "#OracleDB";
import core_test from "@primate/core/db/test";

core_test(new OracleDB({
  database: "FREEPDB1",
  username: "primate",
  password: "primate",
}));
