import { realpathSync, statSync } from 'node:fs'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'

function siteOrigin(value) {
  let url
  try { url = new URL(value) } catch { throw new Error('SITE_URL must be an absolute HTTPS origin.') }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || /[?#\s<>"']/.test(value)) {
    throw new Error('SITE_URL must use HTTPS with no path, credentials, query, or fragment.')
  }
  return `${url.origin}/`
}

function publicImage(root, imagePath) {
  if (!imagePath.startsWith('/') || imagePath.startsWith('//') || /[\\?#<>"']/.test(imagePath)) {
    throw new Error('SOCIAL_IMAGE_PATH must be a root-relative public image path.')
  }
  let decoded
  try { decoded = decodeURIComponent(imagePath) } catch { throw new Error('SOCIAL_IMAGE_PATH contains invalid URL encoding.') }
  if (decoded.startsWith('//') || decoded.split('/').includes('..') || /[\\?#<>"']/.test(decoded)) {
    throw new Error('SOCIAL_IMAGE_PATH must stay inside public/.')
  }
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(extname(decoded).toLowerCase())) {
    throw new Error('SOCIAL_IMAGE_PATH must reference a PNG, JPEG, or WebP image.')
  }
  const publicRoot = realpathSync(resolve(root, 'public'))
  let file
  try { file = realpathSync(resolve(publicRoot, `.${decoded}`)) } catch {
    throw new Error('SOCIAL_IMAGE_PATH does not identify an existing public image.')
  }
  const pathFromPublic = relative(publicRoot, file)
  if (isAbsolute(pathFromPublic) || pathFromPublic === '..' || pathFromPublic.startsWith(`..${sep}`) || !statSync(file).isFile()) {
    throw new Error('SOCIAL_IMAGE_PATH must identify a file inside public/.')
  }
  // Normalize URL encoding once, after checking decoded filesystem containment.
  return decoded.split('/').map(encodeURIComponent).join('/')
}

export function metadataTags({ root, siteUrl = '', imagePath = '', production = false, preview = false }) {
  siteUrl = siteUrl.trim()
  imagePath = imagePath.trim()
  if (production && (!siteUrl || !imagePath)) {
    throw new Error('Production release requires SITE_URL and SOCIAL_IMAGE_PATH. Supply the approved domain and an existing approved public image.')
  }
  if (imagePath && !siteUrl) throw new Error('Set SITE_URL before SOCIAL_IMAGE_PATH so image metadata can use an absolute URL.')
  const canonical = siteUrl ? siteOrigin(siteUrl) : null
  const image = imagePath ? new URL(publicImage(root, imagePath), canonical).href : null
  const meta = (key, value, property = false) => ({ tag: 'meta', attrs: { [property ? 'property' : 'name']: key, content: value }, injectTo: 'head' })
  const tags = [meta('twitter:card', image ? 'summary_large_image' : 'summary')]
  if (canonical) {
    tags.push({ tag: 'link', attrs: { rel: 'canonical', href: canonical }, injectTo: 'head' })
    tags.push(meta('og:url', canonical, true), meta('twitter:url', canonical))
  }
  if (image) {
    tags.push(meta('og:image', image, true), meta('og:image:alt', 'Developer portfolio preview', true))
    tags.push(meta('twitter:image', image), meta('twitter:image:alt', 'Developer portfolio preview'))
  }
  if (preview || !canonical) tags.push(meta('robots', 'noindex, nofollow'))
  return tags
}

export function portfolioMetadata(options) {
  const tags = metadataTags(options)
  return {
    name: 'portfolio-metadata',
    configResolved(config) {
      if (config.command === 'build' && !options.siteUrl?.trim()) {
        config.logger.warn('SITE_URL is unset: this local build is noindex and omits canonical/social URLs. Configure release metadata before publishing.')
      } else if (config.command === 'build' && !options.imagePath?.trim()) {
        config.logger.warn('SOCIAL_IMAGE_PATH is unset: image metadata is omitted. An approved image is required for a Vercel production release.')
      }
    },
    transformIndexHtml() { return tags },
  }
}
