import PostgreSQL from "#PostgreSQL";

export default (config: typeof PostgreSQL.config) => new PostgreSQL(config);
