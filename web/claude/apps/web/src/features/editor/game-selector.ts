import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { GameSchema } from "@magichack/card-engine";


/*
  * Events:
  *   game-select: Emitted when selected game changes.
  */
@customElement("game-selector")
export class GameSelectorElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;

  @property({ attribute: false })
  games: GameSchema[] = [];

  @property()
  selectedGameId = "";

  override render() {
    return html`
      <label>
        Game:
        <select .value=${this.selectedGameId} @change=${this.#handleChange}>
          ${this.games.map((game) => html`<option value=${game.id}>${game.name}</option>`)}
        </select>
      </label>
    `;
  }

  #handleChange(event: Event) {
    const gameId = (event.target as HTMLSelectElement).value;
    this.dispatchEvent(new CustomEvent("game-select", { detail: { gameId }, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "game-selector": GameSelectorElement;
  }
}
