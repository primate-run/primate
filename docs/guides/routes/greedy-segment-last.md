---
name: Greedy segments last
---

Greedy segments (`[...name]` or `[[...name]]`) match across `/` and **must be the final segment**.

!!!
If you need structure after a greedy segment, split it into another folder level.
!!!

---

### 1) Good: greedy segment at the end

```ts
// routes/reports/[year]/[[...rest]].ts
// Matches: /reports/2024, /reports/2024/q2/sales, etc.
```

---

### 2) Anti-pattern: anything after a greedy segment

```ts
// routes/[[...rest]]/details.ts   <-- not allowed
```
