---
name: Validate with Pema
---

Pema stands **P**rimate sch**ema**. Use pema for type-safe validation of data.

!!!
Pema provides composable validators for common types.
!!!

### 1) Basic usage

Import and use validators.

```ts
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

const schema = pema({
  name: string.min(1),
  age: number.min(0),
});

const data = schema.parse({ name: "John", age: 30 });
```

### 2) Built-in validators

- `string`: String validation
- `number`: Number validation
- `boolean`: Boolean validation
- `array`: Array validation
- `object`: Object validation

### 3) Chaining

Chain validators for complex rules.

```ts
const emailSchema = string.min(1).max(255).email();
const ageSchema = number.integer().min(0).max(150);
```

### 4) Error handling

Validation throws `ParseError` with details.

```ts
try {
  schema.parse(input);
} catch (error) {
  console.log(error.errors); // detailed errors
}
