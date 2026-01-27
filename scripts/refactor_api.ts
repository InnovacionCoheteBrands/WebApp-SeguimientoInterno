
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'client', 'src', 'lib', 'api.ts');

console.log(`Reading ${filePath}...`);
let content = fs.readFileSync(filePath, 'utf8');

// 1. Global Replacement: fetch( -> request(
// This effectively redirects all calls to the wrapper
// We use a regex to ensure we catch 'fetch(' with distinct boundary if needed, but 'fetch(' is precise enough here.
let newContent = content.replace(/fetch\(/g, 'request(');

// 2. Fix the infinite recursion in the wrapper itself
// The wrapper implementation (added previously) looks like:
// return fetch(url, fetchOptions);
// After step 1, it became:
// return request(url, fetchOptions);
// We need to revert this specific line.

const recursionValues = [
    'return request(url, fetchOptions);',
    'return await request(url, fetchOptions);'
];

let fixed = false;
for (const val of recursionValues) {
    if (newContent.includes(val)) {
        console.log(`Fixing recursion: ${val} -> fetch...`);
        newContent = newContent.replace(val, val.replace('request', 'fetch'));
        fixed = true;
    }
}

if (!fixed) {
    console.warn("⚠️ Warning: Could not find the specific recursion line to fix. Please check the file content manually.");
    // Flexible fallback: look for the request function body and fix any request(url inside it?
    // But since I just wrote the wrapper in step 1062, I know the exact syntax.
    // Let's print a snippet around 'function request' to help debug if it fails.
    const match = newContent.match(/async function request/);
    if (match && match.index) {
        console.log("Snippet around request function:");
        console.log(newContent.substring(match.index, match.index + 500));
    }
}

// 3. Write back
console.log(`Writing updated content to ${filePath}...`);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("✅ Refactor complete.");
