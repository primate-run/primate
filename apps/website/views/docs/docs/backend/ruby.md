---
title: Ruby backend
---

# Ruby

Primate runs [Ruby][Documentation] with WebAssembly compilation,
strongly-typed validation, sessions, and server-side routing.

## Setup

### Install Ruby

First, install Ruby 3.0 or later from the [official website][Ruby].

### Install Module

```bash
npm install @primate/ruby
```

### Configure

```ts
import config from "primate/config";
import ruby from "@primate/ruby";

export default config({
  modules: [ruby()],
});
```

### Initialize Ruby

Create a `Gemfile` in your project root:

```bash
bundle init
```

Add the Primate Ruby dependency:

```ruby
# Gemfile
source "https://rubygems.org"

gem "primate-run", "~> 0.1.0"
```

Install dependencies to vendor/bundle (required for WASM):

```bash
bundle config set --local path 'vendor/bundle'
bundle install
```

This creates `Gemfile` and `Gemfile.lock` files that manage your Ruby
dependencies.

## Routes

Create Ruby route handlers in `routes` using `.rb` files. Routes are
compiled to WebAssembly and run in the JavaScript runtime.

```ruby
# routes/hello.rb
require 'primate/route'

Route.get do |request|
  'Hello, world!'
end
```

### HTTP Methods

All standard HTTP methods are supported:

```ruby
require 'primate/route'

Route.get do |request|
  'GET request'
end

Route.post do |request|
  'POST request'
end

Route.put do |request|
  'PUT request'
end

Route.delete do |request|
  'DELETE request'
end
```

## Request Handling

### Query Parameters

Access query parameters through the `query` request bag:

```ruby
# routes/query.rb
require 'primate/route'

Route.get do |request|
  if request.query.has?('foo')
    request.query.get('foo')
  else
    'foo missing'
  end
end
```

### Request Body

Handle different body types based on content:

#### JSON Body

```ruby
# routes/json.rb
require 'primate/route'

Route.post do |request|
  begin
    request.body.json
  rescue => e
    { error: e.message }
  end
end
```

#### Form Fields

```ruby
# routes/form.rb
require 'primate/route'

Route.post do |request|
  begin
    request.body.form
  rescue => e
    { error: e.message }
  end
end
```

#### Text Body

```ruby
# routes/text.rb
require 'primate/route'

Route.post do |request|
  request.body.text
end
```

#### Binary Data

```ruby
# routes/binary.rb
require 'primate/route'

Route.post do |request|
  readable = request.body.binary

  # Get first 4 bytes for file type detection
  head = readable.head(4)

  {
    type: readable.content_type,
    size: readable.size,
    head: head
  }
end
```

### File Uploads

Handle multipart file uploads:

```ruby
# routes/upload.rb
require 'primate/route'

Route.post do |request|
  begin
    # Get form form
    form = request.body.form

    # Get uploaded files
    files = request.body.files

    # Process files
    file_info = files.map do |file|
      {
        field: file.field,        # form field name
        name: file.filename,      # original filename
        type: file.content_type,  # MIME type
        size: file.size          # file size in bytes
      }
    end

    {
      form: form,
      files: file_info
    }
  rescue => e
    { error: e.message }
  end
end
```

## Validation

Use Primate's strongly-typed validation system with the `pema` module:

```ruby
# routes/validate.rb
require 'primate/route'
require 'primate/pema'

schema = Pema.schema({
  'baz' => Pema.int,
  'foo' => Pema.string
})

Route.get do |request|
  begin
    request.query.parse(schema, true)
  rescue Pema::ValidationError => e
    e.message
  end
end
```

### Field Types

The validation system supports multiple strongly-typed field types:

- `Pema.string` - validates string values
- `Pema.int` - validates integer values
- `Pema.float` - validates float values
- `Pema.boolean` - validates boolean values

### Coercion

Enable automatic type coercion by passing `true` as the second parameter:

```ruby
request.query.parse(schema, true) # enables coercion
```

With coercion enabled:
- Strings are converted to numbers when possible
- Empty strings become `false` for booleans, `0` for numbers
- Numbers are converted between types as needed

## Responses

### Plain Data

Return any Ruby object that can be JSON serialized:

```ruby
Route.get do |request|
  { name: 'Donald' }
end

Route.get do |request|
  'Hello, world!'
end

Route.get do |request|
  [
    { name: 'Donald' },
    { name: 'Ryan' }
  ]
end
```

### Views

Render components with props:

```ruby
# routes/view.rb
require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.view('index.html', hello: 'world')
end
```

With options:

```ruby
require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.view('index.html',
    { hello: 'world' },
    { partial: true }
  )
end
```

### Redirects

Redirect to another route:

```ruby
# routes/redirect.rb
require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.redirect('/redirected')
end
```

With custom status code:

```ruby
Route.get do |request|
  Response.redirect('/redirected', status: 301) # moved permanently
end
```

### Error Responses

Return error responses:

```ruby
# routes/error.rb
require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.error
end
```

With custom error options:

```ruby
Route.get do |request|
  Response.error(body: 'Custom error message')
end
```

## Sessions

Manage user sessions with the session module:

```ruby
# routes/session.rb
require 'primate/route'
require 'primate/session'

Route.get do |request|
  # Create a session
  Session.create(foo: 'bar')

  # Get session data
  Session.get
end
```

### Session Methods

- `Session.create(data)` - creates a new session with data
- `Session.get` - gets session data (raises if no session)
- `Session.try` - gets session data (returns nil if no session)
- `Session.set(data)` - updates session data
- `Session.destroy` - destroys the session
- `Session.exists?` - checks if session exists
- `Session.id` - gets the session ID

## Ruby Conventions

Primate Ruby follows standard Ruby conventions:

### Method Names

- Use `snake_case` for method and variable names
- Use `?` suffix for boolean methods: `has?`, `exists?`
- Use `!` suffix for destructive methods (when applicable)

### Hash Syntax

Use modern Ruby hash syntax with symbols:

```ruby
# Preferred
{ name: 'John', age: 30 }

# Also valid
{ :name => 'John', :age => 30 }
```

### String Literals

Use single quotes for plain strings, double quotes for interpolation:

```ruby
# Plain strings
message = 'Hello, world!'

# String interpolation
greeting = "Hello, #{name}!"
```

## Configuration

| Option        | Type     | Default | Description               |
| ------------- | -------- | ------- | ------------------------- |
| fileExtension | `string` | `".rb"` | Associated file extension |

### Example

```ts
import ruby from "@primate/ruby";
import config from "primate/config";

export default config({
  modules: [
    ruby({
      // use `.ruby` as associated file extension
      fileExtension: ".ruby",
    }),
  ],
});
```

## Resources

- [Documentation]
- [Ruby Language Reference](https://ruby-doc.org/)
- [WebAssembly with Ruby](https://github.com/ruby/ruby.wasm)

[Documentation]: https://ruby-doc.org
[Ruby]: https://www.ruby-lang.org
