---
title: Add a Python backend
---

Add Python routes with the `@primate/python` module. Write routes in Python;
Primate compiles them to WebAssembly and wires them like JS routes.

!!!
Manage your Primate Python app as you would a normal Python project. Create a
`venv` and use `requirements.txt` to manage your dependencies to get a complete
LSP experience.
!!!

---

### 1) Install

Install the Primate Python package.

[s=guides/backends/add-a-python-backend/install]

---

### 2) Configure

Load the Python module in your configuration.

[s=guides/backends/add-a-python-backend/configure]

---

### 3) Write a route

Compose a route in Python.

[s=guides/backends/add-a-python-backend/write-a-route]
