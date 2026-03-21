import sqlite from "@primate/sqlite";

export default sqlite({
  database: "/tmp/app.db", // or ":memory:" for in-memory
});
