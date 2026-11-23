import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const websiteRoot = resolve(import.meta.dirname, '../source');
copyFileSync(resolve(websiteRoot, 'docs/quickstart/template.html'), resolve(websiteRoot, 'docs/quickstart/index.html'));
