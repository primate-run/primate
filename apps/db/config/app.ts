import db from "../config/db/index.ts";
import config from "primate/config";

export default config({
  http: {
    port: 10002,
  },
  db: {
    migrations: {
      table: "migration",
      db,
    },
  },
});
