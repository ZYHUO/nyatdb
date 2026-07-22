# NyatDB

NyatBot-only embedded page store (not a Redis wrapper / not general SQL).

- **Rust + napi-rs** engine: [`native/`](./native/) — build with `npm run build` inside `native/`
- **TypeScript reference engine**: [`typescript/`](./typescript/) — same on-disk format (4KB slotted pages + redo WAL)
- **Docs**: [`docs/README.md`](./docs/README.md)

## Domains

ChatLog · HotState · Impulse · Bond · Recall

## Build (native)

```bash
cd native
npm install
npm run build   # → nyatdb.<platform>.node
```

Requires Node ≥22 and a Rust toolchain.

## Safety

Do **not** commit runtime data (`data/`, `*.ndb`, WAL) or API keys. This repo is the engine only.

## License

MIT
