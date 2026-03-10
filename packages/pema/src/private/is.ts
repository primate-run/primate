import IsType from "#IsType";

export default <T>(predicate: (x: unknown) => x is T) => new IsType(predicate);
