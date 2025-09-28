---
name: Show errors
---

Return error responses with appropriate status codes. Use `response()` for
custom errors.

!!!
Throw errors to trigger `+error.ts`; return responses for controlled errors.
!!!

---

### Throw error

Triggers error handler.

[s=guides/responses/show-errors/throw-error]

---

### Return error response

Controlled error response.

[s=guides/responses/show-errors/return-error-response]

---

### Error handler

Use `+error.ts` for global handling. Routes placed alongside `+error.ts` or in
subdirectories in its tree will trigger it upon throwing.

[s=guides/responses/show-errors/error-handler]
