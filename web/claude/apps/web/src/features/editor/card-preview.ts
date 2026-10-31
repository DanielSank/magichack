import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { selectStyle, toSvgString } from "@magichack/card-engine";
import type { CardMap, GameId, SymbolMeta } from "@magichack/card-engine";

import { getBrowserToSvgOptions } from "../../render/browserToSvgOptions.js";

@customElement("card-preview")
export class CardPreviewElement extends LitElement {
  static override styles = css`
    .fieldError {
      color: crimson;
      font-size: 0.85em;
    }
    svg {
      max-width: 100%;
      height: auto;
    }
  `;

  @property({ attribute: false })
  gameId!: GameId;

  @property({ attribute: false })
  cardData!: CardMap[GameId];

  @property({ attribute: false })
  gameSymbols: SymbolMeta[] = [];

  @property()
  styleId = "";

  @state()
  private svg: string | null = null;

  @state()
  private error: string | null = null;

  // Lit's equivalent of the React version's useEffect: react to cardData/
  // styleId changing, do the (async) render. Guarded to only the two props
  // that matter, since willUpdate fires on every update including the ones
  // this method itself causes (setting svg/error below) — without the
  // guard, that would re-trigger itself forever.
  override willUpdate(changed: Map<PropertyKey, unknown>) {
    if (changed.has("cardData") || changed.has("styleId") || changed.has("gameId") || changed.has("gameSymbols")) {
      void this.#renderCard();
    }
  }

  // render() is pure/synchronous per the engine's own design, and
  // getBrowserToSvgOptions() only actually fetches once, ever, so this
  // stays cheap after the very first render.
  async #renderCard() {
    const { gameId, cardData, gameSymbols, styleId } = this;
    try {
      const options = await getBrowserToSvgOptions();
      const style = selectStyle(gameId, styleId);
      if (!style) throw new Error(`No style "${styleId}" registered for game "${gameId}"`);
      const svg = toSvgString(style.render(cardData, { gameSymbols }), options);
      // Bail if cardData/styleId changed again while this was in flight —
      // same race-condition guard the React version's `cancelled` flag did.
      if (this.cardData !== cardData || this.styleId !== styleId || this.gameId !== gameId) return;
      this.svg = svg;
      this.error = null;
    } catch (e) {
      if (this.cardData !== cardData || this.styleId !== styleId || this.gameId !== gameId) return;
      this.error = e instanceof Error ? e.message : String(e);
    }
  }

  override render() {
    if (this.error) return html`<p class="fieldError">Preview failed: ${this.error}</p>`;
    if (!this.svg) return html`<p>Loading preview…</p>`;
    // Safe to inject directly: this SVG is built entirely from the current
    // user's own input in their own session, via card-engine's own
    // serializer — no untrusted third-party content involved (that concern
    // only applies once cards can be shared/published between users).
    return html`${unsafeSVG(this.svg)}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "card-preview": CardPreviewElement;
  }
}
