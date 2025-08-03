import postgresql from "@primate/postgresql";
import db from "primate/config/db";

export default db({
  default: postgresql({
    database: "app",
  }),
});
