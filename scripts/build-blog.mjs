import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { marked } from 'marked';

const blogRoot = resolve(import.meta.dirname, '../source/blog');
const posts = JSON.parse(readFileSync(resolve(blogRoot, 'posts.json'), 'utf8'));
const listTemplate = readFileSync(resolve(blogRoot, 'list.template.html'), 'utf8');
const postTemplate = readFileSync(resolve(blogRoot, 'post.template.html'), 'utf8');

if (!Array.isArray(posts)) throw new Error('Blog posts.json must contain an array.');

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function displayDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

const slugs = new Set();
for (const post of posts) {
  if (
    typeof post.slug !== 'string' ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) ||
    typeof post.title !== 'string' ||
    !post.title.trim() ||
    typeof post.summary !== 'string' ||
    !post.summary.trim() ||
    typeof post.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(post.date) ||
    Number.isNaN(Date.parse(`${post.date}T00:00:00Z`))
  ) {
    throw new Error('Each blog post needs a valid slug, title, summary, and YYYY-MM-DD date.');
  }
  if (slugs.has(post.slug)) throw new Error(`Duplicate blog slug: ${post.slug}`);
  slugs.add(post.slug);
}

posts.sort((left, right) => right.date.localeCompare(left.date));
marked.use({ gfm: true });

const list = posts
  .map(
    (post) => `<a class="blog-list-item" href="/blog/${post.slug}/">
  <time datetime="${post.date}">${displayDate(post.date)}</time>
  <span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.summary)}</small></span>
  <span class="blog-list-arrow" aria-hidden="true">→</span>
</a>`,
  )
  .join('\n');
writeFileSync(resolve(blogRoot, 'index.html'), listTemplate.replace('<!-- BLOG_POSTS -->', list));

for (const post of posts) {
  const markdown = readFileSync(resolve(blogRoot, 'posts', `${post.slug}.md`), 'utf8');
  const output = postTemplate
    .replaceAll('<!-- POST_TITLE -->', escapeHtml(post.title))
    .replaceAll('<!-- POST_SUMMARY -->', escapeHtml(post.summary))
    .replaceAll('<!-- POST_DATE -->', post.date)
    .replaceAll('<!-- POST_DISPLAY_DATE -->', displayDate(post.date))
    .replace('<!-- POST_CONTENT -->', marked.parse(markdown));
  const postDirectory = resolve(blogRoot, post.slug);
  mkdirSync(postDirectory, { recursive: true });
  writeFileSync(resolve(postDirectory, 'index.html'), output);
}

console.log(`Generated ${posts.length} blog post${posts.length === 1 ? '' : 's'}.`);
