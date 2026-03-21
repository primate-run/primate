import mysql from "@primate/mysql";

export default mysql({
  host: "localhost",
  port: 3306,
  database: "app",
  // username: "user",
  // password: "pass",
});
