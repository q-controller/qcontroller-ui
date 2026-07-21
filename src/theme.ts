import {
  createTheme,
  virtualColor,
  type MantineColorsTuple,
} from '@mantine/core';
import tokens from '@/generated/tokens';
import darkTokens from '@/generated/tokens.dark';

// Leaves of tokens.js are Style Dictionary token objects; $value holds the value.
interface Token {
  $value?: unknown;
}

const color = (t: Token) => String(t.$value);
const dim = (t: Token) => String(t.$value);

const fontStack = (t: Token) =>
  (t.$value as string[])
    .map((f) => (f.includes(' ') ? `'${f}'` : f))
    .join(', ');

const gray = tokens.color.gray;
const white = color(gray[0]);

// Accent ramps define the ten Mantine shades as a uniform 50–900 scale;
// this maps them 1:1.
const rampTuple = (ramp: typeof tokens.color.blue): MantineColorsTuple => [
  color(ramp[50]),
  color(ramp[100]),
  color(ramp[200]),
  color(ramp[300]),
  color(ramp[400]),
  color(ramp[500]),
  color(ramp[600]),
  color(ramp[700]),
  color(ramp[800]),
  color(ramp[900]),
];

const grayTuple: MantineColorsTuple = [
  color(gray[50]),
  color(gray[100]),
  color(gray[200]),
  color(gray[300]),
  color(gray[400]),
  color(gray[500]),
  color(gray[600]),
  color(gray[700]),
  color(gray[800]),
  color(gray[900]),
];

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    // Brand blue in light; the muted steel ramp from tokens.dark.json in dark,
    // so filled elements (buttons, active nav) don't glare on dark surfaces.
    // Cyan follows the same scheme split; its dark ramp references the blue
    // ramp in tokens.dark.json, so all blue-family accents match in dark.
    blue: virtualColor({ name: 'blue', light: 'blueLight', dark: 'blueDark' }),
    cyan: virtualColor({ name: 'cyan', light: 'cyanLight', dark: 'cyanDark' }),
    blueLight: rampTuple(tokens.color.blue),
    blueDark: rampTuple(darkTokens.color.blue),
    cyanLight: rampTuple(tokens.color.cyan),
    cyanDark: rampTuple(darkTokens.color.cyan),
    gray: grayTuple,
    green: rampTuple(tokens.color.green),
    orange: rampTuple(tokens.color.orange),
    red: rampTuple(tokens.color.red),
    // Mantine's dark-scheme surface/text palette, indexed 0-9 like Mantine
    // expects; sourced from the color.dark ramp in tokens.dark.json.
    dark: [
      color(darkTokens.color.dark[0]),
      color(darkTokens.color.dark[1]),
      color(darkTokens.color.dark[2]),
      color(darkTokens.color.dark[3]),
      color(darkTokens.color.dark[4]),
      color(darkTokens.color.dark[5]),
      color(darkTokens.color.dark[6]),
      color(darkTokens.color.dark[7]),
      color(darkTokens.color.dark[8]),
      color(darkTokens.color.dark[9]),
    ] as MantineColorsTuple,
  },
  white,
  black: color(gray[900]),
  fontFamily: fontStack(tokens.font.family.sans),
  fontFamilyMonospace: fontStack(tokens.font.family.mono),
  fontSizes: {
    xs: dim(tokens.font.size.xs),
    sm: dim(tokens.font.size.sm),
    md: dim(tokens.font.size.md),
    lg: dim(tokens.font.size.lg),
    xl: dim(tokens.font.size.xl),
  },
  defaultRadius: 'sm',
  radius: {
    sm: dim(tokens.radius.sm),
    md: dim(tokens.radius.md),
  },
  spacing: {
    xs: dim(tokens.space[2]),
    sm: dim(tokens.space[3]),
    md: dim(tokens.space[4]),
    lg: dim(tokens.space[5]),
    xl: dim(tokens.space[6]),
  },
  // Via the generated CSS variables (not baked-in strings) so the dark-scheme
  // overrides in tokens.dark.json apply: dark flattens card shadows entirely.
  shadows: {
    xs: 'var(--shadow-card)',
    sm: 'var(--shadow-raised)',
  },
  headings: {
    fontFamily: fontStack(tokens.font.family.sans),
    fontWeight: String(tokens.font.weight.semibold.$value),
    sizes: {
      h1: {
        fontSize: dim(tokens.font.size['2xl']),
        fontWeight: String(tokens.font.weight.bold.$value),
      },
      h2: { fontSize: dim(tokens.font.size.xl) },
    },
  },
  components: {
    Card: { defaultProps: { radius: 'md' } },
    Paper: { defaultProps: { radius: 'md' } },
  },
});
