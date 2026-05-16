import sqlite from "@primate/sqlite";

const db = sqlite({ database: "./data.db" });

export default db;
