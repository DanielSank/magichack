import { css, html, LitElement, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { customElement, property } from "lit/decorators.js";
import type { AssetRef, FieldDef, FieldValues, GameSchema } from "@magichack/card-engine";
import { validateFieldValues } from "@magichack/card-engine";

/**
 * Events:
 *  fields-change: CustomEvent<{ values: FieldValues }>.
 */
@customElement("schema-form")
export class SchemaFormElement extends LitElement {
  static override styles = css`
    .field {
      margin-bottom: 0.75rem;
    }
    .field label {
      display: block;
    }
    .field input,
    .field select,
    .field textarea {
      display: block;
      margin-top: 0.25rem;
    }
    .fieldError {
      color: crimson;
      font-size: 0.85em;
      margin: 0.25rem 0 0;
    }
    .imagePreview {
      max-width: 100px;
      display: block;
      margin-top: 0.5rem;
    }
  `;

  @property({ attribute: false })
  schema!: GameSchema;
  // GameScheme.fields is FieldDef[]
  // FieldDef defines a field and i.e. that field's constraints, but does not
  // contain anything related to values of that field for a particular card.

  @property({ attribute: false })
  fieldValues: FieldValues = {};
  // List of values, totally structure-less.

  override render() {
    const { errors } = validateFieldValues(this.schema, this.fieldValues);
    const errorByKey = new Map(errors.map((e) => [e.key, e.message]));

    return html`
      <div>
        ${this.schema.fields.map(
          (field) => html`
            <div class="field">
              <label> ${field.label}${field.required ? " *" : ""} ${this.#renderControl(field)} </label>
              ${errorByKey.has(field.key) ? html`<p class="fieldError">${errorByKey.get(field.key)}</p>` : nothing}
            </div>
          `,
        )}
      </div>
    `;
  }

  #setField(key: string, value: FieldValues[string]) {
    const fieldValues = { ...this.fieldValues, [key]: value };
    this.dispatchEvent(new CustomEvent("fields-change", { detail: { fieldValues }, bubbles: true, composed: true }));
  }

  // <input> and <textarea> fire `input` on every keystroke, and they fire
  // `change` only on blur. So, we use `input` for free-typing controls and
  // `change` for discrete ones. (checkbox/select/file)
  //
  // This function has to run even when this.fieldValues does not satisfy
  // this.schema.
  #renderControl(field: FieldDef) {
    const value = this.fieldValues[field.key];
    // Structure-less

    switch (field.type) {
      case "string":
        return html`<input
          type="text"
          maxlength=${ifDefined(field.maxLength)}
          .value=${typeof value === "string" ? value : ""}
          @input=${(e: Event) => this.#setField(field.key, (e.target as HTMLInputElement).value)}
        />`;

      case "text":
        return html`<textarea
          maxlength=${ifDefined(field.maxLength)}
          .value=${typeof value === "string" ? value : ""}
          @input=${(e: Event) => this.#setField(field.key, (e.target as HTMLTextAreaElement).value)}
        ></textarea>`;

      case "integer":
        return html`<input
          type="number"
          min=${ifDefined(field.min)}
          max=${ifDefined(field.max)}
          .value=${typeof value === "number" ? String(value) : ""}
          @input=${(e: Event) => {
            const raw = (e.target as HTMLInputElement).value;
            this.#setField(field.key, raw === "" ? undefined : Number(raw));
          }}
        />`;

      case "boolean":
        return html`<input
          type="checkbox"
          .checked=${value === true}
          @change=${(e: Event) => this.#setField(field.key, (e.target as HTMLInputElement).checked)}
        />`;

      case "enum":
        return html`<select
          .value=${typeof value === "string" ? value : ""}
          @change=${(e: Event) => {
            const raw = (e.target as HTMLSelectElement).value;
            this.#setField(field.key, raw || undefined);
          }}
        >
          <option value="">—</option>
          ${field.values.map((v) => html`<option value=${v}>${v}</option>`)}
        </select>`;

      // A field.key like "types"/"rules" is really a list of short strings —
      // one line per entry keeps the control as simple as a plain textarea,
      // matching how the renderer already treats these ("\n".join for display).
      case "stringList": {
        const text = Array.isArray(value) ? value.join("\n") : "";
        return html`<textarea
          placeholder="One entry per line"
          .value=${text}
          @input=${(e: Event) => {
            const lines = (e.target as HTMLTextAreaElement).value.split("\n");
            this.#setField(field.key, lines.length === 1 && lines[0] === "" ? [] : lines);
          }}
        ></textarea>`;
      }

      // No real upload/asset storage yet (that's a backend concern, M3/M4) —
      // a local object URL is enough to preview a chosen image now.
      case "image": {
        const assetRef = isAssetRef(value) ? value : undefined;
        return html`
          <input
            type="file"
            accept="image/*"
            @change=${(e: Event) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              this.#setField(
                field.key,
                file ? { assetId: crypto.randomUUID(), url: URL.createObjectURL(file) } : undefined,
              );
            }}
          />
          ${assetRef?.url ? html`<img src=${assetRef.url} alt="" class="imagePreview" />` : nothing}
        `;
      }

      default: {
        const exhaustive: never = field;
        throw new Error(`Unhandled field type "${(exhaustive as FieldDef).type}"`);
      }
    }
  }
}

function isAssetRef(value: FieldValues[string]): value is AssetRef {
  return typeof value === "object" && value !== null && "assetId" in value;
}

declare global {
  interface HTMLElementTagNameMap {
    "schema-form": SchemaFormElement;
  }
}
