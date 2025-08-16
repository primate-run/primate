import database from "primate/config/database";
import sqlite from "@primate/sqlite";

export default database({
  default: sqlite(),
});
