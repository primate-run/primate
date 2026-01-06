import MySQL from "#MySQL";

export default (config: typeof MySQL.config) => new MySQL(config);
