import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serversDir = path.resolve(__dirname, '../servers');

async function validate() {
  console.log(`Validating server listings in: ${serversDir}`);
  const files = await fs.readdir(serversDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.error('Error: No server listings found in servers/ directory!');
    process.exit(1);
  }

  let errorCount = 0;
  for (const file of jsonFiles) {
    const filePath = path.join(serversDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.name || typeof data.name !== 'string') {
        throw new Error('Missing or invalid string field: name');
      }
      if (!data.displayName || typeof data.displayName !== 'string') {
        throw new Error('Missing or invalid string field: displayName');
      }
      if (!data.description || typeof data.description !== 'string') {
        throw new Error('Missing or invalid string field: description');
      }
      if (!data.homepage || !data.homepage.startsWith('http')) {
        throw new Error('Missing or invalid URL: homepage');
      }
      if (!data.repository || !data.repository.startsWith('http')) {
        throw new Error('Missing or invalid URL: repository');
      }
      if (!['stdio', 'sse', 'http'].includes(data.transport)) {
        throw new Error(`Invalid transport: ${data.transport}`);
      }
      if (!data.command && !data.endpoint) {
        throw new Error('Listing must define either "command" or "endpoint"');
      }

      console.log(`✓ ${file} (${data.name}) — valid`);
    } catch (err) {
      console.error(`❌ Validation failed for ${file}:`, err.message);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    console.error(`\nValidation failed with ${errorCount} error(s).`);
    process.exit(1);
  }

  console.log(`\nAll ${jsonFiles.length} server listings validated successfully!`);
}

validate().catch(err => {
  console.error('Fatal error during validation:', err);
  process.exit(1);
});
