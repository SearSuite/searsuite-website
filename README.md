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

To regenerate the public package inventory, place the public `searsuite-components` checkout beside Core, Browser and Website, then run `node scripts/generate-package-inventory.mjs` from Website.

The site build reads sibling source from the public Core and Browser repositories. Configure the GitHub repository's `production` environment and the `SERVER_HOST`, `SERVER_PORT`, `SERVER_USER`, `SERVER_SSH_KEY`, and `SSH_KNOWN_HOSTS` secrets, then set `WEBSITE_DEPLOY_ENABLED` to `true` to enable deployment.

## Repository

Repository: [searsuite-website](https://github.com/SearSuite/searsuite-website).

## Community and releases

See [Contributing](CONTRIBUTING.md), the [Code of Conduct](CODE_OF_CONDUCT.md), [Support and maintainers](SUPPORT.md), the [Changelog](CHANGELOG.md), and [Versioning and compatibility](VERSIONING.md).
