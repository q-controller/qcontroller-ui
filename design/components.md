# Component specs

The contract for how each component consumes tokens. When touching a
component, this file says what is intentional. Global rules (semantic-only
references, no raw hex) are in [README.md](README.md).

## VM status badge - `Instance.tsx` (`getStatusBadge`)

- Anatomy: indicator dot (6px circle), uppercase label, pill container.
- Tokens: dot `vm.<state>.indicator`, label `vm.<state>.text`, container
  `vm.<state>.bg`; radius `radius.pill`; label `font.size.xs` (11px) at
  `font.weight.semibold`.
- State mapping: RUNNING -> running; STOPPED -> stopped;
  STARTING and REQUESTINGSTOP -> pending; anything else -> error.
- Do not use Mantine `color=` presets here; the triple is the contract.

## Actions - `Instance.tsx`, CSS classes in `index.css`

- Primary (Start): `variant="filled"` + `className="action-primary"` -
  `accent.default` background, `accent.onAccent` text, `accent.hover` on
  hover.
- Destructive (Stop, Delete): `variant="outline"` +
  `className="action-danger"` - transparent background, `danger.text` icon,
  `danger.border` border; hover fills with `danger.border`.
- Escalated destructive (Force Stop): `variant="filled"` +
  `className="action-danger-solid"` - `danger.solid` background,
  `danger.onSolid` icon, `danger.solidHover` on hover. The heavier weight
  signals the more destructive action.
- Disabled state stays Mantine's; the classes guard with `:not(:disabled)`.

## Header bar - `App.tsx`

- Bar `surface.header` (brand blue in light, steel in dark); title, burger and
  header icons `text.onHeader`.
- Scheme toggle lives here (moon/sun `ActionIcon`, subtle variant).

## Navbar - `App.tsx`

- Background `surface.page`. Active `NavLink` = `filled` variant of the
  primary color (steel ramp in dark via the theme's virtual `blue`).

## Cards and stat tiles - `Dashboard.tsx`, `StatCard.tsx`, `Nodes.tsx`

- `Card`/`Paper`: radius `radius.md` (theme default props), border
  `border.default`, shadow `shadow.card` - flat in dark by token override.
- Node card icon: `ThemeIcon color="cyan"` - cyan is a token ramp that
  resolves to the steel ramp in dark; endpoint badge is gray `light` variant.

## Data badges - `Instance.tsx`

- IP addresses: `Badge variant="light" color="blue"`.
- Image name: `Badge variant="light" color="cyan"`.
- MAC address: mono badge, `fontFamilyMonospace`.
- All resolve to the steel ramp in dark via virtual colors; keep the `light`
  variant for data chips, `filled` is reserved for actions and status.

## Code and log surfaces - `YamlEditor.tsx`, `InstanceLogs.tsx`

- Shared contract: both sit on `surface.card` with `text.primary` foreground
  in dark; their backgrounds must be indistinguishable.
- YamlEditor dark = token-built chrome (`surface.card` background and gutter,
  `text.muted` gutter text) + one-dark syntax colors only - never a prebuilt
  editor theme's chrome (its background would fight the tokens).
- LogTerminal resolves the same two variables at runtime (xterm needs concrete
  values) and re-resolves on scheme change.
- Both use `fontFamilyMonospace` (Plex Mono).

## Typography

- Headings: Plex Sans semibold; h1 `font.size.2xl` bold, h2 `font.size.xl`.
- Body `font.size.md` (14px); secondary UI `sm`; micro labels and badges `xs`.
- Anything data-shaped (specs, IDs, logs, timestamps, endpoints): Plex Mono.
