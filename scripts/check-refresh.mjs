import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { parseSessions, TRAINING_CACHE_KEY } from '../src/lib/training.js'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
const training = (number) => ({
  name: `202609${number}_Session${number}_Refresh_Test.pdf`,
  type: 'file',
  sha: String(number),
  html_url: `https://github.com/StaPH-B/southeast-region/blob/master/${number}.pdf`,
})
const repository = (number) => ({
  id: number,
  name: `Refresh-Test-${number}`,
  owner: { login: 'BPHL-Molecular' },
  updated_at: '2026-09-29T00:00:00Z',
})
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL === 'chromium' ? undefined : 'chrome',
  headless: true,
})
try {
  for (const config of [
    {
      path: '/training',
      pattern: '**/repos/StaPH-B/southeast-region/contents/**',
      row: '.training-row',
      button: 'Refresh training materials',
      item: training,
    },
    {
      path: '/pipelines',
      pattern: '**/orgs/BPHL-Molecular/repos?*',
      row: '.pipeline-directory-row',
      button: 'Refresh pipelines and repositories',
      item: repository,
    },
  ]) {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    if (config.path === '/training') {
      await context.addInitScript(
        ({ key, data }) =>
          sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data })),
        { key: TRAINING_CACHE_KEY, data: parseSessions([training(10)]) },
      )
    }
    const page = await context.newPage()
    let requests = 0
    let fail = false
    let items = [config.item(10)]
    let release
    let gate = Promise.resolve()
    await page.route(config.pattern, async (route) => {
      requests++
      await gate
      await route.fulfill({ status: fail ? 503 : 200, json: fail ? {} : items })
    })
    await page.goto(baseURL + config.path, { waitUntil: 'networkidle' })
    assert.equal(await page.locator(config.row).count(), 1)
    if (config.path === '/training')
      assert.equal(requests, 0, 'Initial data uses the session cache')
    await page.getByRole('searchbox').fill('Refresh')
    const button = page.getByRole('button', { name: config.button, exact: true })
    const before = requests
    items = [config.item(11), config.item(10)]
    gate = new Promise((resolve) => {
      release = resolve
    })
    await button.click()
    assert.equal(await button.isDisabled(), true)
    assert.equal(await page.locator(config.row).count(), 1, 'Existing rows remain during refresh')
    release()
    await page.waitForFunction(
      (selector) => document.querySelectorAll(selector).length === 2,
      config.row,
    )
    assert.equal(requests, before + 1)
    assert.equal(await page.getByRole('searchbox').inputValue(), 'Refresh')
    assert.equal(page.url(), baseURL + config.path)
    fail = true
    await button.click()
    await page.getByRole('alert').waitFor()
    assert.equal(
      await page.locator(config.row).count(),
      2,
      'Failed refresh retains the last successful list',
    )
    assert.equal(await button.isEnabled(), true)
    fail = false
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await page.waitForFunction(() => !document.querySelector('.sync-refresh-button').disabled)
    assert.equal(await page.getByRole('alert').count(), 0)
    await page.setViewportSize({ width: 375, height: 812 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await context.close()
  }
  console.log(
    'Refresh checks passed: cached data bypass, updated rows, loading, preserved search, failure recovery, and mobile layout for both listings.',
  )
} finally {
  await browser.close()
}
