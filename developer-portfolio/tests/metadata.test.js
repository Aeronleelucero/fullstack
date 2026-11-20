import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { copyFileSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { metadataTags, portfolioMetadata } from '../scripts/metadata.js'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const root = mkdtempSync(join(tmpdir(), 'portfolio-metadata-test-'))
mkdirSync(join(root, 'public', 'images'), { recursive: true })
// Reuse a real image solely as a filesystem fixture. It is not selected as release artwork.
copyFileSync(join(projectRoot, 'public/images/projects/aqua-poster.webp'), join(root, 'public/images/preview image.webp'))
after(() => rmSync(root, { recursive: true, force: true }))
// Reserved example domain used only in tests, never a selected production domain.
const siteUrl = 'https://portfolio.example/'
const imagePath = '/images/preview image.webp'
const content = (tags, key) => tags.find(tag => tag.attrs.name === key || tag.attrs.property === key)?.attrs.content

test('unconfigured local build omits URLs and images and disallows indexing', () => {
  const tags = metadataTags({ root })
  assert.equal(tags.some(tag => tag.attrs.rel === 'canonical'), false)
  assert.equal(content(tags, 'og:url'), undefined)
  assert.equal(content(tags, 'og:image'), undefined)
  assert.equal(content(tags, 'twitter:card'), 'summary')
  assert.equal(content(tags, 'robots'), 'noindex, nofollow')
})

test('one normalized origin supplies canonical and social URLs', () => {
  const tags = metadataTags({ root, siteUrl: 'https://PORTFOLIO.example' })
  assert.equal(tags.find(tag => tag.attrs.rel === 'canonical').attrs.href, siteUrl)
  assert.equal(content(tags, 'og:url'), siteUrl)
  assert.equal(content(tags, 'twitter:url'), siteUrl)
  assert.equal(content(tags, 'robots'), undefined)
})

test('configured real local image gets absolute, encoded URLs and accessible descriptions', () => {
  const tags = metadataTags({ root, siteUrl, imagePath, production: true })
  assert.equal(content(tags, 'og:image'), `${siteUrl}images/preview%20image.webp`)
  assert.equal(content(tags, 'twitter:image'), content(tags, 'og:image'))
  assert.equal(content(tags, 'twitter:card'), 'summary_large_image')
  assert.ok(content(tags, 'og:image:alt'))
  assert.ok(content(tags, 'twitter:image:alt'))
})

test('already encoded image paths are not double encoded', () => {
  const tags = metadataTags({ root, siteUrl, imagePath: '/images/preview%20image.webp' })
  assert.equal(content(tags, 'og:image'), `${siteUrl}images/preview%20image.webp`)
})

test('preview deployment remains noindex even with complete release metadata', () => {
  assert.equal(content(metadataTags({ root, siteUrl, imagePath, preview: true }), 'robots'), 'noindex, nofollow')
})

test('production fails closed when either release input is missing', () => {
  for (const options of [{}, { siteUrl }, { imagePath }]) {
    assert.throws(() => metadataTags({ root, ...options, production: true }), /Production release requires/)
  }
})

test('an image cannot be configured without an absolute site URL', () => {
  assert.throws(() => metadataTags({ root, imagePath }), /Set SITE_URL/)
})

test('reject malformed, insecure, credentialed, query, fragment, and subpath site URLs', () => {
  for (const value of ['not-a-url', '//portfolio.example', 'http://portfolio.example', 'javascript:alert(1)', 'https://user:password@portfolio.example', `${siteUrl}path`, `${siteUrl}?tracking=1`, `${siteUrl}#home`, 'https://portfolio.\nexample']) {
    assert.throws(() => metadataTags({ root, siteUrl: value }), /SITE_URL/)
  }
})

test('reject missing images, unsupported formats, URL fragments, and encoded path traversal', () => {
  for (const value of ['https://elsewhere.example/a.webp', '//elsewhere.example/a.webp', '/images/missing.webp', '/favicon.svg', '/images/a.webp?x=1', '/images/a.webp#x', '/images/../a.webp', '/images/%2e%2e/a.webp', '/%2Felsewhere.example/a.webp', '/images/a%5Cb.webp', '/images/%ZZ.webp']) {
    assert.throws(() => metadataTags({ root, siteUrl, imagePath: value }), /SOCIAL_IMAGE_PATH/)
  }
})

test('directories and symlinks escaping the public root cannot be social images', () => {
  mkdirSync(join(root, 'public/images/directory.webp'))
  writeFileSync(join(root, 'outside.webp'), 'outside fixture')
  symlinkSync(join(root, 'outside.webp'), join(root, 'public/images/escape.webp'))
  for (const value of ['/images/directory.webp', '/images/escape.webp']) {
    assert.throws(() => metadataTags({ root, siteUrl, imagePath: value }), /SOCIAL_IMAGE_PATH/)
  }
})

test('Vite emits canonical and social tags into HTML without unresolved placeholders', async () => {
  writeFileSync(join(root, 'index.html'), '<!doctype html><html lang="en"><head><title>Metadata fixture</title></head><body>Fixture</body></html>')
  const result = await build({
    configFile: false, root, logLevel: 'silent',
    plugins: [portfolioMetadata({ root, siteUrl, imagePath, production: true })],
    build: { write: false },
  })
  const html = result.output.find(file => file.fileName === 'index.html').source
  assert.match(html, /rel="canonical" href="https:\/\/portfolio\.example\/"/)
  assert.match(html, /property="og:image" content="https:\/\/portfolio\.example\/images\/preview%20image\.webp"/)
  assert.match(html, /name="twitter:card" content="summary_large_image"/)
  assert.doesNotMatch(html, /%SITE_URL%|%SOCIAL_IMAGE_PATH%|noindex/)
})
