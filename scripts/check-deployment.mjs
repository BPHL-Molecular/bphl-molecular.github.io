import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
const base = process.env.PAGES_BASE_PATH || '/'
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
}
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    if (!pathname.startsWith(base)) throw new Error('Outside site')
    let path = resolve(root, pathname.slice(base.length))
    if (path !== resolve(root) && !path.startsWith(resolve(root) + sep))
      throw new Error('Outside output')
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html')
    response.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream')
    response.end(await readFile(path))
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
})
await new Promise((ready) => server.listen(0, '127.0.0.1', ready))
let browser
try {
  const origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({
    channel:
      process.env.BROWSER_CHANNEL === 'chromium'
        ? undefined
        : process.env.BROWSER_CHANNEL || 'chrome',
    headless: true,
  })
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  const failures = []
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) failures.push(response.url())
  })
  await page.route('https://api.github.com/**', (route) => route.fulfill({ json: [] }))
  for (const route of ['', 'team/', 'training/', 'pipelines/']) {
    assert.equal(
      (await page.goto(origin + base + route, { waitUntil: 'networkidle' })).status(),
      200,
    )
    assert.equal(await page.locator('h1').count(), 1)
    assert.doesNotMatch(await page.title(), /Page not found/)
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.locator('h1').count(), 1)
  }
  await page.goto(origin + base + 'team/', { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.team-card').count(), 10)
  await page.getByRole('button', { name: /Return to the homepage team section/ }).click()
  await page.waitForURL(origin + base + '#team')
  assert.deepEqual(failures, [])
  console.log(
    `Static deployment checks passed at ${base}: routes, reloads, assets, and homepage return.`,
  )
} finally {
  await browser?.close()
  await new Promise((done) => server.close(done))
}
