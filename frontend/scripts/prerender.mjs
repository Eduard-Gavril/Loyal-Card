// Runs after `vite build` and `vite build --ssr`: writes one static HTML file per public page,
// with the page already drawn inside #root and its own title, description, canonical and hreflang.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssr = await import(pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href)

// The same tables the pages use at runtime (src/lib/seo.ts), taken from the SSR bundle so there is one copy.
const { SITE_URL, LANDING_META, OG_LOCALE, STATIC_PAGES } = ssr.seo

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const LANDING = [['/', 'en'], ['/it', 'it'], ['/ro', 'ro']]
// 'en' = text depends on the visitor's language, so the browser redraws it when theirs differs; 'any' = same for everyone
const OTHER = Object.entries(STATIC_PAGES).map(([path, m]) => [path, m, /^\/(pricing|contact)$/.test(path) ? 'en' : 'any'])

function replaceOnce(html, re, to, what) {
  if (!re.test(html)) throw new Error(`prerender: cannot find ${what} in dist/index.html`)
  return html.replace(re, () => to)
}

function head(html, { path, lang, title, description, keywords, landing }) {
  const url = SITE_URL + path
  html = replaceOnce(html, /<html lang="[^"]*"/, `<html lang="${lang}"`, '<html lang>')
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, '<title>')
  html = replaceOnce(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`, 'description')
  if (keywords) html = html.replace(/<meta name="keywords" content="[^"]*"\s*\/?>/, () => `<meta name="keywords" content="${esc(keywords)}" />`)
  else html = html.replace(/\s*<meta name="keywords" content="[^"]*"\s*\/?>/, '')
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`, 'canonical')
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`, 'og:url')
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(title)}" />`, 'og:title')
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(description)}" />`, 'og:description')
  html = replaceOnce(html, /<meta property="og:locale" content="[^"]*"\s*\/?>/, `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`, 'og:locale')
  html = html.replace(/(<meta property="og:locale:alternate" content="[^"]*"\s*\/?>\s*)+/, () =>
    Object.keys(OG_LOCALE).filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}" />\n    `).join(''))
  html = replaceOnce(html, /<meta name="twitter:url" content="[^"]*"\s*\/?>/, `<meta name="twitter:url" content="${url}" />`, 'twitter:url')
  html = replaceOnce(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(title)}" />`, 'twitter:title')
  html = replaceOnce(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(description)}" />`, 'twitter:description')
  // language alternates exist only between the three landing addresses
  html = html.replace(/(\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>)+/, () =>
    landing
      ? '\n    ' + [['en', '/'], ['it', '/it'], ['ro', '/ro'], ['x-default', '/']].map(([h, p]) => `<link rel="alternate" hreflang="${h}" href="${SITE_URL}${p}" />`).join('\n    ')
      : '')
  // the page now carries its own HTML, so the generic English no-JS fallback is dropped
  html = html.replace(/\s*<noscript>[\s\S]*?<\/noscript>/, '')
  return html
}

function structuredData(html, { landing, lang }) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  for (const [whole, body] of blocks) {
    const type = JSON.parse(body)['@type']
    if (type === 'FAQPage') {
      if (!landing) html = html.replace(whole, () => '')
      else {
        const data = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: ssr.faqEntries(lang).map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        }
        html = html.replace(whole, () => `<script type="application/ld+json">\n    ${JSON.stringify(data)}\n    </script>`)
      }
    } else if (!landing && type !== 'Organization') {
      html = html.replace(whole, () => '')
    }
  }
  return html.replace(/\n\s*\n\s*\n/g, '\n\n')
}

function write(path, html) {
  const file = path === '/' ? join(dist, 'index.html') : join(dist, path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

const written = []
for (const [path, lang] of LANDING) {
  const m = LANDING_META[lang]
  let html = head(template, { path, lang, title: m.title, description: m.description, keywords: m.keywords, landing: true })
  html = structuredData(html, { landing: true, lang })
  const body = ssr.render(path, lang)
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root" data-lang="${lang}">${body}</div>`, '#root')
  write(path, html)
  written.push([path, body.length])
}
for (const [path, m, dataLang] of OTHER) {
  let html = head(template, { path, lang: 'en', title: m.title, description: m.description, keywords: null, landing: false })
  html = structuredData(html, { landing: false, lang: 'en' })
  const body = ssr.render(path, 'en')
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root" data-lang="${dataLang}">${body}</div>`, '#root')
  write(path, html)
  written.push([path, body.length])
}
rmSync(join(root, 'dist-ssr'), { recursive: true, force: true })
for (const [p, n] of written) console.log(`prerendered ${p.padEnd(16)} ${String(n).padStart(7)} chars`)
