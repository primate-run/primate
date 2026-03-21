import postgresql from "@primate/postgresql";

export default postgresql({
  host: "localhost",
  port: 3306,
  database: "app",
  // username: "user",
  // password: "pass",
});
