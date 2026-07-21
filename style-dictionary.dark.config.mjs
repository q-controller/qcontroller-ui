// Dark-scheme pass: tokens.dark.json overrides the semantic layer on top of
// the base tokens (via `include`, so overrides don't warn as collisions).
// Only the overridden tokens are emitted, scoped to Mantine's dark selector.
export default {
  include: ['design/tokens.json'],
  source: ['design/tokens.dark.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/generated/',
      files: [
        {
          destination: 'tokens.dark.css',
          format: 'css/variables',
          filter: (token) => token.filePath.endsWith('tokens.dark.json'),
          options: { selector: ":root[data-mantine-color-scheme='dark']" },
        },
      ],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'src/generated/',
      files: [
        {
          destination: 'tokens.dark.js',
          format: 'javascript/esm',
          filter: (token) => token.filePath.endsWith('tokens.dark.json'),
        },
        {
          destination: 'tokens.dark.d.ts',
          format: 'typescript/module-declarations',
          filter: (token) => token.filePath.endsWith('tokens.dark.json'),
        },
      ],
    },
  },
};
