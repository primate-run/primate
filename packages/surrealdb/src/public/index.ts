import SurrealDB from "#SurrealDB";

export default (config: typeof SurrealDB.config) => new SurrealDB(config);
