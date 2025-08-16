import mysql from "@primate/mysql";
import database from "primate/config/database";

export default database({
  default: mysql({
    database: "app",
  }),
});
