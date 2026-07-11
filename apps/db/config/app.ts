import config from "primate/config";
import db from "./db.ts";

export default config({
  db: {
    migrations: {
      table: "migration",
      db,
      autoapply: true,
    },
  },
});
