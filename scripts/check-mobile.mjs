import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL === 'chromium' ? undefined : 'chrome',
  headless: true,
})
await fs.mkdir('artifacts/mobile-tablet', { recursive: true })
const result = {
  environment: 'Desktop Chrome viewport emulation; not physical phone/tablet measurements',
  viewports: [],
  destinations: [],
  console: [],
}
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    recordVideo: { dir: 'artifacts/mobile-tablet/video', size: { width: 390, height: 844 } },
  })
  await context.route('https://api.github.com/**', (route) => route.fulfill({ json: [] }))
  const page = await context.newPage()
  page.on('pageerror', (error) => {
    throw error
  })
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) result.console.push(message.text())
  })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.locator('canvas').waitFor()
  await page.waitForFunction(
    () => document.querySelector('canvas')?.dataset.morphStage !== undefined,
  )
  const viewports = [
    [320, 740],
    [360, 800],
    [390, 844],
    [393, 852],
    [402, 874],
    [430, 932],
    [744, 1000],
    [768, 1024],
    [834, 1112],
    [1024, 768],
    [740, 360],
    [1100, 500],
    [1440, 900],
  ]
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height })
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(150)
    const layout = await page.evaluate(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON()
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        visual: rect('.scene-shell'),
        copy: rect('#hero .story-copy'),
        chips: [...document.querySelectorAll('.hero-chips a')].map((el) => ({
          height: el.getBoundingClientRect().height,
          label: el.textContent.trim(),
        })),
      }
    })
    assert.equal(layout.overflow, false, `No overflow at ${width}×${height}`)
    if (width <= 1100) {
      if (width < 800)
        assert.ok(layout.copy.top >= layout.visual.bottom, 'Phone copy starts below visual')
      else assert.ok(layout.copy.right < layout.visual.left, 'Tablet copy has a separate column')
      assert.ok(layout.chips.every((chip) => chip.height >= 44))
      await page.getByRole('button', { name: 'Menu' }).click()
      const dialog = page.getByRole('dialog', { name: 'Site menu' })
      assert.equal(await dialog.isVisible(), true)
      const bounds = await dialog.boundingBox()
      assert.ok(Math.abs(bounds.height - height) < 2)
      assert.deepEqual(
        (await dialog.locator('nav a').allTextContents()).map((text) => text.trim()),
        ['About', 'Training', 'Team', 'Contact', 'Explore Research'],
      )
      await page.keyboard.press('Escape')
      assert.equal(
        await page
          .getByRole('button', { name: 'Menu' })
          .evaluate((el) => el === document.activeElement),
        true,
      )
    }
    result.viewports.push({ width, height, ...layout })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'))
  await page.evaluate(() => window.scrollTo({ top: 550, behavior: 'instant' }))
  await page.waitForTimeout(200)
  const before = await page.evaluate(() => ({
    y: scrollY,
    stage: document.querySelector('canvas').dataset.morphStage,
    rotation: document.querySelector('canvas').dataset.rotationY,
  }))
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.waitForFunction(
    () => document.querySelector('canvas').dataset.rendering === 'suspended',
  )
  const frozen = await page.locator('canvas').getAttribute('data-rotation-y')
  await page.mouse.wheel(0, 500)
  await page.waitForTimeout(200)
  assert.equal(await page.locator('canvas').getAttribute('data-rotation-y'), frozen)
  assert.equal(await page.evaluate(() => document.body.style.top), `${-before.y}px`)
  const dialog = page.getByRole('dialog', { name: 'Site menu' })
  await dialog.locator('nav a').last().focus()
  await page.keyboard.press('Tab')
  assert.equal(
    await dialog.locator('.wordmark').evaluate((el) => el === document.activeElement),
    true,
  )
  await page.keyboard.press('Shift+Tab')
  assert.equal(
    await dialog
      .locator('nav a')
      .last()
      .evaluate((el) => el === document.activeElement),
    true,
  )
  assert.deepEqual(
    (
      await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    ).violations.map((v) => v.id),
    [],
  )
  await page.screenshot({ path: 'artifacts/mobile-tablet/phone-menu.png' })
  await page.keyboard.press('Escape')
  assert.equal(await page.evaluate(() => scrollY), before.y)
  await page.waitForFunction(() => document.querySelector('canvas').dataset.rendering === 'active')
  for (const [label, target] of [
    ['About', 'about'],
    ['Training', 'training'],
    ['Team', 'team'],
    ['Contact', 'contact'],
    ['Explore Research', 'research'],
  ]) {
    await page.getByRole('button', { name: 'Menu' }).click()
    await dialog.getByRole('link', { name: label, exact: label !== 'Explore Research' }).click()
    await page.waitForFunction(
      (id) =>
        Math.abs(
          document.getElementById(id).getBoundingClientRect().top -
            parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
        ) < 3,
      target,
    )
    assert.equal(await dialog.isVisible(), false)
    result.destinations.push(target)
  }
  // Exercise full shapes in both directions, including the hero's sphere → DNA transition.
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.waitForFunction(
    () => document.querySelector('canvas')?.dataset.pathogenReady === 'true',
  )
  for (const id of [
    'pathogens',
    'sequencing',
    'network',
    'florida',
    'network',
    'sequencing',
    'pathogens',
  ]) {
    await page.evaluate(
      (id) => document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' }),
      id,
    )
    const expected = { pathogens: 2, sequencing: 3, network: 4, florida: 5 }[id]
    await page.waitForFunction(
      (stage) =>
        Math.abs(Number(document.querySelector('canvas').dataset.morphStage) - stage) < 0.01,
      expected,
    )
    assert.equal(await page.locator('canvas').getAttribute('data-particles-visible'), 'true')
    await page.screenshot({ path: `artifacts/mobile-tablet/phone-${id}.png` })
  }
  await page.evaluate(() => {
    const hero = document.getElementById('hero'),
      next = document.getElementById('pathogens')
    const offset =
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) +
      parseFloat(getComputedStyle(hero).scrollMarginTop)
    const start = hero.getBoundingClientRect().top + scrollY
    const end = next.getBoundingClientRect().top + scrollY - offset
    window.scrollTo({ top: start + (end - start) * 0.45, behavior: 'instant' })
  })
  await page.waitForFunction(
    () => Math.abs(Number(document.querySelector('canvas').dataset.morphStage) - 1) < 0.02,
  )
  await page.screenshot({ path: 'artifacts/mobile-tablet/phone-dna.png' })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForFunction(
    () => Number(document.querySelector('canvas').dataset.morphStage) === 0,
  )
  await page.screenshot({ path: 'artifacts/mobile-tablet/phone-hero.png' })
  // Synthetic visibility event verifies the hidden-tab suspension path explicitly.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForFunction(
    () => document.querySelector('canvas').dataset.rendering === 'suspended',
  )
  await page.evaluate(() => {
    delete document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForFunction(() => document.querySelector('canvas').dataset.rendering === 'active')
  result.visibility = 'Synthetic hidden/visible events suspend and resume rendering'
  // Exercise actual context loss/restoration without discarding page content.
  const supportsLoss = await page.evaluate(() => {
    const extension = document
      .querySelector('canvas')
      .getContext('webgl2')
      .getExtension('WEBGL_lose_context')
    if (!extension) return false
    window.restoreTestContext = () => extension.restoreContext()
    extension.loseContext()
    return true
  })
  if (supportsLoss) {
    await page.waitForFunction(
      () => document.querySelector('canvas').dataset.rendering === 'suspended',
    )
    await page.locator('.scene-status-overlay').waitFor()
    assert.ok(await page.getByRole('heading', { level: 1 }).isVisible())
    await page.waitForTimeout(200)
    await page.evaluate(() => {
      window.restoreTestContext()
      delete window.restoreTestContext
    })
    await page.waitForFunction(
      () => document.querySelector('canvas').dataset.rendering === 'active',
    )
    await page.waitForFunction(() => !document.querySelector('.scene-status-overlay'))
  }
  result.contextRecovery = supportsLoss
    ? 'Context loss and restoration passed'
    : 'Extension unavailable'
  // Measured presentation intervals in this browser only; no hardware-specific FPS claim.
  result.performance = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const intervals = []
        let previous = performance.now(),
          start = previous
        function frame(now) {
          intervals.push(now - previous)
          previous = now
          if (now - start < 3000) requestAnimationFrame(frame)
          else {
            intervals.shift()
            intervals.sort((a, b) => a - b)
            resolve({
              samples: intervals.length,
              medianMs: intervals[Math.floor(intervals.length * 0.5)],
              p95Ms: intervals[Math.floor(intervals.length * 0.95)],
              quality: document.querySelector('canvas').dataset.quality,
              particles: document.querySelector('canvas').dataset.particleCount,
              rendering: document.querySelector('canvas').dataset.rendering,
            })
          }
        }
        requestAnimationFrame(frame)
      }),
  )
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click()
  await page.waitForFunction(
    () => document.querySelector('canvas').dataset.rendering === 'on-demand',
  )
  const paused = await page.locator('canvas').screenshot()
  await page.waitForTimeout(200)
  assert.ok(paused.equals(await page.locator('canvas').screenshot()), 'Paused canvas is stable')
  await page.setViewportSize({ width: 834, height: 1112 })
  await page.screenshot({ path: 'artifacts/mobile-tablet/tablet-hero.png' })
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.screenshot({ path: 'artifacts/mobile-tablet/tablet-menu.png' })
  await page.setViewportSize({ width: 1112, height: 834 })
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(await dialog.isVisible(), false, 'Rotation to desktop closes modal')
  assert.equal(await page.evaluate(() => document.body.style.position), '')
  // Text enlargement: double computed text sizes, preserving the viewport and content.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => {
    const entries = [
      ...document.querySelectorAll('h1,h2,h3,p,a,button,dt,dd,summary,.eyebrow'),
    ].map((el) => [el, parseFloat(getComputedStyle(el).fontSize)])
    for (const [el, size] of entries) el.style.fontSize = `${size * 2}px`
  })
  await page.getByRole('button', { name: 'Menu' }).click()
  await dialog.getByRole('link', { name: 'Explore Research' }).scrollIntoViewIfNeeded()
  assert.equal(
    await page.evaluate(() => document.querySelector('dialog').scrollWidth > innerWidth),
    false,
  )
  await page.screenshot({ path: 'artifacts/mobile-tablet/enlarged-menu.png' })
  await page.keyboard.press('Escape')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  assert.ok(!/codex|claude/i.test(await page.locator('body').innerText()))
  assert.doesNotMatch(
    await page.locator('body').innerText(),
    /[↗↙→←↓↑]/,
    'No platform-dependent arrow emoji',
  )
  assert.ok(result.console.every((message) => !/codex|claude/i.test(message)))
  await context.close()
  const recording = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: 'artifacts/mobile-tablet/scroll-video', size: { width: 390, height: 844 } },
  })
  await recording.route('https://api.github.com/**', (route) => route.fulfill({ json: [] }))
  const scrollPage = await recording.newPage()
  await scrollPage.goto(baseURL, { waitUntil: 'networkidle' })
  await scrollPage.waitForFunction(
    () => document.querySelector('canvas')?.dataset.pathogenReady === 'true',
  )
  await scrollPage.evaluate(
    () =>
      new Promise((resolve) => {
        const start = performance.now()
        const florida = document.getElementById('florida')
        const end =
          florida.getBoundingClientRect().top +
          scrollY -
          parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) -
          parseFloat(getComputedStyle(florida).scrollMarginTop)
        const frame = (now) => {
          const fraction = Math.min(1, (now - start) / 8000)
          window.scrollTo({ top: end * fraction, behavior: 'instant' })
          if (fraction < 1) requestAnimationFrame(frame)
          else resolve()
        }
        requestAnimationFrame(frame)
      }),
  )
  await scrollPage.waitForTimeout(500)
  await recording.close()
  await fs.writeFile('artifacts/mobile-tablet/results.json', JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
