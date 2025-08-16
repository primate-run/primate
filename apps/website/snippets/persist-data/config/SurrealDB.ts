import surrealdb from "@primate/surrealdb";
import database from "primate/config/database";

export default database({
  default: surrealdb({
    database: "app",
  }),
});
