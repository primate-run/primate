import surrealdb from "@primate/surrealdb";
import db from "primate/config/db";

export default db({
  default: surrealdb({
    database: "app",
  }),
});
