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
const { sectors, SECTOR_IDS } = ssr.sectorData

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const LANDING = [['/', 'en'], ['/it', 'it'], ['/ro', 'ro']]
// 'en' = text depends on the visitor's language, so the browser redraws it when theirs differs; 'any' = same for everyone
const OTHER = Object.entries(STATIC_PAGES).map(([path, m]) => [path, m, /^\/contact$/.test(path) ? 'en' : 'any'])

function replaceOnce(html, re, to, what) {
  if (!re.test(html)) throw new Error(`prerender: cannot find ${what} in dist/index.html`)
  return html.replace(re, () => to)
}

// alternates: [[hreflang, path], ...] for pages that exist in several languages
function head(html, { path, lang, title, description, keywords, alternates = [] }) {
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
  // language alternates exist only for pages that have a version per language (landing, sector pages)
  html = html.replace(/(\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>)+/, () =>
    alternates.length
      ? '\n    ' + alternates.map(([h, p]) => `<link rel="alternate" hreflang="${h}" href="${SITE_URL}${p}" />`).join('\n    ')
      : '')
  // the page now carries its own HTML, so the generic English no-JS fallback is dropped
  html = html.replace(/\s*<noscript>[\s\S]*?<\/noscript>/, '')
  return html
}

function structuredData(html, { landing, lang, faq }) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  for (const [whole, body] of blocks) {
    const type = JSON.parse(body)['@type']
    if (type === 'FAQPage') {
      if (!landing && !faq) html = html.replace(whole, () => '')
      else {
        const data = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: (faq ?? ssr.faqEntries(lang)).map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
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
  let html = head(template, { path, lang, title: m.title, description: m.description, keywords: m.keywords, alternates: [['en', '/'], ['it', '/it'], ['ro', '/ro'], ['x-default', '/']] })
  html = structuredData(html, { landing: true, lang })
  const body = ssr.render(path, lang)
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root" data-lang="${lang}">${body}</div>`, '#root')
  write(path, html)
  written.push([path, body.length])
}
for (const [path, m, dataLang] of OTHER) {
  let html = head(template, { path, lang: 'en', title: m.title, description: m.description, keywords: null })
  html = structuredData(html, { landing: false, lang: 'en' })
  const body = ssr.render(path, 'en')
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root" data-lang="${dataLang}">${body}</div>`, '#root')
  write(path, html)
  written.push([path, body.length])
}
// one page per business type and language; each lists the other languages of the same page as alternates
for (const id of SECTOR_IDS) {
  const alternates = [['en', sectors[id].en.path], ['it', sectors[id].it.path], ['ro', sectors[id].ro.path], ['x-default', sectors[id].en.path]]
  for (const lang of ['en', 'it', 'ro']) {
    const c = sectors[id][lang]
    let html = head(template, { path: c.path, lang, title: c.title, description: c.description, keywords: c.keywords, alternates })
    html = structuredData(html, { landing: false, lang, faq: c.faq })
    const body = ssr.render(c.path, lang)
    html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root" data-lang="${lang}">${body}</div>`, '#root')
    write(c.path, html)
    written.push([c.path, body.length])
  }
}

// sitemap.xml is written from the same tables, so it can never list a page that is not generated (or miss one that is)
const today = new Date().toISOString().slice(0, 10)
const alt = (list) => list.map(([h, p]) => `    <xhtml:link rel="alternate" hreflang="${h}" href="${SITE_URL}${p}"/>`).join('\n')
const entry = (path, freq, prio, alternates = []) =>
  `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>${alternates.length ? '\n' + alt(alternates) : ''}\n  </url>`
const landingAlt = [['en', '/'], ['it', '/it'], ['ro', '/ro'], ['x-default', '/']]
const urls = [
  ...LANDING.map(([p], i) => entry(p, 'weekly', i === 0 ? '1.0' : '0.9', landingAlt)),
  ...SECTOR_IDS.flatMap((id) => {
    const a = [['en', sectors[id].en.path], ['it', sectors[id].it.path], ['ro', sectors[id].ro.path], ['x-default', sectors[id].en.path]]
    return ['en', 'it', 'ro'].map((l) => entry(sectors[id][l].path, 'monthly', '0.8', a))
  }),
  ...OTHER.map(([p]) => entry(p, /^\/contact$/.test(p) ? 'monthly' : 'yearly', p === '/contact' ? '0.6' : '0.3')),
]
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`)
rmSync(join(root, 'dist-ssr'), { recursive: true, force: true })
for (const [p, n] of written) console.log(`prerendered ${p.padEnd(42)} ${String(n).padStart(7)} chars`)
