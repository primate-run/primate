import mongodb from "@primate/mongodb";
import database from "primate/config/database";

export default database({
  default: mongodb({
    database: "app",
  }),
});
