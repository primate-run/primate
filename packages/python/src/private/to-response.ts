import { unwrap } from "#unwrap";
import type { PyProxy } from "pyodide/ffi";

export default (raw_response: PyProxy) => unwrap(raw_response);
