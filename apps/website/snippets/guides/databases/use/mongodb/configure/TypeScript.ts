import mongodb from "@primate/mongodb";

export default mongodb({
  host: "localhost",
  port: 27017,
  database: "app",
  // username: "user",
  // password: "pass",
});
