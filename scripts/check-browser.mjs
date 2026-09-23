import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import assert from 'node:assert/strict'
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
const browser = await chromium.launch({
  channel:
    process.env.BROWSER_CHANNEL === 'chromium'
      ? undefined
      : process.env.BROWSER_CHANNEL || 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const errors = [],
    warnings = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
    if (msg.type() === 'warning' && !warnings.includes(msg.text())) warnings.push(msg.text())
  })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.locator('canvas').waitFor()
  await page.waitForTimeout(1600)
  fs.mkdirSync('artifacts', { recursive: true })
  await page.screenshot({ path: 'artifacts/desktop-hero.png' })
  const canvasHandle = await page.locator('canvas').elementHandle()
  const result = {
    desktop: {
      canvas: await page.locator('canvas').count(),
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    },
    errors,
    warnings,
  }
  const checkSceneDrag = async (shape) => {
    const region = await page.locator('.scene-region').boundingBox()
    const x = region.x + region.width * 0.5,
      y = region.y + region.height * 0.5
    assert.ok(
      await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === 'CANVAS', {
        x,
        y,
      }),
      shape + ' receives pointer input',
    )
    const surface = page.locator('.scene-interaction')
    const before = Number((await surface.getAttribute('data-drag-rotation')) || 0)
    const tiltBefore = Number((await surface.getAttribute('data-drag-tilt')) || 0)
    await page.mouse.move(x, y - 45)
    await page.mouse.move(x, y + 45)
    assert.equal(
      Number((await surface.getAttribute('data-drag-tilt')) || 0),
      tiltBefore,
      shape + ' ignores vertical hover',
    )
    assert.equal(
      Number((await surface.getAttribute('data-drag-rotation')) || 0),
      before,
      shape + ' ignores horizontal hover',
    )
    await page.mouse.move(x, y)
    await page.mouse.down()
    assert.equal(await surface.getAttribute('data-dragging'), 'true', shape + ' drag starts')
    await page.mouse.move(x, y + 50, { steps: 8 })
    assert.equal(
      Number((await surface.getAttribute('data-drag-rotation')) || 0),
      before,
      shape + ' ignores vertical dragging',
    )
    assert.equal(
      Number((await surface.getAttribute('data-drag-tilt')) || 0),
      0,
      shape + ' has no user-controlled tilt',
    )
    const renderedBefore = Number(await page.locator('canvas').getAttribute('data-rotation-y'))
    const direction = Math.abs(before) > 0.8 ? -Math.sign(before) : 1
    await page.mouse.move(x + 70 * direction, y + 50, { steps: 12 })
    const after = Number(await surface.getAttribute('data-drag-rotation'))
    assert.ok(Math.abs(after - before) > 0.4, shape + ' supports horizontal dragging')
    if (['sequencing', 'florida'].includes(shape))
      assert.ok(
        Math.abs(after) <= (70 * Math.PI) / 180,
        shape + ' stays within the readable drag range',
      )
    await page.mouse.up()
    await page.waitForTimeout(450)
    const renderedAfter = Number(await page.locator('canvas').getAttribute('data-rotation-y'))
    assert.ok(
      Math.abs(renderedAfter - renderedBefore) > 0.1,
      shape + ' renders horizontal rotation',
    )
    assert.equal(await surface.getAttribute('data-dragging'), 'false', shape + ' drag ends')
    await page.mouse.move(30, 150)
  }
  await checkSceneDrag('sphere')
  // Native wheel scrolling should reach the requested position without snapping.
  await page.evaluate(() => {
    window.__scrollFrames = []
    const until = performance.now() + 1000
    const sample = () => {
      window.__scrollFrames.push({
        y: scrollY,
        stage: Number(document.querySelector('canvas').dataset.morphStage),
      })
      if (performance.now() < until) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await page.mouse.wheel(0, 520)
  await page.waitForTimeout(1100)
  const frames = await page.evaluate(() => window.__scrollFrames)
  await page.waitForFunction(() => Math.abs(scrollY - 520) < 10, null, { timeout: 3000 })
  assert.ok(
    Math.abs((await page.evaluate(() => scrollY)) - 520) < 10,
    'Native wheel reaches intended position',
  )
  assert.ok(
    frames.every((f, i) => i === 0 || f.y >= frames[i - 1].y),
    'Wheel scrolling does not reverse direction',
  )
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(150)
  const rotationBefore = Number(await page.locator('canvas').getAttribute('data-rotation-y'))
  await page.waitForTimeout(500)
  const rotationAfter = Number(await page.locator('canvas').getAttribute('data-rotation-y'))
  assert.ok(Math.abs(rotationAfter - rotationBefore) > 0.02, 'Shape rotates without mouse movement')
  const headerBefore = await page.locator('.navbar').boundingBox()
  const headingBefore = await page.locator('#hero h1').boundingBox()
  const sceneBefore = await page.locator('.scene-region').boundingBox()
  result.heroPin = []
  for (const fraction of [0.25, 0.6, 0.96, 0.98, 1.15, 0.5, 0]) {
    await page.evaluate((f) => {
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo(0, innerHeight * 1.8 * f)
    }, fraction)
    await page.waitForTimeout(350)
    const state = await page.evaluate(() => ({
      top: document.querySelector('#hero').getBoundingClientRect().top,
      nextTop: document.querySelector('#pathogens').getBoundingClientRect().top,
      morph: Number(document.querySelector('#hero').dataset.morphProgress),
      height: innerHeight,
    }))
    result.heroPin.push({ fraction, ...state })
    if (fraction > 0 && fraction < 1) {
      assert.ok(Math.abs(state.top) < 2, 'Hero remains pinned')
      for (const [selector, before] of [
        ['.navbar', headerBefore],
        ['#hero h1', headingBefore],
        ['.scene-region', sceneBefore],
      ]) {
        const box = await page.locator(selector).boundingBox()
        assert.ok(
          Math.abs(box.y - before.y) < 2 && Math.abs(box.height - before.height) < 2,
          selector + ' stays visually fixed through the morph',
        )
      }
      assert.ok(state.nextTop >= state.height - 2, 'Next section remains outside viewport')
    }
    if (fraction >= 0.96) assert.equal(state.morph, 1, 'DNA complete before release')
    if (fraction > 1) assert.ok(state.top < -30, 'Hero releases after completed DNA')
    if (fraction === 0.98) await checkSceneDrag('DNA')
    if (fraction === 0.6 || fraction === 0.98)
      await page.screenshot({ path: 'artifacts/hero-morph-' + fraction + '.png' })
  }
  assert.ok(
    await page
      .locator('.navbar .wordmark img')
      .evaluate((img) => img.complete && img.naturalWidth > 0),
    'Existing SVG banner loads',
  )
  result.chapterHolds = []
  for (const [index, id] of ['pathogens', 'sequencing', 'network', 'florida'].entries()) {
    await page.evaluate((id) => {
      document.documentElement.style.scrollBehavior = 'auto'
      const section = document.getElementById(id)
      const start = Number(section.dataset.holdStart),
        end = Number(section.dataset.holdEnd)
      window.scrollTo(0, start + (end - start) * 0.8)
    }, id)
    await page.waitForTimeout(1400)
    // Incoming morph is still progressing halfway through the pin, not already paused.
    await page.evaluate((id) => {
      const section = document.getElementById(id)
      window.scrollTo({
        top:
          Number(section.dataset.holdStart) +
          (Number(section.dataset.holdEnd) - Number(section.dataset.holdStart)) * 0.4,
        behavior: 'instant',
      })
    }, id)
    await page.waitForTimeout(250)
    const incoming = Number(await page.locator('canvas').getAttribute('data-morph-stage'))
    assert.ok(
      incoming > index + 1 && incoming < index + 2,
      id + ' spends the pin morphing before a short hold',
    )
    await page.evaluate((id) => {
      const section = document.getElementById(id)
      window.scrollTo({
        top:
          Number(section.dataset.holdStart) +
          (Number(section.dataset.holdEnd) - Number(section.dataset.holdStart)) * 0.8,
        behavior: 'instant',
      })
    }, id)
    await page.waitForTimeout(250)
    await page.screenshot({ path: 'artifacts/desktop-' + id + '.png' })
    await checkSceneDrag(id)
    for (const fraction of [0.8, 0.9, 0.98]) {
      await page.evaluate(
        ({ id, fraction }) => {
          const section = document.getElementById(id)
          const start = Number(section.dataset.holdStart),
            end = Number(section.dataset.holdEnd)
          window.scrollTo(0, start + (end - start) * fraction)
        },
        { id, fraction },
      )
      await page.waitForTimeout(250)
      const state = await page.evaluate(
        (id) => ({
          top: document.getElementById(id).getBoundingClientRect().top,
          stage: Number(document.querySelector('canvas').dataset.morphStage),
        }),
        id,
      )
      assert.ok(Math.abs(state.top) < 2, id + ' stays pinned for reading')
      assert.ok(Math.abs(state.stage - (index + 2)) < 0.001, id + ' holds its COMPLETE form')
      result.chapterHolds.push({ id, fraction, ...state })
    }
  }
  result.persistentCanvas = await page.evaluate(
    (canvas) => canvas === document.querySelector('canvas'),
    canvasHandle,
  )
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Research', exact: true })
    .click()
  await page.waitForTimeout(1000)
  await page.locator('.research-row summary').first().click()
  result.researchExpanded =
    (await page.locator('.research-row').first().getAttribute('open')) !== null
  await page.screenshot({ path: 'artifacts/desktop-research.png' })
  result.accessibility = (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  ).violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.map((n) => n.target),
  }))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'artifacts/mobile-hero.png' })
  result.mobile = {
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  }
  await page.getByRole('button', { name: 'Menu +' }).click()
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Team', exact: true })
    .click()
  await page.waitForFunction(
    () => Math.abs(document.getElementById('team').getBoundingClientRect().top - 90) < 5,
  )
  result.mobile.menuClosed =
    (await page.getByRole('button', { name: 'Menu +' }).getAttribute('aria-expanded')) === 'false'
  await page.screenshot({ path: 'artifacts/mobile-team.png' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  result.reducedMotion = {
    scrollBehavior: await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    heading: await page.locator('h1').innerText(),
  }
  await page.screenshot({ path: 'artifacts/reduced-motion.png' })
  await page.setViewportSize({ width: 375, height: 812 })
  result.mobile375 = {
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  }

  const still1 = await page.locator('canvas').screenshot()
  await page.waitForTimeout(250)
  const still2 = await page.locator('canvas').screenshot()
  result.reducedMotion.stableFrames = still1.equals(still2)
  result.tablets = []
  for (const width of [768, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    result.tablets.push({
      width,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    })
    await page.screenshot({ path: 'artifacts/tablet-' + width + '.png' })
  }
  await page.keyboard.press('Tab')
  result.keyboardSkipLink = await page.evaluate(
    () => document.activeElement.className === 'skip-link',
  )
  result.anchorTargets = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href^="#"]')).every((a) =>
      document.getElementById(a.hash.slice(1)),
    ),
  )
  const fallbackContext = await browser.newContext()
  await fallbackContext.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes('webgl') ? null : original.call(this, type, ...args)
    }
  })
  const fallbackPage = await fallbackContext.newPage()
  await fallbackPage.goto(baseURL, { waitUntil: 'networkidle' })
  result.webglFallback =
    (await fallbackPage.locator('.scene-fallback img').isVisible()) &&
    (await fallbackPage.locator('h1').isVisible())
  await fallbackContext.close()
  fs.writeFileSync('artifacts/browser-check.json', JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))

  assert.equal(errors.length, 0, 'No runtime or network errors')
  assert.equal(result.desktop.canvas, 1, 'One persistent canvas')
  assert.equal(result.persistentCanvas, true, 'Canvas survives the entire story')
  assert.equal(
    result.desktop.overflow ||
      result.mobile.overflow ||
      result.mobile375.overflow ||
      result.tablets.some((t) => t.overflow),
    false,
    'No horizontal overflow',
  )
  assert.equal(result.accessibility.length, 0, 'No automated WCAG A/AA violations')
  assert.equal(
    result.researchExpanded &&
      result.mobile.menuClosed &&
      result.keyboardSkipLink &&
      result.anchorTargets &&
      result.webglFallback &&
      result.reducedMotion.stableFrames,
    true,
    'Interactions and fallbacks work',
  )
} finally {
  await browser.close()
}
