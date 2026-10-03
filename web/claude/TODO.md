# Topics to revisit

Open questions/design items raised during development, kept here so they
don't get lost. Append as they come up; remove once resolved (note the
resolution in a commit message or here, your call).

1. **Render functions should take `Card`, not `CardData`.** Should
   `renderMtgClassic` etc. (in `packages/card-engine/src/styles/**/style.ts`)
   accept the bare per-game `Card` type directly instead of the
   `gameId`-tagged `MtgCardData`/`PlayingCardsCardData` wrapper
   (`packages/card-engine/src/styles/types.ts`)?
   Raised 2026-09-06, during the code-walkthrough lesson plan (stop 4).
   Current design has `toRegistryStyle` (`registry.ts`) check `card.gameId`
   on the same object it then passes through to `style.render`, and keeps
   `RenderFn<C extends CardData>` uniform across every game's style. Worth
   revisiting once more of stops 4/5 are read, to see if that tradeoff still
   holds.

2. **Dynamic box resizing based on other boxes' content.** Some boxes should
   be able to grow/shrink based on whether other boxes have content — e.g.
   if `flavor-text` is empty, `rules-text` should be able to claim the space
   it would've occupied, rather than leaving it blank. Raised 2026-09-06.
   Current `RenderBox`/`RenderTree` (`styles/types.ts`) has every box's
   `x/y/width/height` as fixed numbers a style hardcodes at `render()` time —
   no notion of one box's layout depending on another box's content or
   presence. Needs design: where would this live (a style computing it
   itself before emitting boxes, vs. a new layout primitive in the render
   tree itself), and how it interacts with `fontFit`/auto-fit sizing, which
   already varies box content non-trivially.

3. **User-uploaded styles are a real security risk, not just a sandboxing
   footnote.** Raised 2026-09-07/08, during M2 planning. `packages/card-engine`'s
   `render()` already runs directly in the end user's own browser today (M2's
   live preview, and M5's planned client-side export) — not a future
   hypothetical, confirmed against the plan file's own "Live preview"/"Export:
   Client-Side" sections. So a future "upload your own style" feature is a
   real stored-XSS-shaped risk: a malicious style would execute inside
   whichever *other* user's browser session previews or views a card using
   it (their cookies, their ability to make authenticated requests), not a
   sandboxed server process. `registry.ts`'s own comment already separates
   "Tier 1: first-party TypeScript styles" from "user-authored styles...
   requiring sandboxing" — worth designing before that feature starts, not
   after. Two tiers discussed: (a) a restricted, declarative style format
   (data, not code — boxes/bindings/a closed expression grammar, interpreted
   by a trusted interpreter with zero ambient capability) as the first,
   likely-sufficient step; (b) real code in a genuine sandbox (WASM, per the
   plan's own M8+ note) only if (a) proves too limiting. Either way, evaluate
   non-first-party styles in a context with no access to the app's own
   session (a Worker or cookie-less cross-origin iframe), and keep
   `toSvgString` as the only thing that turns structured data into markup
   (text always escaped) so a misbehaving style can't smuggle raw `<script>`
   through a text field.

4. **Why do the browser and Node `ToSvgOptions` resolvers have to be
   completely separate implementations?** Raised 2026-09-08, while building
   `apps/web/src/render/browserToSvgOptions.ts` against
   `packages/card-engine/scripts/lib/{assetResolvers,measureText}.ts`. Both
   sides implement the exact same four callbacks
   (`resolveSymbolSvg`/`resolveRasterAsset`/`resolveFontData`/`measureText`)
   from scratch, with real duplicated logic (MIME-type-by-extension tables,
   the font-variant-lookup-by-family/weight/style logic, the
   package-root-relative-path convention) — Node's fs/fontkit vs the
   browser's `import.meta.glob`/Fetch/Canvas are genuinely different APIs,
   so *some* divergence is unavoidable, but it's worth revisiting whether
   more of the shared logic (the lookup/caching structure, not the actual
   I/O) could live in one place both edges import, instead of two
   from-scratch implementations that could silently drift apart the same
   way `packages/card-engine/dist/` itself already drifted stale once this
   session — same "one source of truth" smell.
