import AppFacade from "#app/Facade";
import schema from "#config/schema";

export default (input: typeof schema.input = {}) =>
  new AppFacade(schema.parse(input));
;
