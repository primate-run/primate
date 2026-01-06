import MongoDB from "#MongoDB";

export default (config: typeof MongoDB.config) => new MongoDB(config);
