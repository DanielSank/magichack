import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { validateFieldValues } from "@magichack/card-engine";
import type { CardData, FieldValues } from "@magichack/card-engine";

import { GAME_SCHEMAS } from "../../gameSchemas.js";
import "./card-preview.js";
import "./game-selector.js";
import "./schema-form.js";

const firstGame = GAME_SCHEMAS[0];
if (!firstGame) throw new Error("No games registered — GAME_SCHEMAS is empty");

@customElement("editor-app")
export class EditorAppElement extends LitElement {
  // Light DOM, deliberately: reuses the existing global index.css rules
  // (.editor/.editorForm/.editorPreview) instead of duplicating them as
  // component styles — a normal Lit pattern for an app shell, distinct from
  // the shadow-DOM-encapsulated widgets underneath it.
  override createRenderRoot() {
    return this;
  }
  // Intentionallys skip default behavior, so we get no
  // shadow root creation and no adoption of styles.

  @state()
  private gameId = firstGame.id;

  @state()
  private fields: FieldValues = {};

  override render() {
    const game = GAME_SCHEMAS.find((g) => g.id === this.gameId);
    if (!game) throw new Error(`Unknown game "${this.gameId}"`);

    const { valid } = validateFieldValues(game, this.fields);
    const cardData = valid ? ({ gameId: game.id, fields: this.fields } as unknown as CardData) : undefined;
    // CardData is a union over objects { gameId: string; fields: <Card> } where <Card> is a card
    // type.

    return html`
      <div class="editor">
        <div class="editorForm">
          <game-selector
            .games=${GAME_SCHEMAS}
            .selectedGameId=${this.gameId}
            @game-select=${this.#handleGameSelect}
          ></game-selector>
          <schema-form .schema=${game} .fieldValues=${this.fields} @fields-change=${this.#handleFieldsChange}></schema-form>
        </div>
        <div class="editorPreview">
          ${cardData
            ? html`<card-preview .cardData=${cardData} .styleId=${game.defaultStyleId}></card-preview>`
            : html`<p>Fill in the required fields to see a preview.</p>`}
        </div>
      </div>
    `;
  }

  #handleGameSelect(event: CustomEvent<{ gameId: string }>) {
    this.gameId = event.detail.gameId;
    this.fields = {}; // Reset fields when game changes.
  }

  #handleFieldsChange(event: CustomEvent<{ fieldValues: FieldValues }>) {
    this.fields = event.detail.fieldValues;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "editor-app": EditorAppElement;
  }
}
