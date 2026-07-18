import StyleDictionary from 'style-dictionary';

export default {
  source: ['design/tokens.json'],
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
  },
};
