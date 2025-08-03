import mysql from "@primate/mysql";
import db from "primate/config/db";

export default db({
  default: mysql({
    database: "app",
  }),
});
