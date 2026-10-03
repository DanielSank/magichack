# Custom Trading Card Creator — Implementation Plan

## Context

The goal is a web application where users design custom cards and card sets for trading card games (Magic: The Gathering–style, standard playing cards to start), see a live visual render as they edit, save/export their work, and optionally publish it for others to browse.
This plan defines the initial architecture from scratch.

The design converged on a few load-bearing decisions:

- **Games** are what fields a card has. They are statically defined by the app, not user-created.
Games are defined once as language-neutral schema files so both the (Pthon) backend and (TypeScript) frontend can load/validate against the same source of truth without duplicating logic in two languages.
- **Styles** are how a card is visually rendered.
  - Think about the multitude of visually different decks of playing cards; each one of those would be a "style" and any given card, e.g. the Queen of Clubs, can be rendered in any one of those styles.
They are first-party TypeScript modules for now.
  - Styles use statically typed TypeScript code modules that are reusable across styles (e.g. shared pip-layout logic for playing cards).
  - User-authored styles are an explicit *future* phase requiring a sandboxing solution (likely WASM) — out of scope now, but the architecture must not preclude it.
  - A style is a pure function: `render(card, context) -> RenderTree`.
It decides values and layout but does not draw pixels.
`context` is narrowly `{ positionInSet?, setSize? }`, e.g. enough for set numbering like "1/134".
Styles cannot reference other cards' data.
- `RenderTree` is a data structure containing a set of boxes: textboxes, images, etc., each with position, size, font/color/alignment, z-order) etc.
A `RenderTree` is consumed by a renderer to produce a card image, keeping rendering technology swappable independent of style code.
- **Backend**: Probably Python, maybe Rust later, behind a technology-agnostic API contract (OpenAPI, service/repository layering) so it can be reimplemented in different languages later without disrupting the frontend.
- **Accounts**: real accounts required from day one (ownership + publishing depend on it). Email/password only for v1 — OAuth deferred, but the data model leaves room for it.

## Repository Structure

Monorepo: pnpm workspaces for the TS side, a fully separate Python service directory so a future Rust rewrite touches one clearly-bounded folder.

```
/
├── game-schemas/                 # SOURCE OF TRUTH — language-neutral YAML
│   ├── mtg.yaml
│   └── playing-cards.yaml
│
├── packages/
│   └── card-engine/              # shared TS engine — no React, no browser/Node-only APIs
│       ├── src/
│       │   ├── schema/           # types.ts, load.ts, validate.ts
│       │   ├── render-tree/      # types.ts: RenderTree, RenderBox, TextRun, CardData, RenderContext
│       │   ├── render/           # toSvgString.ts — RenderTree -> SVG string, incl. symbol-aware text flow/wrap
│       │   ├── symbols/          # registry.ts (SymbolRegistry), parseInlineSymbols.ts
│       │   ├── styles/
│       │   │   ├── shared/pipLayout.ts
│       │   │   ├── mtg/classic.ts
│       │   │   └── playing-cards/classic.ts
│       │   └── registry.ts       # style registry keyed by id + gameId
│       ├── assets/symbols/       # placeholder SVGs now; swapped for real assets later
│       └── package.json
│
├── apps/
│   ├── web/                      # React + Vite + TS frontend
│   │   └── src/{features/{auth,editor,sets,gallery}, api/, components/}
│   │
│   └── server/                   # FastAPI backend, own pyproject.toml/venv
│       └── app/{api/v1/routers, services/, repositories/, models/, schemas/, core/, game_schema/}
│
├── infra/
│   ├── docker-compose.yml        # postgres, server, web dev
│   └── migrations/               # alembic
│
├── pnpm-workspace.yaml
└── package.json
```

`packages/card-engine` must stay free of browser-only globals so it can later run unmodified in a server-side render service if that becomes necessary (see Export below).
`apps/server` never imports it - Python never runs style code; only `game-schemas/*.yaml` is shared cross-language, as data.

## Core Data Model

**Game schema (YAML)** — parsed independently by TS (`js-yaml`) and Python (`PyYAML`):

```yaml
id: mtg
name: "Magic: The Gathering style"
defaultStyleId: mtg-classic
fields:
  - { key: name,      type: string, label: "Name",      required: true, maxLength: 80 }
  - { key: manaCost,  type: string, label: "Mana Cost",  pattern: "^(\\{[0-9WUBRGXC]+\\})*$" }
  - { key: typeLine,  type: string, label: "Type Line",  required: true }
  - { key: rulesText, type: text,   label: "Rules Text", maxLength: 1000 }
  - { key: power,     type: string, label: "Power" }
  - { key: toughness, type: string, label: "Toughness" }
  - { key: flavorText,type: text,   label: "Flavor Text" }
  - { key: art,       type: image,  label: "Art" }
```

Field `type` ∈ `string | text | integer | boolean | enum | image`, with type-specific constraints (`maxLength`, `min`/`max`, `pattern`, `values`).
Drives both the frontend `SchemaForm` and the backend's generic validator from the same file.

**CardData / RenderTree** (card-engine):

```ts
type CardData = { gameId: string; fields: Record<string, string | number | boolean | AssetRef | undefined> };
type RenderContext = { positionInSet?: number; setSize?: number }; // nothing else — no cross-card access
type RenderTree = { width: number; height: number; background?: {...}; boxes: RenderBox[] };
type RenderBox = TextBox | ImageBox | ShapeBox; // id, x, y, width, height, rotationDeg?, zIndex?
type TextRun = { kind: 'text'; text: string } | { kind: 'symbol'; symbolId: string }; // TextBox.content: TextRun[]
```

`TextBox` holds `content: TextRun[]` rather than a plain string, so styles can mix literal text with inline symbol references (e.g. mana/energy icons embedded in a cost or rules-text field) — see **Inline Symbols** below.

**Persisted entities (Postgres):**

| Entity | Key fields |
|---|---|
| `User` | id, email, passwordHash, displayName, createdAt |
| `Card` | id, ownerId, gameId, styleId, fieldValues **JSONB**, thumbnailAssetId?, isPublic, createdAt, updatedAt |
| `Set` | id, ownerId, name, description, coverImageAssetId?, isPublic, createdAt, updatedAt |
| `SetCard` (join) | setId, cardId, position (int, unique per set) — `positionInSet`/`setSize` are *computed* from this table at render time, never stored on `Card` |
| `Asset` | id, ownerId, storageKey, url, contentType, width, height, sizeBytes, createdAt |

`fieldValues` as JSONB is the main reason for choosing Postgres — one `Card` table serves every game's differently-shaped fields without per-game tables or EAV sprawl, while `gameId` + the shared validator enforce structure at the application layer.
`User` intentionally omits an OAuth table for v1 (email/password only); adding `OAuthAccount(id, userId, provider, providerAccountId)` later is additive, not a migration of existing data.

**Style registry** is *not* a DB table — a static, code-defined array in `card-engine` (`{id, gameId, displayName, render}`).
Backend stores `styleId` as an opaque string; frontend is authoritative on which IDs exist.

## Inline Symbols (Rich Text)

Card text (MTG mana costs, `{T}`-style rules-text symbols, and eventually other games' cost/type icons) needs to mix literal text with small inline symbol glyphs.
Symbol assets are user-supplied SVGs — not a pre-built icon font, and not limited to the standard MTG mana set — so the design uses **inline SVG images**, not an icon-font pipeline:

- **`SymbolRegistry`** — static, data-driven, alongside the style registry: `{ id, gameId | shared, svgAssetPath }`.
Swapping a placeholder for a real asset later is a file replacement at the same `id`, no code change.
- **`parseInlineSymbols(text, symbolSet) -> TextRun[]`** — a shared card-engine helper that turns shorthand text (e.g. `"{2}{R}{R}: draw a card"`) into a mix of `{kind:'text'}` and `{kind:'symbol'}` runs.
Any style that needs symbol parsing calls this rather than reimplementing it.
- **Layout is the hard part.** SVG's native `<text>`/`<tspan>` flow doesn't know how to wrap an inline `<image>` the way it wraps a `<tspan>` — that's the tradeoff for not using a font.
`toSvgString()` therefore needs its own small text+icon flow/wrap layer: treat each symbol run as a fixed-width unit sized relative to the surrounding font size, and compute its own x/y position during line-wrapping rather than delegating that to the browser's text engine.
This is genuinely the most involved piece of rendering logic in the system and should be built and validated explicitly in M1, not left implicit inside "one style per game."
- **Placeholders now, real assets later:** ship a handful of simple placeholder SVGs under `packages/card-engine/assets/symbols/` (plain colored shapes) registered against the MTG mana-cost field so the pipeline is exercised end-to-end in M1.
Real SVGs drop in at the same registry IDs when available — no engine changes required.

## Backend API Surface

**Stack:** FastAPI (async; auto-generated OpenAPI is the real interop contract for a future Rust rewrite) + SQLAlchemy 2.0 async + Alembic + Postgres.

**Layering:** `router → service → repository`. Routers only parse/validate HTTP and call a service; services hold all business rules (ownership checks, publish rules, schema validation) and depend on repository *interfaces* (Python `Protocol`), not SQLAlchemy directly — so swapping persistence, or the whole language, later doesn't touch business logic.
DTOs (Pydantic, `schemas/`) stay distinct from ORM `models/`.

**Auth (v1, email/password only):** argon2/bcrypt password hashing via passlib, httpOnly cookie session (simpler and safer than client-managed JWTs for a pure browser app; revisit if a non-browser client shows up later).

**Endpoints** (`/api/v1`):

```
POST   /auth/register            POST /auth/login          POST /auth/logout
GET    /users/me

GET    /games                    GET /games/{gameId}

POST   /cards                    GET /cards/{id}            PATCH /cards/{id}   DELETE /cards/{id}
GET    /cards?owner=me|public&game=mtg&cursor=...
PATCH  /cards/{id}/publish

POST   /sets                     GET /sets/{id}             PATCH /sets/{id}    DELETE /sets/{id}
GET    /sets?owner=me|public&cursor=...
POST   /sets/{id}/cards          # {cardId, position}
PATCH  /sets/{id}/cards/{cardId} # reorder
DELETE /sets/{id}/cards/{cardId}
PATCH  /sets/{id}/publish

POST   /assets                   # multipart upload -> {id, url}
GET    /assets/{id}
```

Card writes run `fieldValues` through the shared Python `validate(gameSchema, fieldValues)` before hitting the repository — mirrors what the frontend runs on blur for instant feedback, but the server is the actual gate.
Cursor-based pagination on list endpoints.
`Asset` storage sits behind a small interface (`LocalDiskStorage` for dev, swappable for S3-compatible storage in prod).

## Frontend Architecture

**React + TypeScript + Vite.** Mature schema-driven-form ecosystem (`react-hook-form`), no friction rendering `RenderTree` as SVG (JSX or string injection both work), TanStack Query pairs naturally with the REST backend.

- **Schema-driven editor:** `SchemaForm` iterates `game.fields`, rendering the matching control per `field.type`; validation rules come from the same `game-schemas` YAML via card-engine's validator (built into a dynamic Zod schema at runtime — one place "knows" MTG's fields).
- **Live preview:** on each debounced field change, build `CardData`, call the selected style's `render(cardData, context)` (pure, synchronous, no network), feed the resulting `RenderTree` into card-engine's `toSvgString()`.
Using the same serializer for preview and export makes WYSIWYG structural, not just a testing goal.
- **Set editor:** drag-and-drop reorder (`dnd-kit`) over the user's cards, add/remove membership, live "n/N" indicator; previewing any card in a set passes real `positionInSet`/`setSize` into `RenderContext`.
- **Auth UI:** login/register, protected-route wrapper, "My Library" (cards + sets).
- **Public gallery:** unauthenticated route, filter by game, paginated `/cards?public=true` and `/sets?public=true`.
- **Typed API client:** generated from the backend's OpenAPI spec (`openapi-typescript` or `orval`) rather than hand-written fetch calls — this is what makes the "clean API boundary" enforceable day to day, and the first thing that breaks loudly (at typecheck time) if a future Rust backend's contract drifts.

## Export: Client-Side for v1

**Recommendation:** client-side export, reusing the exact `card-engine` pipeline already powering live preview — `RenderTree → toSvgString() → <canvas> → toBlob('image/png')`.
On save/publish, optionally `POST` the resulting PNG to `/assets` and attach it as `thumbnailAssetId`.

**Why:** the render pipeline already runs entirely client-side for the editor; there's zero marginal infrastructure, and reusing the identical serializer for preview and export makes "what you see is what you export" structural rather than something to maintain by discipline.

**Defer a server-side render service until one of these actually bites:** guaranteed-consistent/print-quality/bulk export (e.g. "export a whole set as print-and-play PDF") independent of any user's browser; backfilling thumbnails for all public cards after a style update; exports triggered outside a browser session; or export load outgrowing client CPU.
Because `card-engine` stays DOM/browser-free from day one, that future service is an additive Node process that imports the same package for `render()` + `toSvgString()` — no change to the frontend or to any style code.

## Build Sequence / Milestones

Each milestone is independently demoable and not blocked on unimplemented later work.

- **M1 — Card engine in isolation.** `game-schemas/mtg.yaml` + `playing-cards.yaml`; TS schema loader/validator; `RenderTree` types; `toSvgString()`, including its text+symbol flow/wrap layer and the placeholder `SymbolRegistry`/`parseInlineSymbols`; one style per game, with the MTG style exercising an inline-symbol field (mana cost).
No React, no backend.
*Demo:* a script feeding sample `CardData` (including a mana cost with placeholder symbols) through the engine, producing an `.svg` you open in a browser.
- **M2 — Editor UI, no backend.** Vite/React app, `SchemaForm` driven by the game schema, live SVG preview wired to card-engine, local-only state.
*Demo:* pick a game, fill fields, watch the card render live.
- **M3 — Backend CRUD + auth (email/password), no frontend integration.** FastAPI + Postgres (docker-compose), Alembic migrations, router/service/repository layers, register/login/me, Cards & Sets endpoints validating `fieldValues` against the same YAML.
*Demo:* via Swagger UI/curl — register, log in, create/fetch a card, see a 422 on invalid data.
  - **Formalize the game-schema meta-schema here.** `parseGameSchema` (M1) currently defines what makes a `game-schemas/*.yaml` file itself valid — id/name/defaultStyleId/fields[], each field one of the five types with its type-specific properties — only imperatively, in TS code.
  The moment M3 adds a Python parser for the same files, that shape has two independent hand-written definitions with no shared source of truth, the same drift risk already called out for field-*value* validation below.
  Before/while writing the Python parser, introduce a **JSON Schema** document describing a valid `GameSchema` (YAML is a JSON superset, so no translation layer needed) and validate against it from both sides — `ajv` in TS, `jsonschema` in Python — so the meta-schema has exactly one definition instead of two.
  (Considered protobuf for this and rejected it: it's built for binary RPC interchange, not hand-authored config, and only checks shape — not `maxLength`/`pattern`/`enum` constraints, which is most of what this validator does.
  JSON Schema's constraint vocabulary already matches ours directly.)
- **M4 — Persistence wired to frontend.** Connect M2 to M3: login/register screens, generated typed API client, save/load/edit a card, "My Cards" list.
*Demo:* create, edit, refresh the browser, still there.
- **M5 — Export.** Client-side "Export PNG" button; optional upload-as-thumbnail on publish.
*Demo:* exported file matches the on-screen preview.
- **M6 — Sets + numbering.** Set editor (create/add/reorder), `SetCard` endpoints, `positionInSet`/`setSize` wired into preview and export.
*Demo:* build a 3-card set, correct "1/3, 2/3, 3/3" numbering, reorder updates it live.
- **M7 — Publishing/gallery.** `isPublic` toggle on cards/sets, unauthenticated gallery with pagination/filter-by-game, public detail pages.
*Demo:* publish as user A, browse anonymously.
- **(Future, explicitly out of scope) M8+** — server-side render service; OAuth; user-authored styles with WASM sandboxing.

## Testing / Verification

- **card-engine:** Vitest unit tests for the schema validator (valid/invalid per field type/required/enum/pattern); snapshot tests of each style's `render()` output for fixed `CardData`+`RenderContext`; serializer tests for `toSvgString()`; a checked-in "golden" SVG per style as a cheap visual-regression net.
- **Frontend:** Vitest + React Testing Library for `SchemaForm` and preview wiring; Playwright E2E against a docker-composed backend+db covering register→create→edit→reload, build-a-set→reorder→verify numbering, export→verify the downloaded PNG decodes, publish→log out→view as anonymous visitor.
- **Backend:** service-layer unit tests with a mocked repository (ownership checks, validation error paths, publish rules); repository/integration tests against a real test Postgres; API tests via FastAPI's `TestClient` for auth-required/forbidden cases and pagination; an OpenAPI-schema snapshot check so breaking contract changes are caught explicitly — this is the artifact a future Rust rewrite has to honor.
- **Cross-language consistency:** a shared fixture directory of `(gameId, fieldValues, expectedValid)` cases run through both the TS validator (Vitest) and the Python validator (pytest) in CI, so the two hand-written implementations can't silently drift apart.
The same risk applies one level up, to what makes a `game-schemas/*.yaml` file itself valid — see the JSON Schema note under M3.
- **CI:** lint (eslint/ruff) + typecheck (`tsc --noEmit`, mypy/pyright) + unit tests both sides → docker-compose up (db+backend) → Playwright E2E → frontend build.
Each milestone above also serves as a manual smoke-test checkpoint.

### Critical Files

- `game-schemas/mtg.yaml` (and `playing-cards.yaml`) — the single source of truth both languages parse; get the field-type vocabulary right here first.
- `packages/card-engine/src/render-tree/types.ts` — `RenderTree`/`RenderBox`/`TextRun`/`CardData`/`RenderContext` shapes every style, the SVG serializer, and the React preview depend on.
- `packages/card-engine/src/schema/validate.ts` — generic field validator, mirrored (and fixture-tested) against `apps/server/app/game_schema/validate.py`.
- `packages/card-engine/src/render/toSvgString.ts` (specifically its symbol-aware text flow/wrap logic) and `packages/card-engine/src/symbols/registry.ts` — the inline-symbol pipeline; get this right early since M1 is designed to validate it against a real field (mana cost).
- `apps/server/app/services/card_service.py` — where ownership rules, publish rules, and schema validation converge; the template every other service follows, and the piece most load-bearing for a clean Rust port later.
- `apps/web/src/components/SchemaForm.tsx` (+ a `CardPreview` component using card-engine's `toSvgString`) — proves the schema-driven-form + live-preview architecture end to end and is reused unmodified through later milestones.
