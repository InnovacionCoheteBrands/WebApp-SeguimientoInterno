import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const replacements = {
  'Ã‰': 'É',
  'Ã³': 'ó',
  'Ã¡': 'á',
  'â Œ': '❌',
  'Ã­': 'í',
  'Ã©': 'é',
  'ðŸ’°': '💰',
  'ðŸ“Š': '📊',
  'Ãº': 'ú',
  'ðŸ”˜': '🔘',
  'ðŸ“‹': '📋',
  'â “': '❓',
  'ðŸ”´': '🔴',
};

function fixEncoding(filePath) {
  const absolutePath = resolve(__dirname, filePath);
  let content = fs.readFileSync(absolutePath, 'utf8');
  
  for (const [bad, good] of Object.entries(replacements)) {
    content = content.replaceAll(bad, good);
  }
  
  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log('Fixed', filePath);
}

fixEncoding('client/src/components/forms/personnel-form.tsx');
fixEncoding('client/src/components/quick-create-menu.tsx');

console.log("Encoding fixed");
