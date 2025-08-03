import mongodb from "@primate/mongodb";
import db from "primate/config/db";

export default db({
  default: mongodb({
    database: "app",
  }),
});
