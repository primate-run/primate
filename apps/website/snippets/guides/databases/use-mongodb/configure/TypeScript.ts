import mongodb from "@primate/mongodb";

export default mongodb({
  database: "app",
  host: "localhost",
  port: 27017,
  // username: "user",
  // password: "pass",
});
