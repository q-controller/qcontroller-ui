const tokenValue = (dictionary, path) => {
  const token = dictionary.allTokens.find((t) => t.path.join('.') === path);
  if (!token) {
    throw new Error(`style-dictionary: unknown token '${path}'`);
  }
  return token.$value ?? token.value;
};

export default {
  source: ['design/tokens.json'],
  hooks: {
    formats: {
      // The favicon is a static asset, so its colours are baked in at token
      // build time rather than resolved from CSS variables at runtime.
      'svg/app-icon': ({ dictionary }) => {
        const from = tokenValue(dictionary, 'color.semantic.brand.tileFrom');
        const to = tokenValue(dictionary, 'color.semantic.brand.tileTo');
        const mark = tokenValue(dictionary, 'color.semantic.brand.mark');
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="qcontroller">
  <title>qcontroller</title>
  <!-- Generated from design/tokens.json by \`yarn generate:tokens\`. Do not edit. -->
  <defs>
    <linearGradient id="qc-tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}" />
      <stop offset="1" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#qc-tile)" />
  <g transform="translate(4 -0.5)" fill="none" stroke="${mark}" stroke-width="7" stroke-linecap="round">
    <circle cx="28" cy="28" r="11" />
    <path d="M39 28v20" />
  </g>
</svg>
`;
      },
    },
  },
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/generated/',
      files: [{ destination: 'tokens.css', format: 'css/variables' }],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'src/generated/',
      files: [
        { destination: 'tokens.js', format: 'javascript/esm' },
        {
          destination: 'tokens.d.ts',
          format: 'typescript/module-declarations',
        },
      ],
    },
    appIcon: {
      transformGroup: 'css',
      buildPath: 'public/',
      files: [{ destination: 'qcontroller.svg', format: 'svg/app-icon' }],
    },
  },
};
