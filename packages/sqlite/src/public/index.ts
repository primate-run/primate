import SQLite from "#SQLite";

export default (config?: typeof SQLite.config) => new SQLite(config);
