// dm (vaaaaQ/drawio): runs js/PreConfig.js and js/PostConfig.js as the browser would, on a non-draw.io origin, and
// fails when a service URL global still points at a diagrams.net, draw.io or jgraph host (drawio-poc.md §3.2).
// Usage: node dm/check-hosts.mjs [webapp dir]
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import vm from 'node:vm'

const dir = process.argv[2] ?? join(import.meta.dirname, '..', 'src', 'main', 'webapp')
const FORBIDDEN = /(^|\.)(diagrams\.net|draw\.io|jgraph\.com|drawio\.com)$/i
const GLOBALS = ['DRAWIO_BASE_URL', 'DRAWIO_VIEWER_URL', 'DRAWIO_LIGHTBOX_URL', 'EXPORT_URL', 'GENERATE_URL', 'RT_WEBSOCKET_URL', 'DRAWIO_LOG_URL', 'ICONSEARCH_PATH', 'ICON_SERVICE_PATH']
const window = { location: { origin: 'http://127.0.0.1:5178', protocol: 'http:', host: '127.0.0.1:5178', hostname: '127.0.0.1', pathname: '/drawio/index.html' } }
const scripts = []
const document = { createElement: () => ({}), getElementsByTagName: () => [{ appendChild: (s) => scripts.push(s.src) }] }
const ctx = vm.createContext({ window, document, urlParams: {} })
for (const f of ['js/PreConfig.js', 'js/PostConfig.js']) {
  vm.runInContext(readFileSync(join(dir, f), 'utf8'), ctx, { filename: f })
}
let bad = 0
for (const g of GLOBALS) {
  const v = window[g]
  let host = ''
  try { host = v ? new URL(v, window.location.origin).hostname : '' } catch { host = '' }
  const ok = !host || !FORBIDDEN.test(host)
  if (!ok) bad++
  console.log(`${ok ? 'ok ' : 'BAD'} ${g} = ${v === undefined ? '(unset: Init.js default applies)' : JSON.stringify(v)}`)
}
for (const g of ['DRAWIO_BASE_URL', 'DRAWIO_LIGHTBOX_URL', 'GENERATE_URL']) if (window[g] === undefined) { console.log(`BAD ${g} is unset: Init.js would default it to a diagrams.net / draw.io host`); bad++ }
if (window.DRAWIO_CONFIG?.enableAi !== false) { console.log('BAD DRAWIO_CONFIG.enableAi is not false'); bad++ }
if (!scripts.includes('dm/bridge.js')) { console.log('BAD PostConfig.js does not load dm/bridge.js'); bad++ }
console.log(bad ? `${bad} problem(s)` : 'no diagrams.net / draw.io / jgraph service URL')
process.exit(bad ? 1 : 0)
