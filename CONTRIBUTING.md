# Contributing to NyatDB

NyatDB is an **embedded page store for NyatBot**. It is deliberately not a
Redis wrapper and not general SQL — if you need those, this isn't it.

## Structure

| path | what |
|---|---|
| `native/` | Rust + napi-rs engine (the real one) |
| `typescript/` | reference engine, **same on-disk format** |

Two engines, one file format. That invariant is the whole point.

## Build

```bash
cd native
npm install
npm run build   # → nyatdb.<platform>.node
```

Requires Node ≥ 22 and a Rust toolchain.

## The one rule that matters

**Do not change the on-disk format in one engine only.** 4KB slotted pages plus
a redo WAL — any change to page layout, slot encoding, or WAL records must land
in `native/` and `typescript/` together, or one of them becomes unreadable.

If you add a domain (ChatLog · HotState · Impulse · Bond · Recall), same rule:
both engines.

## What's useful to contribute

- Correctness fixes in either engine, as long as they stay format-compatible
- Readability of the domain code
- Docs

## What isn't

- New features that only make sense outside NyatBot
- Changes that fork the format between the two engines
- Committing runtime data (`data/`, `*.ndb`, WAL) or keys — engine only
