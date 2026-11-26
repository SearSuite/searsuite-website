# SearSuite website

The site uses `searsuite-components` for its header, footer, navigation, cards, lists, articles, sidebars, sections, demo frame, and back-to-top control. The workbook canvas is rendered by the SearSuite editor.

`source/` owns the page templates, blog posts, demo, and static assets. The sibling `../searsuite` and `../searsuite-browser` checkouts supply editor source, host adapters, and API comments. Install dependencies in those repositories and here. `pnpm run sync` generates the guide, quickstart, blog, and API reference from those inputs, then renders the component-based pages in this repository. Generated pages are ignored by Git.

```sh
pnpm install
pnpm dev
pnpm build
pnpm check:content
```

The content check compares the visible text in `source/` with the rendered pages and verifies the component markup.

The npm Quickstart covers Sheet, Workbook and Headless using the published `0.0.1` packages. Code blocks marked `data-example` come from the public Browser repository's `examples/npm` project. Edit those runnable files first, then run `pnpm generate:quickstart`; it refreshes the embedded code in the tracked template and generates the page. Run `pnpm --dir ../searsuite-browser check:examples:npm` to verify a clean registry-only installation, strict TypeScript, both browser production entries and the Headless calculation/persistence contracts. Website source aliases are not used by that consumer check.

To regenerate the public package inventory, place the public `searsuite-components` checkout beside Core, Browser and Website, then run `node scripts/generate-package-inventory.mjs` from Website.

## Repository

Repository: [searsuite-website](https://github.com/SearSuite/searsuite-website).

## Community and releases

See [Contributing](CONTRIBUTING.md), the [Code of Conduct](CODE_OF_CONDUCT.md), [Support and maintainers](SUPPORT.md), the [Changelog](CHANGELOG.md), and [Versioning and compatibility](VERSIONING.md).
