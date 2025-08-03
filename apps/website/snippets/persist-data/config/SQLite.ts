import sqlite from "@primate/sqlite";
import db from "primate/config/db";

export default db({
  default: sqlite({
    database: "/tmp/app.db",
  }),
});
