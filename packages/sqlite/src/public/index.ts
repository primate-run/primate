import Database from "#Database";

export default (config?: typeof Database.config) => new Database(config);
