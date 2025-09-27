---
name: Add a Python backend
---

Add Python routes with the `@primate/python` module. Write routes in Python;
Primate compiles them to WebAssembly and wires them like JS routes.

!!!
Manage your Primate Python app as you would a normal Python project. Create a
`venv` and use `requirements.txt` to manage your dependencies to get a complete
LSP experience.
!!!

### 1) Install

Install the Primate Python package.

```sh
npm i @primate/python
```

### 2) Configure

Load the Python module in your configuration.

```ts
import config from "primate/config";
import python from "@primate/python";
export default config({ modules: [python()] });
```

### 3) Write a route

Compose a route in Python.

```py
// routes/index.py
from primate import Route


@Route.get
def get(request):
    return "Hello from Python"

@Route.post
def post(request):
    return {"ok": True}
```
