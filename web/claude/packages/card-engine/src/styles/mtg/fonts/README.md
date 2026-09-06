# mtg fonts

These `.woff2` files are stand-ins, not the real named MTG fonts — see the
comment in `manifest.ts` for the mapping and why. Each is an open-license
(SIL OFL 1.1) font pulled from Google Fonts:

| File | Actual font | Standing in for |
| --- | --- | --- |
| `goudy-medieval-regular.woff2` | MedievalSharp | Goudy Medieval |
| `mplantin-regular.woff2` | EB Garamond (regular) | MPlantin |
| `mplantin-italic.woff2` | EB Garamond (italic) | MPlantin (italic) |
| `matrix-bold.woff2` | PT Serif (bold) | Matrix Bold |
| `beleren-bold.woff2` | Cinzel (bold) | Beleren Bold |

Goudy Medieval, MPlantin, Matrix, and Beleren itself are not freely
embeddable: Beleren is Wizards of the Coast's own proprietary font, and
MPlantin/Matrix are commercial Monotype/Emigre fonts requiring a paid
(and, for web/embedding use, separately licensed) copy. These lookalikes let
the rendering pipeline and styles be built and tested now; swap the files
here for licensed originals whenever those are sourced — nothing else needs
to change, since styles only ever reference the logical family name (e.g.
`"Beleren Bold"`), not a specific file.

These files are gitignored (see `web/claude/.gitignore`) along with other
binary design assets, not committed to history.
