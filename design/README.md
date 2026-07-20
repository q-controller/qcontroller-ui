# qcontroller design system

Light ops console. IBM Plex Sans for UI, IBM Plex Mono wherever data lives
(specs, IDs, logs, timestamps). Light + dark schemes.

## Source of truth

- [tokens.json](tokens.json) — base set (light). W3C Design Tokens format.
- [tokens.dark.json](tokens.dark.json) — dark overrides. **Not standalone**:
  always built as a deep-merge over the base set (the Style Dictionary dark
  config uses `include: tokens.json` + `source: tokens.dark.json`, emitting
  only the overridden tokens scoped to `:root[data-mantine-color-scheme='dark']`).

## Generation

`yarn generate` (full codegen) or `yarn generate:tokens` (tokens only) builds:

| Output                                      | Contents                                            |
| ------------------------------------------- | --------------------------------------------------- |
| `src/generated/tokens.css`                  | all tokens as CSS variables on `:root`              |
| `src/generated/tokens.dark.css`             | dark overrides, scoped to the Mantine dark selector |
| `src/generated/tokens{,.dark}.js` + `.d.ts` | token objects for `src/theme.ts`                    |

## Binding token rules

1. **All colors come from the token files.** No raw hex, no borrowed palettes
   (including Mantine defaults) anywhere in `src/`. New color → add a token,
   regenerate, consume.
2. **Components reference semantic tokens only** (`--color-semantic-*`, theme
   keys). Primitive ramps (`color.blue.*`, …) are referenced by semantic
   tokens and `src/theme.ts`, never by components.
3. **Dark is a semantic remap**: same token names, different values. Never a
   parallel naming scheme.
4. **Blue-family accents collapse in dark.** `blue` and `cyan` both resolve to
   the muted steel ramp (`tokens.dark.json` maps `cyan.*` → `{color.blue.*}`);
   saturated brand blue is reserved for light surfaces. In the Mantine theme
   this is expressed with `virtualColor` (see `src/theme.ts`).
5. **Elevation**: light uses `shadow.card`/`shadow.raised`; dark flattens the
   card shadow — elevation comes from surface steps + borders. The theme reads
   shadows via the CSS variables so the dark override applies.

## Semantic usage

- **VM status** always uses the `color.semantic.vm.*` triple
  (indicator dot / text / bg pill). running=green, stopped=gray,
  pending=orange, error=red. Badge: pill radius, 11px semibold, uppercase.
- **Primary actions** (Start, Create): filled `accent.default` with
  `accent.onAccent` text. **Destructive actions** (Stop, Delete): outline —
  `danger.text` with `danger.border`.
- Page background `surface.page`; cards `surface.card` with
  `border.default` 1px + `shadow.card`. Header bar `surface.header` +
  `text.onHeader`.
- Instance names: Plex Sans 600. Specs lines: Plex Mono, `text.muted`.
- Motion: hover/focus `duration.fast`, expand `duration.base`, drawers
  `duration.slow`, `easing.standard`.

## Where things live

- Mantine mapping: [/src/theme.ts](../src/theme.ts)
- Component specs: [components.md](components.md)
- Reference sheet: [reference.html](reference.html) — open in a browser after
  `yarn generate:tokens`; renders live from the generated CSS variables in
  both schemes.
