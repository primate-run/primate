import mysql from "@primate/mysql";

export default mysql({
  database: "app",
  host: "localhost",
  port: 3306,
  // username: "user",
  // password: "pass",
});