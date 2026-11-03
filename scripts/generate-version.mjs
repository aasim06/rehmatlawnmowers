import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const versionData = {
  version: '2.2.0',
  buildTime: Date.now(),
  buildDate: new Date().toISOString()
};

fs.writeFileSync(
  path.join(publicDir, 'version.json'),
  JSON.stringify(versionData, null, 2),
  'utf-8'
);

console.log('✅ Generated public/version.json:', versionData);

