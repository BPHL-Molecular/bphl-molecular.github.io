import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
const browser = await chromium.launch({
  channel:
    process.env.BROWSER_CHANNEL === 'chromium'
      ? undefined
      : process.env.BROWSER_CHANNEL || 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const files = [
  {
    name: '20250901_Session53_Sequence_Analysis.pdf',
    type: 'file',
    sha: 'same-sha',
    html_url: 'https://github.com/StaPH-B/southeast-region/blob/master/53.pdf',
  },
  {
    name: '20250804_Session52_SeqSender.pptx',
    type: 'file',
    sha: 'same-sha',
    html_url: 'https://github.com/StaPH-B/southeast-region/blob/master/52.pptx',
  },
  {
    name: 'README.md',
    type: 'file',
    sha: 'readme',
    html_url: 'https://github.com/StaPH-B/southeast-region/blob/master/README.md',
  },
]
const apiPattern = 'https://api.github.com/repos/StaPH-B/southeast-region/contents/**'
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route(apiPattern, (route) => route.fulfill({ json: files }))
  await page.addInitScript(() =>
    sessionStorage.setItem('bphl-training-sessions-v2', '{"savedAt":9999999999999,"data":{}}'),
  )
  await page.goto(baseURL + '/training', { waitUntil: 'networkidle' })
  await page.locator('.training-row').first().waitFor()
  assert.equal(await page.locator('.training-row').count(), 2)
  assert.match(await page.title(), /Training/)
  await page.getByRole('searchbox').fill('seqsender')
  assert.equal(await page.locator('.training-row').count(), 1)
  assert.match(await page.locator('.training-row').innerText(), /Session 52/)
  await page.getByRole('searchbox').fill('nothing-matches')
  assert.equal(await page.locator('.training-row').count(), 0)
  assert.ok(await page.getByText(/No sessions match/).isVisible())
  await page.getByRole('searchbox').clear()
  assert.deepEqual(
    (
      await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    ).violations.map((v) => v.id),
    [],
  )
  fs.mkdirSync('artifacts', { recursive: true })
  await page.screenshot({ path: 'artifacts/training-review.png' })
  await page.getByRole('link', { name: /Back to homepage training/ }).click()
  await page.waitForFunction(
    () => Math.abs(document.getElementById('training')?.getBoundingClientRect().top - 105) < 5,
  )
  await page.goto(baseURL + '/team', { waitUntil: 'networkidle' })
  assert.equal(await page.locator('h1').count(), 1)
  assert.equal(await page.locator('.team-member').count(), 10)
  assert.match(await page.locator('.portrait-label').last().innerText(), /\/ 10$/)
  const firstTeamCard = page.locator('.team-card').first()
  assert.equal(await firstTeamCard.getAttribute('aria-pressed'), 'false')
  await firstTeamCard.click()
  assert.equal(await firstTeamCard.getAttribute('aria-pressed'), 'true')
  assert.equal(await firstTeamCard.locator('.team-card-back').getAttribute('aria-hidden'), 'false')
  await firstTeamCard.press('Enter')
  assert.equal(await firstTeamCard.getAttribute('aria-pressed'), 'false')
  assert.deepEqual(
    (
      await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    ).violations.map((v) => v.id),
    [],
  )
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  assert.match(
    await page.locator('#team-title').innerText(),
    /Shared knowledge\.\s*New possibilities\./,
  )
  assert.equal((await page.locator('.team-face-count').innerText()).trim(), '+7')
  await page.locator('.training-preview .training-row').first().waitFor()
  assert.equal(await page.locator('.training-preview .training-row').count(), 2)
  await page.getByRole('link', { name: 'View all training materials' }).click()
  await page.waitForURL(/\/training$/)
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.locator('#team').scrollIntoViewIfNeeded()
  const teamScrollPosition = await page.evaluate(() => window.scrollY)
  await page.getByRole('link', { name: 'Meet the team', exact: false }).click()
  await page.waitForURL(/\/team$/)
  await page.getByRole('button', { name: /Return to the homepage team section/ }).click()
  await page.waitForFunction(
    (expected) => Math.abs(window.scrollY - expected) < 5,
    teamScrollPosition,
  )
  await page
    .getByRole('navigation', { name: 'Footer navigation' })
    .getByRole('link', { name: 'Privacy', exact: true })
    .click()
  await page.waitForFunction(() => document.getElementById('privacy')?.open)
  assert.match(page.url(), /\/#privacy$/)
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Privacy')
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Training', exact: true })
    .click()
  await page.waitForFunction(
    () =>
      Math.abs(document.getElementById('training')?.getBoundingClientRect().top - 105) < 5 &&
      document.activeElement?.id === 'training-preview-title',
  )
  await page.goto(baseURL + '/missing-page', { waitUntil: 'networkidle' })
  assert.ok(await page.getByRole('heading', { level: 1, name: 'Page not found.' }).isVisible())
  await page.getByRole('link', { name: 'Back to home' }).click()
  await page.locator('#hero').waitFor()
  await page.route('https://api.github.com/orgs/BPHL-Molecular/repos?*', (route) =>
    route.fulfill({
      json: [
        {
          id: 1,
          name: 'Daytona',
          owner: { login: 'BPHL-Molecular' },
          description: 'Viral sequencing',
          language: 'Nextflow',
          topics: ['genomics'],
          updated_at: '2026-09-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Sanibel',
          owner: { login: 'BPHL-Molecular' },
          description: 'Bacterial analysis',
          language: 'Python',
          topics: ['bacteria'],
          updated_at: '2026-09-20T00:00:00Z',
        },
      ],
    }),
  )
  await page.goto(baseURL + '/pipelines', { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.pipeline-directory-row').count(), 2)
  assert.equal(await page.locator('.pipeline-directory-row h2').first().innerText(), 'Sanibel')
  assert.ok(
    await page
      .locator('.pipeline-directory-row h2')
      .first()
      .evaluate((heading) => parseFloat(getComputedStyle(heading).fontSize) <= 25),
  )
  await page.getByRole('searchbox').fill('genomics')
  assert.equal(await page.locator('.pipeline-directory-row').count(), 1)
  assert.equal(await page.locator('.pipeline-directory-row h2').innerText(), 'Daytona')
  await page.getByRole('link', { name: /Back to homepage pipelines/ }).click()
  await page.waitForFunction(
    () =>
      Math.abs(
        document.getElementById('bioinformatics-pipelines')?.getBoundingClientRect().top - 105,
      ) < 5,
  )
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(baseURL + '/team', { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.team-member').count(), 10)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  assert.equal(errors.length, 0)

  const blocked = await browser.newContext({ reducedMotion: 'reduce' })
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = function () {
      throw new Error('Storage unavailable')
    }
    Storage.prototype.setItem = function () {
      throw new Error('Storage quota exceeded')
    }
  })
  const blockedPage = await blocked.newPage()
  await blockedPage.route(apiPattern, (route) => route.fulfill({ json: files }))
  await blockedPage.goto(baseURL + '/training', { waitUntil: 'networkidle' })
  assert.equal(await blockedPage.locator('.training-row').count(), 2)
  assert.equal(await blockedPage.getByRole('alert').count(), 0)
  await blocked.close()

  const retryContext = await browser.newContext({ reducedMotion: 'reduce' })
  const retryPage = await retryContext.newPage()
  let fail = true
  await retryPage.route(apiPattern, (route) =>
    fail
      ? route.fulfill({ status: 403, json: { message: 'Rate limited' } })
      : route.fulfill({ json: files }),
  )
  await retryPage.goto(baseURL + '/training', { waitUntil: 'networkidle' })
  assert.ok(await retryPage.getByRole('alert').isVisible())
  fail = false
  await retryPage.getByRole('button', { name: 'Try again' }).click()
  await retryPage.locator('.training-row').first().waitFor()
  assert.equal(await retryPage.locator('.training-row').count(), 2)
  assert.equal(await retryPage.getByRole('alert').count(), 0)
  await retryPage.setViewportSize({ width: 375, height: 812 })
  assert.equal(
    await retryPage.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  )
  await retryContext.close()
  console.log(
    'Page checks passed: routes, focus, training search, invalid/blocked cache, retry, accessibility, and mobile layout.',
  )
} finally {
  await browser.close()
}
