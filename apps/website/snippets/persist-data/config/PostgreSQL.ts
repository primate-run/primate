import postgresql from "@primate/postgresql";
import database from "primate/config/database";

export default database({
  default: postgresql({
    database: "app",
  }),
});
