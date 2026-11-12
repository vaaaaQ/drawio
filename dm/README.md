# vaaaaQ/drawio, branch `dm`

A fork of [jgraph/drawio](https://github.com/jgraph/drawio) (Apache-2.0) for the visual designer of
[vaaaaQ/ws-design-module](https://github.com/vaaaaQ/ws-design-module) (job DM-0002, `drawio-poc.md`). The designer
serves this webapp from its own container under `/drawio/` and embeds it (embed mode); the browser calls no
diagrams.net, draw.io or jgraph service. Upstream does not take pull requests; this fork only pulls.

## Branches and tags

- `dev`: upstream's branch, untouched.
- `dm`: an upstream release tag plus the changes below. A release tag `dm-v<upstream>-<n>` carries
  `drawio-webapp-<tag>.tar.gz` (the `src/main/webapp` tree as `webapp/`) and its SHA-256; the designer pins it in
  `designer/config/drawio.json`.
- `sync/v<new>`: opened weekly by `dm-sync.yml` (once it is in `.github/workflows/`) when upstream has a newer release: the new tag merged into `dm`, CI run,
  a pull request into `dm`. Merged by a person, never automatically.

## What this fork changes (and nothing else)

| File | Change |
|---|---|
| `src/main/webapp/js/PreConfig.js` | `DRAWIO_BASE_URL`, `DRAWIO_VIEWER_URL`, `DRAWIO_LIGHTBOX_URL` point at the serving origin (were app/viewer.diagrams.net); `GENERATE_URL` and `RT_WEBSOCKET_URL` at unused paths of it (were www.draw.io, app.diagrams.net); `DRAWIO_CONFIG = {enableAi: false}` |
| `src/main/webapp/js/PostConfig.js` | `DRAWIO_LOG_URL = null`; loads `dm/bridge.js` |
| `src/main/webapp/dm/bridge.js` | the bridge to the designer: selection events and actions, highlight, fit, label editing state, push-to-talk key (a `dm-` message protocol beside the embed protocol) |
| `dm/check-hosts.mjs` | fails when a service URL global points at a diagrams.net / draw.io / jgraph host |
| `dm/workflows/dm-*.yml` | CI, release, weekly upstream sync; kept here until the token that pushes this branch may write workflows, then moved to `.github/workflows/` |

All icon and stencil libraries stay (their licence, `src/main/webapp/stencils/LICENSE`, only restricts use inside
Atlassian products). Cloud storages are switched off by the designer's URL parameters, not by code changes.

Changes are © their authors under Apache-2.0, like draw.io itself.
