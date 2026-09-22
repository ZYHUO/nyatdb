## What this changes

## Which engine(s)

- [ ] `native/` (Rust + napi-rs)
- [ ] `typescript/` (reference)
- [ ] docs only

## On-disk format impact

- [ ] No format change
- [ ] Format change — **applied to BOTH engines**

## How to verify

- [ ] built `native/` successfully (`npm run build`)
- [ ] the other engine still reads the same files
- [ ] no runtime data (`data/`, `*.ndb`, WAL) or keys committed
