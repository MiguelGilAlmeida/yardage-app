# Sleeves

## Current implementation (pending verification)

In `layout.ts` and `index.html`:

```
slvH = (sleeveLength + SA) + 7
```

The `+7` is a placeholder for sleeve cap height + second seam allowance at the cap.
This needs to be replaced with a verified formula once a reference is confirmed.

### Open questions
- What is the correct sleeve cap height for a jacket? (estimated 5.5–7")
- Should cap height be derived from armhole measurements or fixed?
- Is SA needed at both cuff and cap ends? (yes — currently only added once)

---

<!-- Add formulas here as references are confirmed -->
