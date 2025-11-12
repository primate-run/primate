import { loadPyodide, type PyodideAPI } from "pyodide";

let pyodide: PyodideAPI | null = null;

export default async function(): Promise<PyodideAPI> {
  if (!pyodide)
    pyodide = await loadPyodide({ indexURL: "./node_modules/pyodide" });
  return pyodide;
}
