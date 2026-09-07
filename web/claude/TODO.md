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
