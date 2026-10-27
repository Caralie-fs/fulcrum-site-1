import { test, expect } from '@playwright/test'
import { readdirSync, existsSync } from 'fs'
import { join, relative, sep } from 'path'

const ROOT = join(__dirname, '..')
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'public', 'src', 'tests', 'test-results', 'playwright-report', 'screenshots'])

// Every index.html in the source tree is a page, e.g. 'grants/translation/'
const findPages = (dir = ROOT) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || IGNORED_DIRS.has(entry.name)) return []
      return findPages(join(dir, entry.name))
    }
    if (entry.name !== 'index.html') return []
    const rel = relative(ROOT, dir).split(sep).join('/')
    return [rel ? `${rel}/` : '']
  })

const pages = findPages().sort()

// Pages must be listed in rollupOptions.input in vite.config.js or they are silently left out of the build
test('every page is included in the build', () => {
  const missing = pages.filter((page) => !existsSync(join(ROOT, 'dist', page, 'index.html')))
  expect(missing, 'pages missing from dist/ (add them to vite.config.js)').toEqual([])
})

for (const page of pages) {
  const path = `/${page}`

  test(`${path} loads cleanly`, async ({ page: browserPage, baseURL }, testInfo) => {
    const problems = []
    const isLocal = (url) => url.startsWith(baseURL)

    browserPage.on('pageerror', (error) => problems.push(`uncaught error: ${error.message}`))
    browserPage.on('console', (msg) => {
      if (msg.type() === 'error' && isLocal(msg.location().url)) {
        problems.push(`console error: ${msg.text()}`)
      }
    })
    browserPage.on('response', (response) => {
      if (isLocal(response.url()) && response.status() >= 400) {
        problems.push(`${response.status()} ${response.url()}`)
      }
    })
    browserPage.on('requestfailed', (request) => {
      if (isLocal(request.url())) problems.push(`request failed: ${request.url()}`)
    })

    const response = await browserPage.goto(path, { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
    await expect(browserPage.locator('body')).not.toBeEmpty()

    // Internal links should point at pages that exist
    const hrefs = await browserPage.locator('a[href^="/"]').evaluateAll((links) =>
      links.map((a) => a.getAttribute('href'))
    )
    for (const href of new Set(hrefs)) {
      const target = href.split('#')[0].split('?')[0]
      const linkResponse = await browserPage.request.get(target)
      if (!linkResponse.ok()) problems.push(`broken link ${href} (${linkResponse.status()})`)
    }

    // Scroll through the page so scroll-triggered animations reveal their content
    // (instant, because the site sets scroll-behavior: smooth)
    await browserPage.evaluate(async () => {
      const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
        window.scrollTo({ top: y, behavior: 'instant' })
        await pause(150)
      }
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
      await pause(1000)
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await browserPage.waitForTimeout(500)

    const name = page ? page.slice(0, -1).replaceAll('/', '-') : 'home'
    await browserPage.screenshot({
      path: `screenshots/${testInfo.project.name}/${name}.png`,
      fullPage: true,
      animations: 'disabled',
    })

    expect(problems).toEqual([])
  })
}
