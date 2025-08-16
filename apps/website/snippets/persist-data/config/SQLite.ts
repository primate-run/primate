import sqlite from "@primate/sqlite";
import database from "primate/config/database";

export default database({
  default: sqlite({
    database: "/tmp/app.db",
  }),
});
