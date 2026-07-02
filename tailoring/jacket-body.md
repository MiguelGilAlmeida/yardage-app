# Jacket Body

## Current implementation (pending verification)

In `layout.ts` and `index.html`:

```
bkW = chest/4 + 2.5    // back panel width
frW = chest/4 + 3      // front panel width
```

Armhole shape is drawn as fixed bezier curve fractions of the piece dimensions (not measurement-driven).

### Open questions
- What is the correct armhole depth formula? (estimated: chest/4 × 0.6 for back, chest/4 × 0.7 for front)
- Should armhole depth drive sleeve cap height?

---

<!-- Add formulas here as references are confirmed -->
