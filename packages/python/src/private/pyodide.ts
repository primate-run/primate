import { loadPyodide } from "pyodide";

export default async function(): Promise<any> {
  return await loadPyodide({ indexURL: "./node_modules/pyodide" });
}
