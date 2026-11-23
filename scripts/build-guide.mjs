import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'cheerio';
import { marked } from 'marked';
import { cleanBlockComment, commentsIn, publishedSourceFiles, workspacePath } from '../../searsuite/scripts/source-comments.mjs';

const websiteRoot = resolve(import.meta.dirname, '../source');
const chapters = [];

for (const file of publishedSourceFiles()) {
  for (const comment of commentsIn(file)) {
    const text = cleanBlockComment(comment.text);
    const heading = text.match(/^@guideChapter\s+(\d+)\s+([a-z0-9-]+)\s+(.+)$/m);
    if (!heading) continue;

    const body = text.match(/^@guideBody\s*\n([\s\S]*)$/m)?.[1]?.trim();
    if (!body) {
      throw new Error(`${workspacePath(file)} contains an incomplete @guideChapter comment.`);
    }

    chapters.push({
      body,
      file,
      order: Number(heading[1]),
      slug: heading[2],
      title: heading[3].trim(),
    });
  }
}

chapters.sort((left, right) => left.order - right.order);
if (chapters.length < 9) {
  throw new Error(`Library Guide requires at least 9 source-derived chapters; found ${chapters.length}.`);
}

const identities = new Set();
for (const chapter of chapters) {
  const identity = `${chapter.order}:${chapter.slug}`;
  if (identities.has(identity)) throw new Error(`Duplicate Library Guide chapter ${identity}.`);
  identities.add(identity);
}

const escapeHtml = (value) =>
  value.replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]),
  );

marked.use({
  gfm: true,
  renderer: {
    code({ text, lang }) {
      const language = lang === 'ts' || lang === 'typescript'
        ? 'typescript'
        : lang === 'sh' || lang === 'bash' ? 'bash' : 'plaintext';
      return `<pre data-language="${language}"><code>${escapeHtml(text)}</code></pre>`;
    },
  },
});

const navigation = chapters
  .map((chapter, index) => `<a${index === 0 ? ' class="is-active"' : ''} href="#${chapter.slug}">${chapter.title}</a>`)
  .join('\n');

function renderChapterBody(chapter) {
  const $ = load(marked.parse(chapter.body), null, false);
  const usedIds = new Set([chapter.slug, ...$('h3[id]').map((_, heading) => $(heading).attr('id')).get()]);
  $('h3:not([id])').each((_, heading) => {
    const slug = $(heading).text().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    let id = `${chapter.slug}-${slug}`;
    for (let suffix = 2; usedIds.has(id); suffix += 1) id = `${chapter.slug}-${slug}-${suffix}`;
    $(heading).attr('id', id);
    usedIds.add(id);
  });
  return $.root().html();
}

const content = chapters
  .map(
    (chapter, index) => `<section id="${chapter.slug}">
  ${index === 0 ? `<h1>${chapter.title}</h1>` : `<h2>${chapter.title}</h2>`}
  ${renderChapterBody(chapter)}
</section>`,
  )
  .join('\n');

const template = readFileSync(resolve(websiteRoot, 'docs/guide/template.html'), 'utf8');
const output = template.replace('<!-- GUIDE_NAVIGATION -->', navigation).replace('<!-- GUIDE_CONTENT -->', content);

writeFileSync(resolve(websiteRoot, 'docs/guide/index.html'), output);
console.log(`Generated ${chapters.length} Library Guide chapters from source comments.`);
