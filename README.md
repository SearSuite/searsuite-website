# SearSuite website

The site uses `searsuite-components` for its header, footer, navigation, cards, lists, articles, sidebars, sections, demo frame, and back-to-top control. The workbook canvas is rendered by the SearSuite editor.

`source/` owns the page templates, blog posts, demo, and static assets. The sibling `../searsuite`, `../searsuite-browser`, and `../searsuite-pro` checkouts supply editor source, host adapters, and API comments. Install dependencies in those repositories and here. `pnpm run sync` generates the guide, quickstart, blog, and API reference from those inputs, then renders the component-based pages in this repository. Generated pages are ignored by Git.

```sh
pnpm install
pnpm dev
pnpm build
pnpm check:content
```

The content check compares the visible text in `source/` with the rendered pages and verifies the component markup.

The deployment workflow checks out `SearSuite/searsuite`, `SearSuite/searsuite-browser`, and `SearSuite/searsuite-cloud` beside this repository and uploads the build to `/srv/searsuite`. Configure the GitHub repository's `production` environment and the `SERVER_HOST`, `SERVER_PORT`, `SERVER_USER`, `SERVER_SSH_KEY`, and `SSH_KNOWN_HOSTS` secrets, then set `WEBSITE_DEPLOY_ENABLED` to `true` to enable deployment. If a source repository is private, `SOURCE_REPO_TOKEN` must grant read access to it; public repositories can use the default GitHub token.

## Repository

Repository: [searsuite-website](https://github.com/SearSuite/searsuite-website).

## Community and releases

See [Contributing](CONTRIBUTING.md), the [Code of Conduct](CODE_OF_CONDUCT.md), [Support and maintainers](SUPPORT.md), the [Changelog](CHANGELOG.md), and [Versioning and compatibility](VERSIONING.md).
