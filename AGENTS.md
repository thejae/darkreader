# Agent Rules — Dark Reader (thejae fork)

These rules apply to every AI agent working in this repository. The implementation is NOT done until the full checklist below is complete.

## Definition of done (always, in this order)

1. **Implement** the change. Keep the repo healthy: run `npm run lint` and the relevant tests (`npm run test:unit`; `npm run test:edge` when Edge/Chromium-MV3 code changed).
2. **Comment every function** you add or change — see [Function comments](#function-comments).
3. **Update `CHANGELOG.md`**: add one bullet per user-visible change under the top `# Unreleased (YYYY-MM-DD)` header. Create the header at the top of the file if it is missing. Never edit sections of already-released versions.
4. **Commit**: one commit per completed implementation, imperative-mood summary matching repo style (`Fix PDF inversion.`, `Add Edge build hook.`). The commit body may reference the matching changelog bullet.
5. **Push** — `git push` immediately after committing. A `pre-push` hook runs `scripts/build-edge.ps1` on every push; the push only completes if the Edge build succeeds. Do not bypass the hook with `--no-verify` unless the user explicitly asks.
6. **Edge build**: the pushed code lands in `edge-build/`, ready to load in Edge (see [Edge build](#edge-build)). The build runs automatically on push; running it manually is only needed when asked.

## Function comments

Every added or modified top-level/exported function gets a TSDoc/JSDoc comment with `@param` for each parameter and `@returns` when it returns a value. Keep `// @ts-check` files fully typed. Match the repo style, e.g. `tasks/platform.js`:

```ts
/**
 * Edge builds the Chromium MV3 codebase, so every MV3 code path applies to it.
 * @param {string} platform
 * @returns {boolean}
 */
export const isChromiumMV3 = (platform) =>
    platform === PLATFORM.CHROMIUM_MV3 ||
    platform === PLATFORM.CHROMIUM_MV3_PLUS ||
    platform === PLATFORM.EDGE;
```

Non-trivial logic gets inline comments explaining *why*, not *what*; never comment self-evident statements.

## Changelog

`CHANGELOG.md` sections are headed `# 4.9.135 (November 6, 2026)`. While work is in progress, keep a top section `# Unreleased (YYYY-MM-DD)` and add bullets in the existing wording style (`Fixed ...`, `Edge: ...`, `Chrome, Edge: ...`). When a version ships, the release manager renames the Unreleased header to the shipped version.

## Edge build

- **Hook**: `.githooks/pre-push` → `scripts/build-edge.ps1` → `node tasks/cli.js build --debug --edge` → mirrors `build/debug/edge` into `edge-build/`.
- **New clones** must register the hooks once: `git config core.hooksPath .githooks`
- **Manual build**: `.\scripts\build-edge.ps1` (PowerShell).
- **Load in Edge**: open `edge://extensions` → enable **Developer mode** → **Load unpacked** → pick the `edge-build` folder. After each push, click the **Reload** (↻) button on Dark Reader to pick up the new build.
- Git has no post-push hook, so the build runs as part of the push: the build must succeed for the push to complete, which guarantees `edge-build/` always matches the last pushed commit.
