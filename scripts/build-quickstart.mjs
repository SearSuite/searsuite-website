import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const websiteRoot = resolve(import.meta.dirname, '../source');
const examplesRoot = resolve(import.meta.dirname, '../../searsuite-browser/examples/npm');
const templatePath = resolve(websiteRoot, 'docs/quickstart/template.html');
const examples = new Set([
  'index.html', 'sheet.html', 'src/browser-host.ts',
  'src/workbook.ts', 'src/sheet.ts', 'headless.mjs',
]);
const original = readFileSync(templatePath, 'utf8');
const html = original.replace(
  /(<pre\b[^>]*data-example="([^"]+)"[^>]*><code>)[\s\S]*?(<\/code><\/pre>)/g,
  (_, start, name, end) => {
    if (!examples.has(name)) throw new Error(`Unknown npm Quickstart example: ${name}`);
    const code = readFileSync(resolve(examplesRoot, name), 'utf8').trimEnd();
    return start + code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;') + end;
  },
);
if (html !== original) writeFileSync(templatePath, html);
writeFileSync(resolve(websiteRoot, 'docs/quickstart/index.html'), html);
