import type { PyProxy } from "pyodide/ffi";
import { unwrap } from "./unwrap.js";

export default (raw_response: PyProxy) => unwrap(raw_response);
