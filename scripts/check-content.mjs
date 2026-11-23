import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import * as cheerio from 'cheerio';

const root = resolve(import.meta.dirname, '..');
const sourceRoot = resolve(root, 'source');

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['dist', 'node_modules', '.generated'].includes(entry.name)) return [];
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

function visibleText(path) {
  const $ = cheerio.load(readFileSync(path, 'utf8'));
  $('script, style, template, noscript').remove();
  $('body > footer').remove();
  $('body.quickstart-page [data-searsuite-component="TableOfContents"]').remove();
  $('body.guide-page [data-searsuite-component="TableOfContents"] .searsuite-toc-subsections').remove();
  // Component rendering can move whitespace between block elements. Compare the
  // full character stream so every word, number, and punctuation mark is kept.
  return $('body').text().replace(/\s+/g, '');
}

const homeSource = cheerio.load(readFileSync(resolve(sourceRoot, 'index.html'), 'utf8'));
const expectedFooterLinks = homeSource('.site-footer-links > a')
  .map((_, link) => homeSource(link).attr('href'))
  .get();
const expectedRecord = homeSource('.public-security-record').first();
const failures = [];
for (const source of htmlFiles(sourceRoot)) {
  const name = relative(sourceRoot, source);
  const copy = resolve(root, name);
  const expected = visibleText(source);
  const actual = visibleText(copy);
  if (actual !== expected) {
    let first = 0;
    while (first < expected.length && expected[first] === actual[first]) first++;
    failures.push(
      `${name}: text differs near character ${first}\n  source: ${expected.slice(
        first,
        first + 90,
      )}\n  variant:  ${actual.slice(first, first + 90)}`,
    );
  }
  if (!name.includes('.template.') && !name.endsWith('/template.html') && !['api/index.html', 'demo/canvas.html'].includes(name)) {
    const $ = cheerio.load(readFileSync(copy, 'utf8'));
    if (!$('header.searsuite-header').length || !$('.searsuite-article').length) {
      failures.push(`${name}: missing directly rendered documentation components`);
    }
    const body = $('body');
    const footer = body.find('> footer.searsuite-footer');
    if (footer.length !== 1) failures.push(`${name}: expected one shared footer`);
    const footerLinks = footer
      .find('nav[aria-label="Footer"] > a')
      .map((_, link) => $(link).attr('href'))
      .get();
    if (JSON.stringify(footerLinks) !== JSON.stringify(expectedFooterLinks)) {
      failures.push(`${name}: footer links differ from the home page`);
    }
    const record = footer.find('.public-security-record').first();
    if (record.attr('href') !== expectedRecord.attr('href') || record.text() !== expectedRecord.text()) {
      failures.push(`${name}: footer security record differs from the home page`);
    }
    const required = ['SiteNavigation', 'BackToTop'];
    if (body.hasClass('home-page')) required.push('FeatureList', 'DemoFrame');
    if (body.hasClass('docs-home-page')) {
      required.push('FeatureList', 'ContentNote');
      const links = $('.docs-destinations .searsuite-feature-card')
        .map((_, link) => $(link).attr('href'))
        .get();
      if (JSON.stringify(links) !== JSON.stringify(['/docs/quickstart/', '/docs/guide/', '/docs/ref/'])) {
        failures.push(`${name}: documentation cards must link to quickstart, guide, and reference in that order`);
      }
    }
    if (body.hasClass('quickstart-page')) required.push('CodeBlock', 'TableOfContents', 'SidebarResizeHandle');
    if (body.hasClass('guide-page')) required.push('CodeBlock', 'TableOfContents', 'SidebarResizeHandle');
    if (body.hasClass('blog-page') && !body.hasClass('blog-post-page')) required.push('BlogList');
    if (body.hasClass('reference-page')) required.push('TableOfContents');
    for (const component of required) {
      if (!$(`[data-searsuite-component="${component}"]`).length) {
        failures.push(`${name}: missing ${component} from the component library`);
      }
    }
    if (body.hasClass('quickstart-page')) {
      const codeBlocks = $('article.searsuite-article pre[data-searsuite-component="CodeBlock"]');
      if (codeBlocks.length !== 4 || !codeBlocks.find('code.language-bash').length ||
          !codeBlocks.find('code.language-html').length || !codeBlocks.find('code.language-typescript').length) {
        failures.push(`${name}: expected four highlighted Bash, HTML, and TypeScript CodeBlock components`);
      }
      for (const section of $('article.searsuite-article > .searsuite-article-body > section[id]').toArray()) {
        const id = $(section).attr('id');
        if (!$(`[data-searsuite-component="TableOfContents"] a[href="#${id}"]`).length) {
          failures.push(`${name}: missing Quickstart link to #${id}`);
        }
      }
    }
    if (body.hasClass('guide-page')) {
      const toc = $('[data-searsuite-component="TableOfContents"]');
      const sections = $('article.searsuite-article .searsuite-article-header[id], article.searsuite-article section[id]');
      const subsections = $('article.searsuite-article h3[id]');
      if ($('article.searsuite-article h3').length !== subsections.length) {
        failures.push(`${name}: Guide subsection heading has no anchor`);
      }
      if (toc.find('a[href^="#"]').length !== sections.length + subsections.length) {
        failures.push(`${name}: guide table of contents differs from its headings`);
      }
      for (const section of [...sections.toArray(), ...subsections.toArray()]) {
        const id = $(section).attr('id');
        if (!toc.find(`a[href="#${id}"]`).length) failures.push(`${name}: missing Guide link to #${id}`);
      }
      if (!$('article.searsuite-article pre[data-searsuite-component="CodeBlock"] code.language-typescript').length) {
        failures.push(`${name}: expected component-rendered TypeScript code blocks`);
      }
    }
    if (name === 'docs/ref/index.html') {
      if ($('.reference-signature').toArray().some((item) => $(item).text().includes('…'))) {
        failures.push(`${name}: API signatures must not omit object members`);
      }
      const sidebar = $('[data-searsuite-component="TableOfContents"].reference-sidebar nav[data-reference-navigation]');
      const packageIds = new Set($('[data-reference-package]').map((_, item) => $(item).attr('id')).get());
      const packageLinks = sidebar.find('a[href^="#sear-"]');
      if (!sidebar.length || packageIds.size === 0 || packageLinks.length !== packageIds.size) {
        failures.push(`${name}: expected the component sidebar and all package details on one page`);
      }
      for (const link of sidebar.find('a').toArray()) {
        const target = $(link).attr('href')?.slice(1);
        if (!target || !$(`[id="${target}"]`).length) failures.push(`${name}: sidebar link has no target`);
      }
      if ($('a[href^="/docs/ref/packages/"]').length) failures.push(`${name}: found a package subpage link`);
      const ownMembers = $('[data-reference-member]').toArray();
      const inheritedMembers = $('.reference-inherited li').toArray();
      if (ownMembers.some((item) => !$(item).closest('.reference-member-group').length) ||
          inheritedMembers.some((item) => !$(item).closest('.reference-inherited-group').length)) {
        failures.push(`${name}: found an ungrouped API member`);
      }
      if ($('.reference-member-group[open]').length ||
          $('summary').toArray().some((item) => /^Members\b/.test($(item).text().trim()))) {
        failures.push(`${name}: expected categorized, initially collapsed member groups`);
      }
      for (const symbol of $('[data-symbol-group="enums"] [data-reference-symbol]').toArray()) {
        const entries = $(symbol).find('[data-reference-member], [data-enum-value]');
        const values = $(symbol).find('[data-member-group="values"] [data-reference-member], .reference-enum-values [data-enum-value]');
        if (entries.length && values.length !== entries.length) {
          failures.push(`${name}: enum entries must appear in Values`);
        }
        const table = $(symbol).find('table.reference-enum-table');
        if (entries.length && (table.length !== 1 ||
            table.find('tbody tr[data-enum-value]').length !== entries.length ||
            table.find('thead th').first().text() !== 'Member' ||
            table.find('thead th').eq(1).text() !== 'Value')) {
          failures.push(`${name}: enum values must render as a complete member/value table`);
        }
      }
      const collaborationCodes = $('#api-sear-domain-collaboration-collaborationerrorcode');
      if (!collaborationCodes.closest('[data-symbol-group="enums"]').length ||
          collaborationCodes.find('[data-enum-value]').length !== 11 ||
          collaborationCodes.find('.symbol-signatures').length) {
        failures.push(`${name}: collaboration error codes must appear as individual enum-like values`);
      }
      const codeAlias = $('#api-sear-domain-collaboration-collaborationerrorcodetype .reference-signature');
      if (!codeAlias.text().includes('alias CollaborationErrorCodeType = CollaborationErrorCode')) {
        failures.push(`${name}: collaboration error code alias must link to its target`);
      }
      const cellFormats = $('#api-sear-domain-cell-types-cellformats');
      const formatMethods = cellFormats.find('.reference-object-members[aria-label="Methods"]');
      if (cellFormats.find('.reference-object-members[aria-label="Properties"] [data-object-member]').length !== 7 ||
          formatMethods.find('[data-object-member]').length !== 2 ||
          !formatMethods.text().includes('currency(currency: string, locale?: string): CellFormat') ||
          !formatMethods.text().includes('excelCode(code: string): CellFormat')) {
        failures.push(`${name}: CellFormats must list every property and method with complete signatures`);
      }
    }
    if ($('.menu-button').length) failures.push(`${name}: source navigation button was not replaced`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Verified identical visible text in ${htmlFiles(sourceRoot).length} HTML files.`);
}
