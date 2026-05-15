import oracledb from "@primate/oracledb";

export default oracledb({
  host: "localhost",
  port: 1521,
  database: "FREEPDB1",
  // username: "user",
  // password: "pass",
});
