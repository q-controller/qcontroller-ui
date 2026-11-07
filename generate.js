import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import YAML from 'yaml';

const args = process.argv.slice(2);

if (args.length !== 3) {
  console.error(
    'Usage: node generate.js <path-to-proto-files> <path-to-image-openapi-yaml> <path-to-auth-openapi-yaml>'
  );
  process.exit(1);
}

await fs.rm('src/generated', { recursive: true, force: true });

execSync(`buf generate --template buf.gen.yaml ${args[0]}`, {
  stdio: 'inherit',
});

const baseSpec = YAML.parse(
  await fs.readFile('src/generated/openapi/openapi.yaml', 'utf8')
);
const authSpec = YAML.parse(await fs.readFile(args[2], 'utf8'));
for (const [pathKey, methods] of Object.entries(authSpec.paths ?? {})) {
  const fetchable = Object.fromEntries(
    Object.entries(methods).filter(([, op]) => op.responses?.['200'])
  );
  if (Object.keys(fetchable).length > 0) {
    baseSpec.paths[pathKey] = fetchable;
  }
}
baseSpec.components = {
  ...baseSpec.components,
  schemas: {
    ...baseSpec.components?.schemas,
    ...authSpec.components?.schemas,
  },
};
await fs.writeFile(
  'src/generated/openapi/openapi.yaml',
  YAML.stringify(baseSpec)
);

execSync(
  `openapi-generator-cli generate \
    -g typescript-fetch \
    -o src/generated/controller-client \
    -i src/generated/openapi/openapi.yaml \
    --additional-properties=supportsES6=true,npmName=qcontroller-client,withInterfaces=true`,
  { stdio: 'inherit' }
);

execSync(
  `openapi-generator-cli generate \
    -g typescript-fetch \
    -o src/generated/image-client \
    -i ${args[1]} \
    --additional-properties=supportsES6=true,npmName=qcontroller-client,withInterfaces=true`,
  { stdio: 'inherit' }
);

execSync('style-dictionary build --config style-dictionary.config.mjs', {
  stdio: 'inherit',
});

execSync('style-dictionary build --config style-dictionary.dark.config.mjs', {
  stdio: 'inherit',
});
