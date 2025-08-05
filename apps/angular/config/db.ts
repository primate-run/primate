import db from "primate/config/db";
import sqlite from "@primate/sqlite";

export default db({
  default: sqlite(),
});
