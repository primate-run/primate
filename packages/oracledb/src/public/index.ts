import OracleDB from "#OracleDB";

export default (config: typeof OracleDB.config) => new OracleDB(config);
