# Topics to revisit

Open questions/design items raised during development, kept here so they
don't get lost. Append as they come up; remove once resolved (note the
resolution in a commit message or here, your call).

1. **Dynamic box resizing based on other boxes' content.** Some boxes should
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

2. **User-uploaded styles are a real security risk, not just a sandboxing
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

3. **True WYSIWYG click-to-edit (matching fonts/spacing/inline symbols while
   typing), not just position/size overlay.** Raised 2026-10-31, after
   shipping click-to-edit v1 (plain `<input>`/`<textarea>`/`<select>`
   overlaid on a clicked box's position — no font/color/alignment matching,
   and inline symbols like mana costs show as raw `{T}` token text while
   editing since an HTML form control can't render inline icon glyphs).
   Researched how MagicSetEditor (`~/src/GenevensisMSE2/`) solves this, since
   it's the explicit design inspiration for this whole project:
   - **Mechanism:** `TextValueEditor` (`src/gui/value/text.hpp`) literally
     *inherits from* the read-only `TextValueViewer` and reuses its exact
     draw call, with one flag additionally painting a caret/selection.
     Editing and final rendering are the same code path — there is no
     second "editing representation" to keep in sync with the real render.
     The layout engine (`render/text/viewer.cpp`, ~1000 lines) lays text
     into lines and caches each character's pixel position as a side effect
     of drawing; the editor just looks up that cache for hit-testing/caret
     placement (`indexAt`/`charRect`).
   - **Inline symbols aren't a special case:** a mana symbol is just another
     `TextElement` subtype (`SymbolTextElement`, sibling of
     `FontTextElement`) reporting its own pixel width — the caret moves
     around it via the same per-character position array a letter uses.
   - **Scale:** ~2,700 lines total (layout engine + element hierarchy +
     editor: hit-testing, selection, clipboard, undo) — a real dedicated
     text-layout-and-editing engine, not a small trick.
   - **Translation to our stack:** the hard half MSE had to hand-roll —
     per-character pixel positions — the browser already gives for free on
     real SVG `<text>` elements via `getExtentOfChar(i)`/
     `getCharNumAtPosition(point)`, so that part wouldn't need
     reimplementing. What *would* still be needed: a hand-drawn blinking
     caret, click→caret positioning, selection-range highlighting, and
     capturing keystrokes to re-render via `toSvgString` on every keypress
     (SVG `<text>` `contenteditable` support is inconsistent/broken across
     browsers, so native in-place typing isn't a realistic shortcut).
     Inline symbols would come along for free the same way they did in MSE,
     since `parseInlineSymbols`/`toSvgString` already lay both kinds of run
     out in one pass.
   - **Verdict:** realistic as "don't maintain a second visual
     representation, re-render the real thing on each keystroke and overlay
     only a hand-built caret" — but this is a dedicated sub-feature (perf
     considerations from re-rendering per keystroke, a real caret/selection
     UI, full keyboard-input interception), not a quick follow-up to fold
     into click-to-edit v1. Current stopgap considered instead: match the
     overlay's font-family/font-size/color/alignment to the clicked box's
     own style properties (all already present on `TextBox`) for a closer
     *visual* match, without attempting live-typing WYSIWYG — not yet done.
