import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import * as cheerio from 'cheerio';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Article,
  BackToTop,
  BlogList,
  CodeBlock,
  ContentNote,
  DemoFrame,
  FeatureList,
  Footer,
  Header,
  Link,
  Section,
  SidebarResizeHandle,
  SiteNavigation,
  SkipLink,
  TableOfContents,
} from 'searsuite-components';

const root = resolve(import.meta.dirname, '..');
const sourceRoot = resolve(root, 'source');
const content = ['index.html', 'api', 'blog', 'demo', 'docs', 'public'];
const homeSource = cheerio.load(readFileSync(resolve(sourceRoot, 'index.html'), 'utf8'));
const sourceFooter = homeSource('body > footer.site-footer');
if (!sourceFooter.length) throw new Error('Home page must define the shared site footer.');
const footerLinks = sourceFooter
  .find('.site-footer-links > a')
  .map((_, link) => ({
    label: homeSource(link).text(),
    href: homeSource(link).attr('href') ?? '#',
  }))
  .get();
const record = sourceFooter.find('.public-security-record').first();
const siteFooter = renderToStaticMarkup(
  createElement(Footer, {
    brand: createElement(Link, { href: '/' }, 'SearSuite'),
    links: footerLinks,
    extra: record.length
      ? createElement(
          Link,
          {
            className: 'public-security-record',
            href: record.attr('href'),
            rel: record.attr('rel'),
            target: record.attr('target'),
          },
          record.text(),
        )
      : undefined,
  }),
);
const siteBackToTop = renderToStaticMarkup(createElement(BackToTop));

for (const item of content) {
  rmSync(resolve(root, item), { recursive: true, force: true });
  cpSync(resolve(sourceRoot, item), resolve(root, item), {
    recursive: true,
    filter(path) {
      const name = relative(sourceRoot, path);
      return !name.split('/').some((part) => part === 'node_modules' || part === 'dist' || part === '.generated');
    },
  });
}
mkdirSync(resolve(root, 'src'), { recursive: true });
for (const name of ['main.ts', 'docs.ts', 'reference.ts', 'backToTop.ts']) {
  cpSync(resolve(sourceRoot, 'src', name), resolve(root, 'src', name));
}

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

const richContent = (html) => createElement('div', { dangerouslySetInnerHTML: { __html: html } });
const renderArticle = (title, intro = '', sections = []) =>
  renderToStaticMarkup(
    createElement(Article, {
      title,
      intro: intro ? richContent(intro) : undefined,
      sections: sections.map((section) => ({ ...section, content: richContent(section.content) })),
    }),
  );

function sectionData($, section) {
  const node = $(section);
  const heading = node.find('> h2').first();
  const title = heading.text();
  const id = node.attr('id') ?? heading.attr('id') ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  heading.remove();
  return { id, title, content: node.html() ?? '' };
}

function renderCodeBlocks($, content) {
  content.find('pre[data-language]').each((_, block) => {
    const element = $(block);
    element.replaceWith(renderToStaticMarkup(createElement(CodeBlock, {
      code: element.find('> code').text(),
      language: element.attr('data-language'),
    })));
  });
}

function renderContent($, body, main) {
  if (body.is('.home-page')) {
    const title = main.find('.hero-copy h1').first();
    title.replaceWith(renderArticle(title.text()));
    const demo = main.find('.workbench iframe').first();
    demo.parent().replaceWith(
      renderToStaticMarkup(
        createElement(DemoFrame, {
          src: demo.attr('src') ?? '',
          title: demo.attr('title') ?? 'Workbook demo',
        }),
      ),
    );
    const features = main.find('.intro-section > .feature-list').first();
    const featureHeading = main.find('.intro-section > h2').first();
    const featureItems = features
      .find('> article')
      .map((_, card) => ({
        title: $(card).find('h3').first().text(),
        description: $(card).find('p').first().text().trim(),
      }))
      .get();
    const featureSection = renderToStaticMarkup(
      createElement(Section, {
        id: 'engine',
        title: featureHeading.text(),
        children: createElement(FeatureList, { items: featureItems }),
      }),
    );
    featureHeading.replaceWith(featureSection);
    features.remove();
    main.find('.intro-section').removeAttr('id').removeClass('searsuite-section');
    const about = main.find('.about-section').first();
    const aboutTitle = about.find('> h2').first().text();
    about.find('> h2').first().remove();
    const aboutSection = cheerio.load(
      renderToStaticMarkup(
        createElement(Section, {
          id: 'about',
          title: aboutTitle,
          children: richContent(about.html() ?? ''),
        }),
      ),
    );
    aboutSection('section').addClass('about-section');
    about.replaceWith(aboutSection('section').toString());
  } else if (body.is('.guide-page')) {
    main.addClass('searsuite-resizable-shell');
    const sidebar = main.find('> .manual-sidebar').first();
    const article = main.find('> .manual-article').first();
    const heading = sidebar.find('> p').first().text();
    const tocSections = sidebar
      .find('a[href^="#"]')
      .map((_, link) => {
        const id = ($(link).attr('href') ?? '').slice(1);
        const chapter = article.find('> section').filter((_, section) => $(section).attr('id') === id);
        return {
          id,
          title: $(link).text(),
          subsections: chapter.find('h3[id]').map((_, child) => ({
            id: $(child).attr('id'),
            title: $(child).text(),
          })).get(),
        };
      })
      .get();
    const toc = cheerio.load(renderToStaticMarkup(createElement(TableOfContents, { sections: tocSections, heading })));
    toc('aside').addClass('manual-sidebar searsuite-sidebar').attr('data-searsuite-component', 'TableOfContents');
    sidebar.replaceWith(toc('aside').toString());

    renderCodeBlocks($, article);
    const first = article.find('> section').first();
    const title = first.find('> h1').first().text();
    first.find('> h1').first().remove();
    const intro = first.html() ?? '';
    const firstId = first.attr('id');
    const sections = article
      .find('> section')
      .slice(1)
      .map((_, section) => sectionData($, section))
      .get();
    const rendered = cheerio.load(renderArticle(title, intro, sections));
    rendered('article').addClass('manual-article');
    rendered('.searsuite-article-header').attr('id', firstId);
    article.replaceWith(rendered('article').toString());
    main.append(renderToStaticMarkup(createElement(SidebarResizeHandle)));
  } else if (body.is('.quickstart-page')) {
    main.addClass('manual-layout searsuite-shell searsuite-resizable-shell');
    const introduction = main.find('> .docs-landing-intro').first();
    const title = introduction.find('> h1').first().text();
    introduction.find('> h1').first().remove();
    const intro = introduction.html() ?? '';
    const content = main.find('> .quickstart-content').first();
    renderCodeBlocks($, content);
    const sections = content
      .find('> section')
      .map((_, section) => sectionData($, section))
      .get();
    introduction.replaceWith(renderArticle(title, intro, sections));
    main.find('> article').addClass('manual-article');
    const toc = cheerio.load(
      renderToStaticMarkup(
        createElement(TableOfContents, {
          sections,
          heading: 'Quickstart contents',
        }),
      ),
    );
    toc('aside').addClass('manual-sidebar searsuite-sidebar').attr('data-searsuite-component', 'TableOfContents');
    main.prepend(toc('aside').toString());
    content.remove();
    main.append(renderToStaticMarkup(createElement(SidebarResizeHandle)));
  } else if (body.is('.docs-home-page, .blog-page:not(.blog-post-page)')) {
    const introduction = main.find('> header').first();
    const eyebrow = introduction.find('> .eyebrow').first().toString();
    const title = introduction.find('> h1').first().text();
    introduction.find('> .eyebrow, > h1').remove();
    introduction.replaceWith(eyebrow + renderArticle(title, introduction.html() ?? ''));
    if (body.is('.docs-home-page')) {
      const destinations = main.find('.docs-destinations').first();
      const items = destinations
        .find('> a')
        .map((_, link) => ({
          href: $(link).attr('href') ?? '#',
          title: $(link).find('strong').text(),
          description: $(link).find('small').text(),
        }))
        .get();
      destinations.replaceWith(renderToStaticMarkup(createElement('nav', {
        className: 'docs-destinations',
        'aria-label': 'Documentation sections',
      }, createElement(FeatureList, { items }))));
      const note = main.find('.docs-source-note').first();
      const noteContent = note
        .find('> span')
        .contents()
        .toArray()
        .map((node, index) =>
          node.type === 'text'
            ? node.data
            : node.name === 'a'
            ? createElement(Link, { key: index, href: $(node).attr('href') ?? '#' }, $(node).text())
            : $(node).text(),
        );
      note.replaceWith(
        renderToStaticMarkup(
          createElement(ContentNote, {
            title: note.find('> strong').text(),
            children: noteContent,
          }),
        ),
      );
    } else {
      const list = main.find('.blog-list').first();
      const items = list
        .find('> a')
        .map((_, link) => ({
          href: $(link).attr('href') ?? '#',
          date: $(link).find('time').attr('datetime') ?? '',
          dateLabel: $(link).find('time').text(),
          title: $(link).find('strong').text(),
          description: $(link).find('small').text(),
        }))
        .get();
      list.replaceWith(renderToStaticMarkup(createElement(BlogList, { items })));
    }
  } else if (body.is('.blog-post-page')) {
    const article = main.find('> .blog-article').first();
    const header = article.find('> header').first();
    const time = header.find('time').first().toString();
    const title = header.find('h1').first().text();
    header.replaceWith(time + renderArticle(title));
  } else if (body.is('.reference-page')) {
    const sidebar = main.find('> .reference-sidebar').first();
    const sections = sidebar
      .find('.reference-nav-group')
      .map((_, group) => ({
        id: `details-${$(group).attr('data-chapter') ?? ''}`,
        title: $(group).find('> summary').first().text(),
        subsections: $(group)
          .find('> a')
          .map((_, link) => ({
            id: ($(link).attr('href') ?? '').slice(1),
            title: $(link).text(),
          }))
          .get(),
      }))
      .get();
    const toc = cheerio.load(renderToStaticMarkup(createElement(TableOfContents, {
      sections,
      heading: sidebar.find('> p').first().text(),
    })));
    toc('aside').addClass('reference-sidebar searsuite-sidebar').attr('data-searsuite-component', 'TableOfContents');
    toc('nav').attr('data-reference-navigation', '');
    sidebar.replaceWith(toc('aside').toString());
    const introduction = main.find('.reference-intro').first();
    const back = introduction.find('> .reference-back').first().toString();
    const title = introduction.find('> h1').first().text();
    introduction.find('> .reference-back, > h1').remove();
    introduction.replaceWith(back + renderArticle(title, introduction.html() ?? ''));
    main.find('.reference-example pre').each((_, block) => {
      const element = $(block);
      element.replaceWith(renderToStaticMarkup(createElement(CodeBlock, {
        code: element.find('code').text(),
        language: 'typescript',
      })));
    });
  }
}

function transform(path) {
  const source = readFileSync(path, 'utf8');
  const $ = cheerio.load(source);
  const body = $('body');
  if (!body.length || body.find('> header.site-header').length === 0) return;

  body.addClass('searsuite');
  const originalHeader = body.find('> header.site-header').first();
  const navigation = originalHeader.find('nav').first();
  const items = navigation
    .find('> a')
    .map((_, link) => ({
      label: $(link).text(),
      href: $(link).attr('href') ?? '#',
      current: $(link).attr('aria-current') === 'page',
    }))
    .get();
  originalHeader.replaceWith(
    renderToStaticMarkup(
      createElement(Header, {
        brand: 'SearSuite',
        brandHref: '/',
        navigation: createElement(SiteNavigation, { items, label: navigation.attr('aria-label') }),
      }),
    ),
  );

  const skipLink = body.find('> .skip-link').first();
  if (skipLink.length)
    skipLink.replaceWith(
      renderToStaticMarkup(
        createElement(SkipLink, {
          href: skipLink.attr('href') ?? '#main',
          children: skipLink.text(),
        }),
      ),
    );
  const main = body.find('> main').first();
  main.addClass('searsuite-main');
  main.find('> article, > .manual-article, > .reference-article').addClass('searsuite-article');
  main.find('> aside, > .manual-sidebar, > .reference-sidebar').addClass('searsuite-sidebar');
  main.find('section[id]').addClass('searsuite-section');
  main.find('section[id] > h2').each((_, heading) => {
    const section = $(heading).parent();
    if (!$(heading).find('a').length) $(heading).wrapInner(`<a href="#${section.attr('id')}"></a>`);
  });
  if (main.is('.manual-layout, .reference-layout')) main.addClass('searsuite-shell');
  renderContent($, body, main);

  const originalFooter = body.find('> footer.site-footer').first();
  if (originalFooter.length) originalFooter.replaceWith(siteFooter);
  else body.append(siteFooter);
  body.append(siteBackToTop);
  body.append('<script type="module" src="/src/backToTop.ts"></script>');

  $('link[rel="stylesheet"][href="/src/styles.css"]').attr('href', '/src/styles.css');
  writeFileSync(path, $.html());
}

for (const path of [
  resolve(root, 'index.html'),
  ...htmlFiles(resolve(root, 'blog')),
  ...htmlFiles(resolve(root, 'docs')),
]) {
  transform(path);
}
console.log('Synchronized website source content and applied SearSuite components.');
