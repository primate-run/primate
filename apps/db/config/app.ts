import db from "@/config/db";
import config from "primate/config";

export default config({
  db: {
    migrations: {
      table: "migration",
      db,
      autoapply: true,
    },
  },
});
