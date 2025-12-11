# Pema

**P**rimate sch**ema** - Runtime validation for TypeScript applications.

Pema is a schema validation library that provides runtime type checking with full TypeScript type inference. While TypeScript validates types at compile-time, Pema ensures data correctness at runtime when real users interact with your application.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Creating Schemas](#creating-schemas)
  - [Parsing Values](#parsing-values)
  - [Type Inference](#type-inference)
  - [Schema Normalization](#schema-normalization)
- [Primitive Types](#primitive-types)
  - [string](#string)
  - [number](#number)
  - [boolean](#boolean)
  - [bigint](#bigint)
  - [biguint](#biguint)
  - [symbol](#symbol)
  - [date](#date)
  - [unknown](#unknown)
- [Binary Types](#binary-types)
  - [blob](#blob)
  - [file](#file)
  - [url](#url)
- [Integer Types](#integer-types)
  - [int / uint](#int--uint)
  - [Sized Integers](#sized-integers)
  - [Float Types](#float-types)
- [Collection Types](#collection-types)
  - [array](#array)
  - [object](#object)
  - [tuple](#tuple)
  - [record](#record)
- [Union & Literal Types](#union--literal-types)
  - [union](#union)
  - [Literals](#literals)
- [Utility Types](#utility-types)
  - [optional](#optional)
  - [constructor](#constructor)
  - [pure](#pure)
  - [primary](#primary)
  - [omit](#omit)
  - [partial](#partial)
- [Modifiers](#modifiers)
  - [.optional()](#optional-modifier)
  - [.default()](#default-modifier)
  - [.coerce](#coerce-modifier)
- [Store Integration](#store-integration)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)
- [API Reference](#api-reference)

## Installation

```bash
npm install pema
```

## Quick Start

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

// Define a schema
const User = pema({
  name: string.min(1),
  email: string.email(),
  age: number.min(0),
});

// Parse and validate data
const user = User.parse({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
});
// user is now typed as { name: string; email: string; age: number }

// Invalid data throws ParseError
try {
  User.parse({ name: "", email: "invalid", age: -1 });
} catch (error) {
  console.log(error.message); // Validation error details
}
```

## Core Concepts

### Creating Schemas

The main `pema()` function creates a schema from an object definition:

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

const Schema = pema({
  name: string,
  count: number,
});
```

You can also use individual type validators directly:

```typescript
import string from "pema/string";

const validated = string.email().parse("user@example.com");
```

### Parsing Values

Every schema has a `.parse()` method that validates input and returns the typed value:

```typescript
const result = Schema.parse(input);
```

- If validation succeeds, returns the validated value with proper TypeScript types
- If validation fails, throws a `ParseError` with detailed issue information

### Type Inference

Pema provides full TypeScript type inference. The parsed result is automatically typed based on your schema:

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

const User = pema({
  name: string,
  age: number.optional(),
});

type User = typeof User.infer;
// Equivalent to: { name: string; age: number | undefined }
```

### Schema Normalization

Pema automatically normalizes JavaScript values into schema types:

```typescript
import pema from "pema";
import string from "pema/string";

// Literal values become LiteralType
const Status = pema({
  type: "active",      // LiteralType<"active">
  code: 200,           // LiteralType<200>
  enabled: true,       // LiteralType<true>
});

// Plain objects become ObjectType
const Nested = pema({
  config: {            // ObjectType<{ host: StringType }>
    host: string,
  },
});

// Arrays with single element become ArrayType
const Tags = pema({
  tags: [string],      // ArrayType<StringType>
});

// Arrays with multiple elements become TupleType
const Point = pema({
  coords: [number, number],  // TupleType<[NumberType, NumberType]>
});

// Classes become ConstructorType
class CustomClass {}
const Custom = pema({
  instance: CustomClass,     // ConstructorType<typeof CustomClass>
});
```

## Primitive Types

### string

Validates that a value is a string.

```typescript
import string from "pema/string";

// Basic validation
string.parse("hello");        // "hello"
string.parse(123);            // throws ParseError
```

#### String Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `.min(n)` | Minimum length | `string.min(5)` |
| `.max(n)` | Maximum length | `string.max(100)` |
| `.length(min, max)` | Length range | `string.length(5, 10)` |
| `.email()` | Valid email format | `string.email()` |
| `.uuid()` | Valid UUID format | `string.uuid()` |
| `.startsWith(prefix)` | Must start with prefix | `string.startsWith("/")` |
| `.endsWith(suffix)` | Must end with suffix | `string.endsWith(".js")` |
| `.regex(pattern)` | Match regex pattern | `string.regex(/^[a-z]+$/)` |
| `.isotime()` | ISO time format | `string.isotime()` |

```typescript
// Email validation
const email = string.email();
email.parse("user@example.com");     // "user@example.com"
email.parse("invalid");              // throws: "invalid" is not a valid email

// UUID validation
const uuid = string.uuid();
uuid.parse("4d0996db-BDA9-4f95-ad7c-7075b10d4ba6");  // valid
uuid.parse("not-a-uuid");                            // throws

// Length constraints
const username = string.min(3).max(20);
username.parse("john");              // "john"
username.parse("ab");                // throws: min 3 characters

// Prefix/suffix validation
const path = string.startsWith("/").endsWith(".html");
path.parse("/index.html");           // "/index.html"
path.parse("index.html");            // throws: does not start with "/"

// Chaining validators
const slug = string.min(1).max(50).regex(/^[a-z0-9-]+$/);
slug.parse("my-blog-post");          // "my-blog-post"
```

### number

Validates that a value is a number (64-bit float by default).

```typescript
import number from "pema/number";

// Basic validation
number.parse(42);            // 42
number.parse(3.14);          // 3.14
number.parse("42");          // throws ParseError
number.parse(42n);           // throws ParseError (bigint not allowed)
```

#### Number Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `.min(n)` | Minimum value | `number.min(0)` |
| `.max(n)` | Maximum value | `number.max(100)` |
| `.range(min, max)` | Value range | `number.range(0, 100)` |

```typescript
// With coercion (converts strings to numbers)
const coerced = number.coerce;
coerced.parse("42");         // 42
coerced.parse("3.14");       // 3.14
coerced.parse("-1.5");       // -1.5

// Range validation
const percentage = number.range(0, 100);
percentage.parse(50);        // 50
percentage.parse(150);       // throws: out of range

// Min/max validation
const positive = number.min(0);
positive.parse(10);          // 10
positive.parse(-5);          // throws: -5 is lower than min (0)
```

### boolean

Validates that a value is a boolean.

```typescript
import boolean from "pema/boolean";

// Basic validation
boolean.parse(true);         // true
boolean.parse(false);        // false
boolean.parse("true");       // throws ParseError

// With coercion
const coerced = boolean.coerce;
coerced.parse("true");       // true
coerced.parse("false");      // false
coerced.parse("1");          // throws (only "true"/"false" strings allowed)
```

### bigint

Validates that a value is a bigint (signed, 64-bit range by default).

```typescript
import bigint from "pema/bigint";

// Basic validation
bigint.parse(42n);           // 42n
bigint.parse(0n);            // 0n
bigint.parse(42);            // throws ParseError (number not allowed)
bigint.parse("42");          // throws ParseError

// With coercion
const coerced = bigint.coerce;
coerced.parse(42);           // 42n
coerced.parse("42");         // 42n
coerced.parse("42.0");       // 42n (integer part only)
coerced.parse("0.5");        // throws (not an integer)
```

#### BigInt Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `.min(n)` | Minimum value | `bigint.min(0n)` |
| `.max(n)` | Maximum value | `bigint.max(1000n)` |
| `.range(min, max)` | Value range | `bigint.range(0n, 100n)` |

```typescript
const positive = bigint.min(0n);
positive.parse(100n);        // 100n
positive.parse(-1n);         // throws: -1 is lower than min (0)
```

### biguint

Validates that a value is an unsigned bigint (>= 0).

```typescript
import biguint from "pema/biguint";

// Basic validation
biguint.parse(42n);          // 42n
biguint.parse(0n);           // 0n
biguint.parse(-1n);          // throws: -1 is out of range

// With coercion
const coerced = biguint.coerce;
coerced.parse(42);           // 42n
coerced.parse("100");        // 100n
coerced.parse(-1);           // throws: -1 is out of range
```

### symbol

Validates that a value is a symbol.

```typescript
import symbol from "pema/symbol";

const sym = Symbol("test");
symbol.parse(sym);           // sym
symbol.parse("symbol");      // throws ParseError
```

### date

Validates that a value is a Date object.

```typescript
import date from "pema/date";

// Basic validation
const d = new Date();
date.parse(d);               // d
date.parse("2024-01-01");    // throws ParseError

// With coercion (converts timestamps to Date)
const coerced = date.coerce;
coerced.parse(1723718400000);  // Date object
coerced.parse(new Date());     // Date object
```

### unknown

Accepts any value without validation. Useful as a placeholder or for dynamic data.

```typescript
import unknown from "pema/unknown";

unknown.parse("anything");   // "anything"
unknown.parse(42);           // 42
unknown.parse({ foo: "bar" }); // { foo: "bar" }
unknown.parse(null);         // null
```

## Binary Types

### blob

Validates that a value is a Blob object. Useful for binary data and file uploads.

```typescript
import blob from "pema/blob";

// Basic validation
const b = new Blob(["content"], { type: "text/plain" });
blob.parse(b);               // b
blob.parse("not a blob");    // throws ParseError

// File extends Blob, so files pass blob validation
const f = new File(["content"], "test.txt");
blob.parse(f);               // f (File is a Blob subclass)
```

#### With Default Value

```typescript
const defaultBlob = new Blob();
const blobWithDefault = blob.default(defaultBlob);

blobWithDefault.parse(undefined);     // defaultBlob
blobWithDefault.parse(new Blob());    // the provided Blob
```

### file

Validates that a value is a File object (more specific than Blob).

```typescript
import file from "pema/file";

// Basic validation
const f = new File(["content"], "document.txt");
file.parse(f);               // f
file.parse("not a file");    // throws ParseError

// Blob is NOT a File
const b = new Blob(["content"]);
file.parse(b);               // throws ParseError (Blob !== File)
```

#### With Default Value

```typescript
const defaultFile = new File([""], "default.txt");
const fileWithDefault = file.default(defaultFile);

fileWithDefault.parse(undefined);              // defaultFile
fileWithDefault.parse(new File(["x"], "x.txt")); // the provided File
```

### url

Validates that a value is a URL object.

```typescript
import url from "pema/url";

// Basic validation - requires URL object, not string
const u = new URL("https://example.com");
url.parse(u);                      // u
url.parse("https://example.com");  // throws ParseError (string not allowed)
```

#### With Default Value

```typescript
const defaultUrl = new URL("https://default.com");
const urlWithDefault = url.default(defaultUrl);

urlWithDefault.parse(undefined);                  // defaultUrl
urlWithDefault.parse(new URL("https://other.com")); // the provided URL
```

## Integer Types

Pema provides precise integer types with compile-time and runtime range validation.

### int / uint

Generic integer types that map to `i32` and `u32` respectively.

```typescript
import int from "pema/int";
import uint from "pema/uint";

// int: signed 32-bit integer (-2^31 to 2^31-1)
int.parse(42);               // 42
int.parse(-100);             // -100
int.parse(3.14);             // throws: 3.14 is not an integer
int.parse("42");             // throws ParseError

// uint: unsigned 32-bit integer (0 to 2^32-1)
uint.parse(42);              // 42
uint.parse(0);               // 0
uint.parse(-1);              // throws: -1 is out of range
```

#### Integer Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `.min(n)` | Minimum value | `int.min(-10)` |
| `.max(n)` | Maximum value | `int.max(100)` |
| `.range(min, max)` | Value range | `int.range(0, 100)` |

```typescript
// Range validation
const score = int.range(0, 100);
score.parse(85);             // 85
score.parse(150);            // throws: 150 is out of range

// Min/max validation
const age = uint.min(0).max(150);
age.parse(25);               // 25
age.parse(-1);               // throws: -1 is out of range

// With coercion
const coerced = int.coerce;
coerced.parse("42");         // 42
coerced.parse("42.0");       // 42
coerced.parse("42.5");       // throws: 42.5 is not an integer
```

### Sized Integers

Pema provides sized integer types for precise control over numeric ranges.

#### Signed Integers

| Type | Range | Use Case |
|------|-------|----------|
| `i8` | -128 to 127 | Byte-level data |
| `i16` | -32,768 to 32,767 | Short integers |
| `i32` | -2,147,483,648 to 2,147,483,647 | Standard integers |
| `i64` | -2^63 to 2^63-1 | Large integers (bigint) |
| `i128` | -2^127 to 2^127-1 | Very large integers (bigint) |

```typescript
import i8 from "pema/i8";
import i16 from "pema/i16";
import i32 from "pema/i32";
import i64 from "pema/i64";
import i128 from "pema/i128";

// i8: -128 to 127
i8.parse(127);               // 127
i8.parse(128);               // throws: 128 is out of range
i8.parse(-128);              // -128
i8.parse(-129);              // throws: -129 is out of range

// i16: -32768 to 32767
i16.parse(32767);            // 32767
i16.parse(32768);            // throws: out of range

// i32: -2147483648 to 2147483647
i32.parse(2147483647);       // 2147483647
i32.parse(2147483648);       // throws: out of range

// i64 and i128 use bigint
i64.parse(9223372036854775807n);  // valid
i128.parse(0n);                    // valid
```

#### Unsigned Integers

| Type | Range | Use Case |
|------|-------|----------|
| `u8` | 0 to 255 | Bytes, colors |
| `u16` | 0 to 65,535 | Ports, short counters |
| `u32` | 0 to 4,294,967,295 | IDs, timestamps |
| `u64` | 0 to 2^64-1 | Large IDs (bigint) |
| `u128` | 0 to 2^128-1 | UUIDs as integers (bigint) |

```typescript
import u8 from "pema/u8";
import u16 from "pema/u16";
import u32 from "pema/u32";
import u64 from "pema/u64";
import u128 from "pema/u128";

// u8: 0 to 255
u8.parse(255);               // 255
u8.parse(256);               // throws: 256 is out of range
u8.parse(-1);                // throws: -1 is out of range

// u16: 0 to 65535 (useful for ports)
u16.parse(8080);             // 8080
u16.parse(65536);            // throws: out of range

// u32: 0 to 4294967295
u32.parse(4294967295);       // 4294967295

// u64 and u128 use bigint
u64.parse(18446744073709551615n);  // valid
u128.parse(0n);                     // valid
```

#### Coercion for Sized Integers

All sized integer types support coercion from strings:

```typescript
import u8 from "pema/u8";

const coerced = u8.coerce;
coerced.parse("200");        // 200
coerced.parse("200.0");      // 200
coerced.parse("256");        // throws: 256 is out of range
```

### Float Types

For floating-point numbers with specific precision.

```typescript
import f32 from "pema/f32";
import f64 from "pema/f64";

// f32: 32-bit float (single precision)
f32.parse(1.5);              // 1.5
f32.parse(123456.75);        // 123456.75
f32.parse(1.23456789012345); // throws: not a 32-bit float

// f64: 64-bit float (double precision) - same as `number`
f64.parse(1.23456789012345); // 1.23456789012345
```

## Collection Types

### array

Validates arrays where all elements match a specific schema.

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

// Using the array function
import array from "pema/array";
const Tags = array(string);
Tags.parse(["a", "b", "c"]);     // ["a", "b", "c"]
Tags.parse([1, 2, 3]);           // throws: expected string at index 0

// Shorthand: single-element array in schema definition
const Schema = pema({
  tags: [string],                // equivalent to array(string)
});

// Nested arrays
const Matrix = array(array(number));
Matrix.parse([[1, 2], [3, 4]]);  // [[1, 2], [3, 4]]
```

#### Array Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `.min(n)` | Minimum length | `array(string).min(1)` |
| `.max(n)` | Maximum length | `array(string).max(10)` |
| `.length(min, max)` | Length range | `array(string).length(1, 5)` |
| `.unique()` | No duplicate values | `array(string).unique()` |

```typescript
// Length constraints
const tags = array(string).min(1).max(5);
tags.parse(["a"]);               // ["a"]
tags.parse([]);                  // throws: min 1 items
tags.parse(["a","b","c","d","e","f"]); // throws: max 5 items

// Length range
const items = array(number).length(2, 4);
items.parse([1, 2]);             // [1, 2]
items.parse([1]);                // throws: length out of range

// Unique values (only for primitive element types)
const uniqueTags = array(string).unique();
uniqueTags.parse(["a", "b", "c"]);     // ["a", "b", "c"]
uniqueTags.parse(["a", "b", "a"]);     // throws: duplicate value at index 2

// With default value
const defaultTags = array(string).default(["default"]);
defaultTags.parse(undefined);    // ["default"]
defaultTags.parse(["custom"]);   // ["custom"]
```

### object

Validates objects with specific property schemas.

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

// Using pema() function (recommended)
const User = pema({
  name: string,
  age: number,
});

User.parse({ name: "John", age: 30 }); // { name: "John", age: 30 }
User.parse({ name: "John" });          // throws: expected number for age

// Using object() function directly
import object from "pema/object";
const Config = object({
  host: string,
  port: number,
});
```

#### Nested Objects

```typescript
const Profile = pema({
  user: {
    name: string,
    email: string.email(),
  },
  settings: {
    theme: string.default("light"),
    notifications: boolean.default(true),
  },
});

Profile.parse({
  user: { name: "John", email: "john@example.com" },
  settings: {},  // defaults applied
});
// Result: { user: {...}, settings: { theme: "light", notifications: true } }
```

#### Optional and Default Properties

```typescript
const User = pema({
  name: string,
  nickname: string.optional(),      // string | undefined
  role: string.default("user"),     // defaults to "user" if undefined
});

User.parse({ name: "John" });
// Result: { name: "John", role: "user" }
// Note: nickname is omitted (undefined)
```

### tuple

Validates fixed-length arrays with specific types at each position.

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";
import boolean from "pema/boolean";

// Shorthand: multi-element array in schema definition
const Point = pema({
  coords: [number, number],        // TupleType<[NumberType, NumberType]>
});
Point.parse({ coords: [10, 20] }); // { coords: [10, 20] }

// Using tuple() function
import tuple from "pema/tuple";
const Entry = tuple(string, number, boolean);

Entry.parse(["name", 42, true]);   // ["name", 42, true]
Entry.parse(["name", 42]);         // throws: expected boolean at index 2
Entry.parse(["name", 42, true, "extra"]); // throws: expected undefined at index 3
```

#### Nested Tuples

```typescript
const NestedTuple = tuple(tuple(string));
NestedTuple.parse([["hello"]]);    // [["hello"]]

// Tuples in arrays
const Points = array(tuple(number, number));
Points.parse([[0, 0], [10, 20]]);  // [[0, 0], [10, 20]]
```

### record

Validates key-value objects where keys and values match specific types.

```typescript
import record from "pema/record";
import string from "pema/string";
import number from "pema/number";
import symbol from "pema/symbol";

// String keys, string values
const StringDict = record(string, string);
StringDict.parse({ foo: "bar", baz: "qux" }); // valid
StringDict.parse({ foo: 123 });               // throws: expected string value

// Number keys, string values
const NumberKeyed = record(number, string);
NumberKeyed.parse({ 0: "first", 1: "second" }); // valid
NumberKeyed.parse({ foo: "bar" });              // throws: expected number key

// Symbol keys
const SymbolKeyed = record(symbol, string);
const key = Symbol("myKey");
SymbolKeyed.parse({ [key]: "value" });          // valid
```

#### Record with Validated Values

```typescript
const Scores = record(string, number.min(0).max(100));
Scores.parse({ math: 95, english: 88 });    // valid
Scores.parse({ math: 150 });                // throws: 150 is out of range
```

## Union & Literal Types

### union

Creates a schema that accepts any of the specified types. Requires at least two members.

```typescript
import union from "pema/union";
import string from "pema/string";
import number from "pema/number";
import boolean from "pema/boolean";
import bigint from "pema/bigint";

// Basic union of primitive types
const StringOrNumber = union(string, number);
StringOrNumber.parse("hello");      // "hello"
StringOrNumber.parse(42);           // 42
StringOrNumber.parse(true);         // throws: expected `string | number`

// Union with boolean
const Primitive = union(string, number, boolean);
Primitive.parse("text");            // "text"
Primitive.parse(123);               // 123
Primitive.parse(true);              // true
```

#### Union with Literals

```typescript
// String literal union (enum-like)
const Status = union("pending", "active", "completed");
Status.parse("active");             // "active"
Status.parse("invalid");            // throws: expected `"pending" | "active" | "completed"`

// Mixed literal union
const Value = union("auto", 0, true);
Value.parse("auto");                // "auto"
Value.parse(0);                     // 0
Value.parse(true);                  // true
```

#### Union with Complex Types

```typescript
import pema from "pema";

// Union with objects
const Result = union(
  string,
  { status: "error", message: string }
);
Result.parse("success");                    // "success"
Result.parse({ status: "error", message: "Failed" }); // valid

// Union with classes
class CustomError {}
const ErrorOrString = union(string, CustomError);
ErrorOrString.parse("error message");       // "error message"
ErrorOrString.parse(new CustomError());     // CustomError instance
```

#### Union with Default

```typescript
const OptionalStatus = union(boolean, string).default("unknown");
OptionalStatus.parse(undefined);    // "unknown"
OptionalStatus.parse(true);         // true
OptionalStatus.parse("active");     // "active"
```

### Literals

Literal types match exact values. They are created automatically when you use primitive values in schemas.

```typescript
import pema from "pema";

// Implicit literal types in schemas
const Config = pema({
  type: "config",        // LiteralType<"config">
  version: 1,            // LiteralType<1>
  enabled: true,         // LiteralType<true>
});

Config.parse({ type: "config", version: 1, enabled: true });    // valid
Config.parse({ type: "other", version: 1, enabled: true });     // throws
```

#### Explicit Literal Creation

You can create literals explicitly using the normalize function behavior:

```typescript
import pema from "pema";

// String literals
const Method = pema({
  method: "GET",         // only "GET" is valid
});
Method.parse({ method: "GET" });    // valid
Method.parse({ method: "POST" });   // throws: expected "GET"

// Number literals
const HttpOk = pema({
  status: 200,           // only 200 is valid
});
HttpOk.parse({ status: 200 });      // valid
HttpOk.parse({ status: 404 });      // throws: expected 200

// Boolean literals
const Enabled = pema({
  active: true,          // only true is valid
});
Enabled.parse({ active: true });    // valid
Enabled.parse({ active: false });   // throws: expected true
```

#### Discriminated Unions

Combine literals with unions for type-safe discriminated unions:

```typescript
import pema from "pema";
import union from "pema/union";
import string from "pema/string";
import number from "pema/number";

const SuccessResponse = pema({
  type: "success",
  data: string,
});

const ErrorResponse = pema({
  type: "error",
  code: number,
  message: string,
});

const Response = union(SuccessResponse, ErrorResponse);

// Valid success response
Response.parse({ type: "success", data: "Hello" });

// Valid error response
Response.parse({ type: "error", code: 404, message: "Not found" });

// Invalid - mixed types
Response.parse({ type: "success", code: 200 }); // throws
```

## Utility Types

### optional

Makes any schema accept `undefined` in addition to its normal type.

```typescript
import optional from "pema/optional";
import string from "pema/string";
import number from "pema/number";

// Using optional() function
const OptionalString = optional(string);
OptionalString.parse("hello");      // "hello"
OptionalString.parse(undefined);    // undefined
OptionalString.parse(null);         // throws: null is not undefined

// Using .optional() method (preferred)
const Name = string.optional();
Name.parse("John");                 // "John"
Name.parse(undefined);              // undefined
```

#### Optional in Objects

```typescript
import pema from "pema";
import string from "pema/string";

const User = pema({
  name: string,
  nickname: string.optional(),      // string | undefined
});

User.parse({ name: "John" });
// Result: { name: "John" }
// Note: nickname key is omitted when undefined

User.parse({ name: "John", nickname: "Johnny" });
// Result: { name: "John", nickname: "Johnny" }

User.parse({ name: "John", nickname: undefined });
// Result: { name: "John" }
```

### constructor

Validates that a value is an instance of a specific class.

```typescript
import constructor from "pema/constructor";

class User {
  constructor(public name: string) {}
}

class Admin extends User {
  constructor(name: string, public role: string) {
    super(name);
  }
}

// Basic class validation
const UserType = constructor(User);
UserType.parse(new User("John"));       // valid
UserType.parse(new Admin("Jane", "admin")); // valid (Admin extends User)
UserType.parse({ name: "John" });       // throws: not a User instance

// With default value
const defaultUser = new User("Guest");
const UserWithDefault = constructor(User).default(defaultUser);
UserWithDefault.parse(undefined);       // defaultUser
```

#### Constructor in Schemas

```typescript
import pema from "pema";
import string from "pema/string";

class CustomDate {
  constructor(public value: Date) {}
}

// Classes are automatically converted to ConstructorType
const Event = pema({
  name: string,
  date: CustomDate,
});

Event.parse({
  name: "Meeting",
  date: new CustomDate(new Date()),
}); // valid
```

### pure

A TypeScript-only type that performs no runtime validation. Useful for types that cannot be validated at runtime or for integration with external systems.

```typescript
import pure from "pema/pure";

// Define a pure type with TypeScript type parameter
type CustomConfig = {
  apiKey: string;
  endpoint: string;
};

const Config = pure<CustomConfig>();

// No validation occurs - value passes through as-is
Config.parse({ apiKey: "key", endpoint: "url" }); // typed as CustomConfig
Config.parse(42);                                  // 42, typed as CustomConfig (no validation!)
Config.parse("anything");                          // "anything", typed as CustomConfig
```

#### When to Use Pure

- Integration with external libraries that have their own validation
- Types that are impossible to validate at runtime (branded types, etc.)
- Performance-critical paths where validation has already occurred
- Gradual migration to Pema

```typescript
import pema from "pema";
import string from "pema/string";
import pure from "pema/pure";

// External library type
type ExternalLibraryType = { complex: "structure" };

const Schema = pema({
  name: string,
  external: pure<ExternalLibraryType>(),  // Trust external validation
});
```

### primary

An optional string type designed for database primary keys. Accepts `string | undefined`.

```typescript
import primary from "pema/primary";

// Accepts string or undefined
primary.parse("abc-123");           // "abc-123"
primary.parse(undefined);           // undefined
primary.parse(123);                 // throws: expected primary
```

#### Primary in Store Schemas

```typescript
import pema from "pema";
import string from "pema/string";
import primary from "pema/primary";

const UserStore = pema({
  id: primary,                      // auto-generated by database
  name: string,
});

// Creating a new user (id is undefined)
UserStore.parse({ name: "John" });  // valid, id is undefined

// Reading from database (id is string)
UserStore.parse({ id: "user-123", name: "John" }); // valid
```

### omit

Creates a new object schema with specified properties removed.

```typescript
import omit from "pema/omit";
import object from "pema/object";
import string from "pema/string";
import number from "pema/number";

const User = object({
  id: string,
  name: string,
  age: number,
  email: string,
});

// Remove single field
const CreateUser = omit(User, "id");
CreateUser.parse({ name: "John", age: 30, email: "john@example.com" }); // valid
// Type: { name: string; age: number; email: string }

// Remove multiple fields
const PublicUser = omit(User, "id", "email");
PublicUser.parse({ name: "John", age: 30 }); // valid
// Type: { name: string; age: number }
```

#### Omit with Nested Objects

```typescript
const FullProfile = object({
  id: string,
  user: {
    name: string,
    email: string,
  },
  metadata: number,
});

const CreateProfile = omit(FullProfile, "id");
CreateProfile.parse({
  user: { name: "John", email: "john@example.com" },
  metadata: 42,
}); // valid
```

#### Omit Preserves Validators

```typescript
const User = object({
  id: string,
  email: string.email(),
  age: number.min(0).max(150),
});

const CreateUser = omit(User, "id");

// Validators are preserved
CreateUser.parse({ email: "invalid", age: 25 }); // throws: invalid email
CreateUser.parse({ email: "john@example.com", age: 200 }); // throws: age out of range
```

### partial

Makes all properties in an object schema optional. Only validates properties that are provided.

```typescript
import partial from "pema/partial";
import string from "pema/string";
import number from "pema/number";

const UserPartial = partial({
  name: string,
  age: number,
});

// All properties are optional
UserPartial.parse({});                        // {}
UserPartial.parse({ name: "John" });          // { name: "John" }
UserPartial.parse({ age: 30 });               // { age: 30 }
UserPartial.parse({ name: "John", age: 30 }); // { name: "John", age: 30 }

// Validation still applies to provided values
UserPartial.parse({ name: 123 });             // throws: expected string
UserPartial.parse({ age: "thirty" });         // throws: expected number
```

#### Partial from Object Schema

```typescript
import object from "pema/object";

const User = object({
  name: string,
  age: number,
});

const UserUpdate = partial(User);  // Same as partial({ name: string, age: number })
```

## Modifiers

Modifiers are methods available on schema types that transform their behavior.

### .optional() Modifier

Makes a schema accept `undefined` in addition to its normal type.

```typescript
import string from "pema/string";
import number from "pema/number";
import array from "pema/array";

// On primitives
const optionalString = string.optional();
optionalString.parse("hello");      // "hello"
optionalString.parse(undefined);    // undefined

// On arrays
const optionalTags = array(string).optional();
optionalTags.parse(["a", "b"]);     // ["a", "b"]
optionalTags.parse(undefined);      // undefined

// Chaining with validators
const optionalEmail = string.email().optional();
optionalEmail.parse("user@example.com"); // valid
optionalEmail.parse(undefined);          // undefined
optionalEmail.parse("invalid");          // throws: not a valid email
```

### .default() Modifier

Provides a default value when the input is `undefined`.

```typescript
import string from "pema/string";
import number from "pema/number";
import array from "pema/array";

// Static default value
const role = string.default("user");
role.parse("admin");            // "admin"
role.parse(undefined);          // "user"

// Function default (called each time)
const timestamp = number.default(() => Date.now());
timestamp.parse(undefined);     // current timestamp
timestamp.parse(12345);         // 12345

// Array with default
const tags = array(string).default(["general"]);
tags.parse(undefined);          // ["general"]
tags.parse(["custom"]);         // ["custom"]

// Chaining with validators
const port = number.min(1).max(65535).default(3000);
port.parse(undefined);          // 3000
port.parse(8080);               // 8080
port.parse(100000);             // throws: out of range
```

#### Default in Objects

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

const Config = pema({
  host: string.default("localhost"),
  port: number.default(8080),
  debug: boolean.default(false),
});

// All defaults applied
Config.parse({});
// Result: { host: "localhost", port: 8080, debug: false }

// Partial override
Config.parse({ host: "example.com" });
// Result: { host: "example.com", port: 8080, debug: false }

// Nested defaults
const AppConfig = pema({
  name: string,
  server: {
    host: string.default("0.0.0.0"),
    port: number.default(3000),
  },
});

AppConfig.parse({ name: "MyApp" });
// Result: { name: "MyApp", server: { host: "0.0.0.0", port: 3000 } }
```

### .coerce Modifier

Enables type coercion, converting compatible values to the target type.

```typescript
import string from "pema/string";
import number from "pema/number";
import boolean from "pema/boolean";
import int from "pema/int";
import uint from "pema/uint";
import date from "pema/date";
import bigint from "pema/bigint";

// Number coercion (from string)
const num = number.coerce;
num.parse("42");                // 42
num.parse("3.14");              // 3.14
num.parse("-1.5");              // -1.5
num.parse(42);                  // 42 (already a number)

// Integer coercion
const integer = int.coerce;
integer.parse("42");            // 42
integer.parse("42.0");          // 42
integer.parse("42.5");          // throws: not an integer

// Unsigned integer coercion
const unsigned = uint.coerce;
unsigned.parse("100");          // 100
unsigned.parse("-1");           // throws: out of range

// Boolean coercion (only "true"/"false" strings)
const bool = boolean.coerce;
bool.parse("true");             // true
bool.parse("false");            // false
bool.parse("1");                // throws: invalid
bool.parse("yes");              // throws: invalid

// Date coercion (from timestamp)
const d = date.coerce;
d.parse(1723718400000);         // Date object
d.parse(new Date());            // Date object

// BigInt coercion
const big = bigint.coerce;
big.parse(42);                  // 42n
big.parse("42");                // 42n
big.parse("42.0");              // 42n
```

#### Coercion in Schemas

Coercion is particularly useful when parsing query parameters or form data where everything arrives as strings:

```typescript
import pema from "pema";
import uint from "pema/uint";
import string from "pema/string";

const QueryParams = pema({
  page: uint.coerce.default(1),
  limit: uint.coerce.default(20),
  search: string.optional(),
});

// From URL query string (all values are strings)
QueryParams.parse({ page: "2", limit: "50" });
// Result: { page: 2, limit: 50 }

QueryParams.parse({});
// Result: { page: 1, limit: 20 }
```

## Store Integration

Pema provides types for database store integration, commonly used with Primate's ORM.

### StoreType

An extended object type with support for `.partial()` method, useful for update operations.

```typescript
import { StoreType } from "pema";
```

### StoreSchema

Type definition for store schemas, representing the structure of stored entities.

```typescript
import { StoreSchema } from "pema";
```

### StoreId

Type for store identifiers.

```typescript
import { StoreId } from "pema";
```

### InferStore / InferStoreOut

Type utilities for inferring TypeScript types from store schemas.

```typescript
import { InferStore, InferStoreOut } from "pema";
import pema from "pema";
import string from "pema/string";
import primary from "pema/primary";

const UserStore = pema({
  id: primary,
  name: string,
  email: string.email(),
});

// Infer the store type
type User = InferStore<typeof UserStore>;
// { id: string | undefined; name: string; email: string }
```

### Practical Store Example

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";
import primary from "pema/primary";
import date from "pema/date";

// Define a store schema
const PostStore = pema({
  id: primary,
  title: string.min(1).max(200),
  content: string,
  authorId: string,
  views: number.default(0),
  createdAt: date.default(() => new Date()),
});

// Creating a new post (id will be generated)
const newPost = PostStore.parse({
  title: "Hello World",
  content: "My first post",
  authorId: "user-123",
});
// Result includes id: undefined, views: 0, createdAt: current date

// Reading from database
const existingPost = PostStore.parse({
  id: "post-456",
  title: "Hello World",
  content: "My first post",
  authorId: "user-123",
  views: 42,
  createdAt: new Date("2024-01-01"),
});
```

## Error Handling

### ParseError

When validation fails, Pema throws a `ParseError` containing detailed information about what went wrong.

```typescript
import { ParseError } from "pema/ParseError";
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

const User = pema({
  name: string.min(1),
  email: string.email(),
  age: number.min(0),
});

try {
  User.parse({ name: "", email: "invalid", age: -5 });
} catch (error) {
  if (error instanceof ParseError) {
    console.log(error.message);  // First error message
    console.log(error.issues);   // Array of all validation issues
  }
}
```

### Issue Structure

Each issue in `ParseError.issues` contains:

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Human-readable error message |
| `path` | `string` | JSON Pointer to the failing value |
| `input` | `unknown` | The actual value that failed validation |

```typescript
// Example issues array:
[
  {
    message: "min 1 characters",
    path: "/name",
    input: ""
  },
  {
    message: "\"invalid\" is not a valid email",
    path: "/email",
    input: "invalid"
  },
  {
    message: "-5 is lower than min (0)",
    path: "/age",
    input: -5
  }
]
```

### JSON Serialization

`ParseError` implements `toJSON()` for easy serialization in API responses:

```typescript
try {
  schema.parse(data);
} catch (error) {
  if (error instanceof ParseError) {
    // Returns structured JSON for API responses
    const json = error.toJSON();
    
    // For form errors (with paths):
    // {
    //   "/email": { "message": "invalid email", "messages": ["invalid email"] },
    //   "/age": { "message": "must be positive", "messages": ["must be positive"] }
    // }
    
    // For scalar errors (no path):
    // { "message": "expected string", "messages": ["expected string"] }
  }
}
```

### Error Paths

Paths use JSON Pointer notation (RFC 6901):

```typescript
import pema from "pema";
import string from "pema/string";
import array from "pema/array";

const Schema = pema({
  users: [{
    profile: {
      email: string.email(),
    },
  }],
});

try {
  Schema.parse({
    users: [
      { profile: { email: "invalid" } }
    ]
  });
} catch (error) {
  // error.issues[0].path === "/users/0/profile/email"
}
```

### Catching Errors Gracefully

```typescript
import { ParseError } from "pema/ParseError";

function validateUser(data: unknown) {
  try {
    return { success: true, data: User.parse(data) };
  } catch (error) {
    if (error instanceof ParseError) {
      return { success: false, errors: error.toJSON() };
    }
    throw error; // Re-throw unexpected errors
  }
}

const result = validateUser({ name: "", email: "bad" });
if (!result.success) {
  console.log(result.errors);
}
```

## Advanced Patterns

### Nested Schemas

Build complex schemas by composing simpler ones:

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";
import array from "pema/array";

// Define reusable schemas
const Address = pema({
  street: string,
  city: string,
  zipCode: string.regex(/^\d{5}$/),
});

const ContactInfo = pema({
  email: string.email(),
  phone: string.optional(),
});

// Compose into larger schema
const User = pema({
  name: string,
  contact: ContactInfo,
  addresses: array(Address),
});

User.parse({
  name: "John",
  contact: { email: "john@example.com" },
  addresses: [
    { street: "123 Main St", city: "Boston", zipCode: "02101" }
  ],
});
```

### Schema Composition

Combine schemas using spread or programmatic composition:

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

// Base schema properties
const baseUser = {
  name: string,
  email: string.email(),
};

// Extended schemas
const Customer = pema({
  ...baseUser,
  customerId: string,
  tier: union("free", "premium", "enterprise"),
});

const Employee = pema({
  ...baseUser,
  employeeId: string,
  department: string,
  salary: number.min(0),
});
```

### Conditional Schemas with Unions

Use discriminated unions for type-safe conditional parsing:

```typescript
import pema from "pema";
import union from "pema/union";
import string from "pema/string";
import number from "pema/number";

// Payment method schemas
const CreditCard = pema({
  type: "credit_card",
  cardNumber: string.length(16, 16),
  expiry: string,
  cvv: string.length(3, 4),
});

const BankTransfer = pema({
  type: "bank_transfer",
  accountNumber: string,
  routingNumber: string,
});

const PayPal = pema({
  type: "paypal",
  email: string.email(),
});

// Combined payment schema
const Payment = union(CreditCard, BankTransfer, PayPal);

// TypeScript knows the type based on the discriminant
const payment = Payment.parse({
  type: "credit_card",
  cardNumber: "1234567890123456",
  expiry: "12/25",
  cvv: "123",
});
```

### Custom Validation with Regex

Use `.regex()` for custom string validation:

```typescript
import string from "pema/string";

// Phone number validation
const phoneNumber = string.regex(/^\+?[\d\s-()]+$/);

// Slug validation
const slug = string.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

// Hex color validation
const hexColor = string.regex(/^#[0-9A-Fa-f]{6}$/);

// IP address validation
const ipv4 = string.regex(/^(?:\d{1,3}\.){3}\d{1,3}$/);

// Combine with other validators
const username = string
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/);  // Must start with letter
```

### Type Coercion Patterns

Handle untyped input from forms and query strings:

```typescript
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";
import boolean from "pema/boolean";

// Form data processing
const RegistrationForm = pema({
  username: string.min(3).max(20),
  email: string.email(),
  age: uint.coerce.min(13),           // Coerce string to number
  newsletter: boolean.coerce.default(false), // "true"/"false" strings
});

// Query parameter processing
const SearchQuery = pema({
  q: string.optional(),
  page: uint.coerce.default(1),
  limit: uint.coerce.default(10).max(100),
  sort: union("asc", "desc").default("desc"),
});

// Parse URL search params
const params = Object.fromEntries(new URLSearchParams("?q=test&page=2"));
const query = SearchQuery.parse(params);
// { q: "test", page: 2, limit: 10, sort: "desc" }
```

### Recursive Schemas

For tree-like structures, use schema references:

```typescript
import pema from "pema";
import string from "pema/string";
import array from "pema/array";

// Category with subcategories
interface Category {
  name: string;
  children: Category[];
}

// Define the schema with explicit typing
const CategorySchema: any = pema({
  name: string,
  children: array(/* lazy reference would go here */),
});

// For true recursion, use a factory pattern
function createCategorySchema(maxDepth: number) {
  if (maxDepth === 0) {
    return pema({ name: string, children: array(unknown) });
  }
  return pema({
    name: string,
    children: array(createCategorySchema(maxDepth - 1)),
  });
}

const CategoryWithDepth = createCategorySchema(3);
```

### TypeScript Integration

Pema provides full TypeScript type inference:

```typescript
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

const User = pema({
  name: string,
  age: number.optional(),
  role: string.default("user"),
});

// Infer the output type
type User = typeof User.infer;
// { name: string; age: number | undefined; role: string }

// Infer the input type (what you can pass to parse)
type UserInput = typeof User.input;
// { name: string; age?: number; role?: string }

// Use inferred types in functions
function createUser(data: UserInput): User {
  return User.parse(data);
}

// Type-safe access to parsed data
const user = User.parse({ name: "John" });
user.name;  // string
user.age;   // number | undefined
user.role;  // string (default applied)
```

## API Reference

### Schema Functions

| Export | Import | Description |
|--------|--------|-------------|
| `pema` | `import pema from "pema"` | Main schema builder function |
| `array` | `import array from "pema/array"` | Create array schema |
| `object` | `import object from "pema/object"` | Create object schema |
| `tuple` | `import tuple from "pema/tuple"` | Create tuple schema |
| `record` | `import record from "pema/record"` | Create record schema |
| `union` | `import union from "pema/union"` | Create union schema |
| `optional` | `import optional from "pema/optional"` | Make schema optional |
| `constructor` | `import constructor from "pema/constructor"` | Validate class instances |
| `pure` | `import pure from "pema/pure"` | TypeScript-only type |
| `omit` | `import omit from "pema/omit"` | Remove object properties |
| `partial` | `import partial from "pema/partial"` | Make all properties optional |

### Primitive Types

| Export | Import | Description |
|--------|--------|-------------|
| `string` | `import string from "pema/string"` | String validation |
| `number` | `import number from "pema/number"` | Number validation (f64) |
| `boolean` | `import boolean from "pema/boolean"` | Boolean validation |
| `bigint` | `import bigint from "pema/bigint"` | Signed bigint (i64) |
| `biguint` | `import biguint from "pema/biguint"` | Unsigned bigint (u64) |
| `symbol` | `import symbol from "pema/symbol"` | Symbol validation |
| `date` | `import date from "pema/date"` | Date object validation |
| `unknown` | `import unknown from "pema/unknown"` | Accept any value |

### Integer Types

| Export | Import | Range |
|--------|--------|-------|
| `int` | `import int from "pema/int"` | -2^31 to 2^31-1 (i32) |
| `uint` | `import uint from "pema/uint"` | 0 to 2^32-1 (u32) |
| `i8` | `import i8 from "pema/i8"` | -128 to 127 |
| `i16` | `import i16 from "pema/i16"` | -32,768 to 32,767 |
| `i32` | `import i32 from "pema/i32"` | -2^31 to 2^31-1 |
| `i64` | `import i64 from "pema/i64"` | -2^63 to 2^63-1 (bigint) |
| `i128` | `import i128 from "pema/i128"` | -2^127 to 2^127-1 (bigint) |
| `u8` | `import u8 from "pema/u8"` | 0 to 255 |
| `u16` | `import u16 from "pema/u16"` | 0 to 65,535 |
| `u32` | `import u32 from "pema/u32"` | 0 to 4,294,967,295 |
| `u64` | `import u64 from "pema/u64"` | 0 to 2^64-1 (bigint) |
| `u128` | `import u128 from "pema/u128"` | 0 to 2^128-1 (bigint) |

### Float Types

| Export | Import | Description |
|--------|--------|-------------|
| `f32` | `import f32 from "pema/f32"` | 32-bit float (single precision) |
| `f64` | `import f64 from "pema/f64"` | 64-bit float (double precision) |

### Binary Types

| Export | Import | Description |
|--------|--------|-------------|
| `blob` | `import blob from "pema/blob"` | Blob validation |
| `file` | `import file from "pema/file"` | File validation |
| `url` | `import url from "pema/url"` | URL object validation |

### Special Types

| Export | Import | Description |
|--------|--------|-------------|
| `primary` | `import primary from "pema/primary"` | Optional string (for database IDs) |

### Type Exports

| Export | Import | Description |
|--------|--------|-------------|
| `ParseError` | `import { ParseError } from "pema/ParseError"` | Validation error class |
| `Issue` | `import { Issue } from "pema/Issue"` | Single validation issue type |
| `Schema` | `import { Schema } from "pema/Schema"` | Schema type definition |
| `StoreType` | `import { StoreType } from "pema/StoreType"` | Store schema type |
| `StoreSchema` | `import { StoreSchema } from "pema/StoreSchema"` | Store schema definition |
| `StoreId` | `import { StoreId } from "pema/StoreId"` | Store identifier type |
| `InferStore` | `import { InferStore } from "pema/InferStore"` | Infer type from store |
| `InferStoreOut` | `import { InferStoreOut } from "pema/InferStoreOut"` | Infer output type |
| `DataType` | `import { DataType } from "pema/DataType"` | Data type definition |
| `Serialized` | `import { Serialized } from "pema/Serialized"` | Serialized schema format |
| `JSONPayload` | `import { JSONPayload } from "pema/JSONPayload"` | JSON error payload type |
| `Id` | `import { Id } from "pema/Id"` | ID type |

### Validators by Type

#### String Validators

| Method | Description | Example |
|--------|-------------|---------|
| `.min(n)` | Minimum length | `string.min(1)` |
| `.max(n)` | Maximum length | `string.max(100)` |
| `.length(min, max)` | Length range | `string.length(5, 20)` |
| `.email()` | Email format | `string.email()` |
| `.uuid()` | UUID format | `string.uuid()` |
| `.startsWith(s)` | Prefix match | `string.startsWith("/")` |
| `.endsWith(s)` | Suffix match | `string.endsWith(".js")` |
| `.regex(r)` | Regex match | `string.regex(/^[a-z]+$/)` |
| `.isotime()` | ISO time format | `string.isotime()` |

#### Number/Integer Validators

| Method | Description | Example |
|--------|-------------|---------|
| `.min(n)` | Minimum value | `number.min(0)` |
| `.max(n)` | Maximum value | `number.max(100)` |
| `.range(min, max)` | Value range | `number.range(0, 100)` |

#### Array Validators

| Method | Description | Example |
|--------|-------------|---------|
| `.min(n)` | Minimum items | `array(string).min(1)` |
| `.max(n)` | Maximum items | `array(string).max(10)` |
| `.length(min, max)` | Item count range | `array(string).length(1, 5)` |
| `.unique()` | No duplicates | `array(string).unique()` |

### Common Modifiers

| Modifier | Available On | Description |
|----------|--------------|-------------|
| `.optional()` | All types | Accept `undefined` |
| `.default(v)` | All types | Provide default value |
| `.coerce` | number, int, uint, boolean, date, bigint | Enable type coercion |

## License

MIT

## Links

- [Documentation](https://primate.run/docs/validation)
- [GitHub](https://github.com/primate-run/primate)
- [Issues](https://github.com/primate-run/primate/issues)
