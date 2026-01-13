---
title: Validate with Pema
---

Pema stands for **P**rimate sch**ema**. Use pema for type-safe validation of data.

!!!
Pema provides composable validators for common types.
!!!

---

### Basic usage

Import and use validators.

```ts
import p from "pema";

const Schema = p({
  name: p.string.min(1),
  age: p.number.min(0),
});

const data = Schema.parse({ name: "John", age: 30 });
```

---

### Built-in validators

- `string`: String validation
- `number`: Number validation
- `boolean`: Boolean validation
- `array`: Array validation
- `object`: Object validation

---

### Chaining

Chain validators for complex rules.

```ts
import p from "pema";

const EmailSchema = p.string.min(1).max(255).email();
const AgeSchema = p.number.integer().min(0).max(150);
```

---

### Error handling

Validation throws `ParseError` with details.

```ts
try {
  Schema.parse(input);
} catch (error) {
  console.log(error.errors); // detailed errors
}
```
