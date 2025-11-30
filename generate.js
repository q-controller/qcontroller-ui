import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';

const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error(
    'Usage: node generate.js <path-to-proto-files> <path-to-openapi-yaml>'
  );
  process.exit(1);
}

await fs.rm('src/generated', { recursive: true, force: true });

execSync(`buf generate --template buf.gen.yaml ${args[0]}`, {
  stdio: 'inherit',
});

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
