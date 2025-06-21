import instantiate from "#wasm/instantiate";
export default instantiate;

/**
 * This is to make the API wasm types portable.
 * 
 * The error in the console looks like this:
 * src/private/bootstrap/index.ts(8,7): error TS2742: The inferred type of 'api' cannot be named without a
 * reference to '../../../node_modules/@primate/core/src/private/wasm/instantiate.js'. This is likely not portable.
 */
export type * from "#wasm/instantiate";