# Python

Primate runs [Python][Documentation] with WebAssembly compilation,
strongly-typed validation, sessions, and server-side routing.

## Setup

### Install Python

First, install Python 3.8 or later from the [official website][Python].

### Install Module

```bash
npm install @primate/python
```

### Configure

```ts
import config from "primate/config";
import python from "@primate/python";

export default config({
  modules: [python()],
});
```

### Initialize Python

Create a `requirements.txt` file in your project root to specify Python
dependencies:

```txt
numpy
```

Install the Primate Python dependency:

```bash
pip install primate-run
```

Primate will automatically install packages listed in `requirements.txt` when
compiling routes to WebAssembly.

## Routes

Create Python route handlers in `routes` using `.py` files. Routes are
compiled to WebAssembly and run in the JavaScript runtime.

```python
# routes/hello.py
from primate import Route

@Route.get
def get(request):
    return "Hello, world!"
```

### HTTP Methods

All standard HTTP methods are supported:

```python
from primate import Route

@Route.get
def get(request):
    return "GET request"

@Route.post
def post(request):
    return "POST request"

@Route.put
def put(request):
    return "PUT request"

@Route.delete
def delete(request):
    return "DELETE request"
```

## Request Handling

### Query Parameters

Access query parameters through the `query` request bag:

```python
# routes/query.py
from primate import Route

@Route.get
def get(request):
    if request.query.has("foo"):
        return request.query.get("foo")
    else:
        return "foo missing"
```

### Request Body

Handle different body types based on content:

#### JSON Body

```python
# routes/json.py
from primate import Route

@Route.post
def post(request):
    return request.body.json()
```

#### Form Fields

```python
# routes/form.py
from primate import Route

@Route.post
def post(request):
    return request.body.form()
```

#### Text Body

```python
# routes/text.py
from primate import Route

@Route.post
def post(request):
    return request.body.text()
```

#### Binary Data

```python
# routes/binary.py
from primate import Route

@Route.post
def post(request):
    bin_data = request.body.binary()

    return {
        "type": bin_data.content_type,
        "size": bin_data.size,
        "head": bin_data.head(4)
    }
```

### File Uploads

Handle multipart file uploads:

```python
# routes/upload.py
from primate import Route

@Route.post
def post(request):
    # get form fields
    fields = request.body.form()

    # get uploaded files
    files = request.body.files()

    # process files
    file_info = []
    for file in files:
        file_info.append({
            "field": file.field,           # form field name
            "name": file.filename,         # original filename
            "type": file.content_type,     # MIME type
            "size": file.size,             # file size in bytes
            "content": file.io.read().decode("utf-8")  # file content
        })

    return {
        "fields": fields,
        "files": file_info
    }
```

## Validation

Use Primate's strongly-typed validation system with the `pema` module:

```python
# routes/validate.py
from primate import Route, pema

schema = pema.schema({
    "baz": pema.int(),
    "foo": pema.string()
})

@Route.get
def get(request):
    try:
        parsed = request.query.parse(schema, True)
        return parsed
    except pema.ValidationError as e:
        return str(e)
```

### Field Types

The validation system supports multiple strongly-typed field types:

- `pema.string()` - validates string values
- `pema.int()` - validates integer values
- `pema.float()` - validates float values
- `pema.boolean()` - validates boolean values

### Coercion

Enable automatic type coercion by passing `True` as the second parameter:

```python
parsed = request.query.parse(schema, True)  # enables coercion
```

With coercion enabled:
- Strings are converted to numbers when possible
- Empty strings become `False` for booleans, `0` for numbers
- Numbers are converted between types as needed

## Responses

### Plain Data

Return any Python object that can be JSON serialized:

```python
@Route.get
def get(request):
    return {"name": "Donald"}

@Route.get
def get(request):
    return "Hello, world!"

@Route.get
def get(request):
    return [
        {"name": "Donald"},
        {"name": "Ryan"}
    ]
```

### Views

Render components with props:

```python
# routes/view.py
from primate import Route, Response

@Route.get
def get(request):
    return Response.view("index.html", {"hello": "world"})
```

With options:

```python
from primate import Route, Response

@Route.get
def get(request):
    return Response.view("index.html",
        {"hello": "world"},
        {"partial": True}
    )
```

### Redirects

Redirect to another route:

```python
# routes/redirect.py
from primate import Route, Response

@Route.get
def get(request):
    return Response.redirect("/redirected")
```

With custom status code:

```python
@Route.get
def get(request):
    return Response.redirect("/redirected", status=301)  # moved permanently
```

### Error Responses

Return error responses:

```python
# routes/error.py
from primate import Route, Response

@Route.get
def get(request):
    return Response.error()
```

With custom error options:

```python
@Route.get
def get(request):
    return Response.error({"body": "Custom error message"})
```

## Sessions

Manage user sessions with the Session module:

```python
# routes/session.py
from primate import Route, Session

@Route.get
def get(request):
    # create a session
    Session.create({"foo": "bar"})

    # get session data
    return Session.get()
```

### Session Methods

- `Session.create(data)` - creates a new session with data
- `Session.get()` - gets session data (raises if no session)
- `Session.try_get()` - gets session data (returns empty dict if no session)
- `Session.set(data)` - updates session data
- `Session.destroy()` - destroys the session
- `Session.exists()` - checks if session exists
- `Session.id()` - gets the session ID

## Python Conventions

Primate Python follows standard Python conventions:

### Function Names

- Use `snake_case` for function and variable names
- Use descriptive names for route handlers

### Dictionary Access

Use standard Python dictionary syntax:

```python
# accessing form data
fields = request.body.form()
name = fields.get("name", "")

# building responses
return {
    "status": "success",
    "data": processed_data
}
```

### Exception Handling

Use try-except blocks for error handling:

```python
@Route.post
def post(request):
    try:
        data = request.body.json()
        return process_data(data)
    except Exception as e:
        return {"error": str(e)}
```

## External Packages

Install Python packages by adding them to `requirements.txt`:

```txt
numpy
pandas
```

Use them in your routes:

```python
# routes/data.py
from primate import Route
import numpy as np
import pandas as pd

@Route.get
def get(request):
    # Create sample data
    data = np.array([1, 2, 3, 4, 5])
    df = pd.DataFrame({"values": data})

    return {
        "mean": float(np.mean(data)),
        "sum": int(np.sum(data)),
        "dataframe_info": df.describe().to_dict()
    }
```

## Configuration

| Option        | Type     | Default | Description               |
| ------------- | -------- | ------- | ------------------------- |
| fileExtension | `string` | `".py"` | Associated file extension |

### Example

```ts
import python from "@primate/python";
import config from "primate/config";

export default config({
  modules: [
    python({
      // use `.python` as associated file extension
      fileExtension: ".python",
    }),
  ],
});
```

## Resources

- [Documentation]
- [Python Language Reference](https://docs.python.org/3/)
- [Pyodide Documentation](https://pyodide.org/)
- [WebAssembly with Python](https://pyodide.org/en/stable/usage/wasm-constraints.html)

[Documentation]: https://docs.python.org/3/
[Python]: https://www.python.org
