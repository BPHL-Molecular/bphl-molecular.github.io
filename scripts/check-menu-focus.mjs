import { chromium, webkit, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
await fs.mkdir('artifacts/mobile-tablet', { recursive: true })
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch({
    ...(engine === chromium ? { channel: 'chrome' } : {}),
    headless: true,
  })
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
    })
    await context.route('https://api.github.com/**', (route) => route.fulfill({ json: [] }))
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    const menu = page.getByRole('button', { name: 'Menu', exact: true })
    const dialog = page.getByRole('dialog', { name: 'Site menu' })
    const close = dialog.getByRole('button', { name: 'Close', exact: true })
    const outline = (locator) => locator.evaluate((el) => getComputedStyle(el).outlineStyle)
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }))
    const y = await page.evaluate(() => scrollY)
    await menu.tap()
    await expect(close).toBeFocused()
    assert.equal(await outline(close), 'none', 'Tapping Menu focuses Close without an outline')
    assert.equal(await page.evaluate(() => document.body.style.top), `${-y}px`)
    await page.screenshot({ path: `artifacts/mobile-tablet/menu-touch-${engine.name()}.png` })
    await close.tap()
    await expect(dialog).not.toBeVisible()
    await expect(menu).toBeFocused()
    assert.equal(await outline(menu), 'none', 'Touch close restores focus without a ring')
    assert.equal(await page.evaluate(() => scrollY), y)
    for (const key of ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']) {
      await page.keyboard.press(key)
      assert.equal(await outline(menu), 'none', `${key} scrolling must not outline Menu`)
    }
    await menu.press('Enter')
    await expect(close).toBeFocused()
    assert.equal(await outline(close), 'solid', 'Keyboard open shows focus on Close')
    await page.keyboard.press('ArrowUp')
    assert.equal(await outline(close), 'solid', 'Scrolling preserves intentional keyboard focus')
    await page.keyboard.press('Tab')
    const about = dialog.getByRole('link', { name: 'About', exact: true })
    await expect(about).toBeFocused()
    assert.equal(await outline(about), 'solid', 'Keyboard navigation retains its indicator')
    await page.keyboard.press('Escape')
    await expect(menu).toBeFocused()
    assert.equal(await outline(menu), 'solid')
    await menu.tap()
    await expect(close).toBeFocused()
    assert.equal(
      await outline(close),
      'none',
      'Touch after keyboard use clears only the visual ring',
    )
    await page.keyboard.press('Tab')
    await expect(about).toBeFocused()
    assert.equal(
      await outline(about),
      'solid',
      'Switching back to keyboard immediately restores focus styling',
    )
    await dialog.getByRole('link', { name: 'Training', exact: true }).tap()
    await expect(dialog).not.toBeVisible()
    await page.waitForFunction(
      () =>
        Math.abs(
          document.getElementById('training').getBoundingClientRect().top -
            parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
        ) < 4,
    )
    assert.equal(await page.evaluate(() => document.body.style.position), '')
    assert.deepEqual(errors, [])
    console.log(
      `${engine.name()}: touch, keyboard, mixed input, focus restoration, scroll lock, and link navigation passed.`,
    )
    await context.close()
  } finally {
    await browser.close()
  }
}
