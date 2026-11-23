import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const siteUrl = 'https://searsuite.com';
const blogPosts = JSON.parse(readFileSync(resolve(import.meta.dirname, 'blog/posts.json'), 'utf8')) as Array<{
  slug: string;
}>;
const packageRoots = ['../searsuite-browser/packages', '../searsuite-pro/packages', '../searsuite/packages']
  .map((path) => resolve(import.meta.dirname, path));
const workspaceAliases = packageRoots.flatMap((packagesRoot) => readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(packagesRoot, entry.name, 'src/index.ts')))
  .map((entry) => ({
    find: `@searsuite/${entry.name}`,
    replacement: resolve(packagesRoot, entry.name, 'src/index.ts'),
  })));

function seoFiles(siteUrl: string): Plugin {
  return {
    name: 'searsuite-seo-files',
    transformIndexHtml(html, context) {
      const relativePath = context.filename.replace(`${resolve(import.meta.dirname)}/`, '');
      const routeByFile: Record<string, string> = {
        'api/index.html': '/api/',
        'blog/index.html': '/blog/',
        'docs/guide/index.html': '/docs/guide/',
        'docs/quickstart/index.html': '/docs/quickstart/',
        'docs/index.html': '/docs/',
        'docs/ref/index.html': '/docs/ref/',
        'index.html': '/',
      };
      for (const post of blogPosts) routeByFile[`blog/${post.slug}/index.html`] = `/blog/${post.slug}/`;
      const route = routeByFile[relativePath] ?? context.path;
      return html.replaceAll('%SITE_URL%', siteUrl).replaceAll('%CANONICAL_PATH%', route);
    },
    closeBundle() {
      const outputDirectory = resolve(import.meta.dirname, 'dist');
      mkdirSync(outputDirectory, { recursive: true });
      writeFileSync(
        resolve(outputDirectory, 'robots.txt'),
        `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
      );
      writeFileSync(
        resolve(outputDirectory, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
          '/',
          '/docs/',
          '/docs/quickstart/',
          '/docs/guide/',
          '/docs/ref/',
          '/blog/',
          ...blogPosts.map((post) => `/blog/${post.slug}/`),
        ]
          .map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`)
          .join('\n')}\n</urlset>\n`,
      );
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [seoFiles(siteUrl)],
    resolve: {
      alias: workspaceAliases,
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(import.meta.dirname, 'index.html'),
          demo: resolve(import.meta.dirname, 'demo/canvas.html'),
          blog: resolve(import.meta.dirname, 'blog/index.html'),
          ...Object.fromEntries(
            blogPosts.map((post) => [
              `blog-${post.slug}`,
              resolve(import.meta.dirname, `blog/${post.slug}/index.html`),
            ]),
          ),
          docs: resolve(import.meta.dirname, 'docs/index.html'),
          quickstart: resolve(import.meta.dirname, 'docs/quickstart/index.html'),
          guide: resolve(import.meta.dirname, 'docs/guide/index.html'),
          reference: resolve(import.meta.dirname, 'docs/ref/index.html'),
          apiRedirect: resolve(import.meta.dirname, 'api/index.html'),
        },
      },
    },
  };
});
