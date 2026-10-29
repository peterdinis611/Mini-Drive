/**
 * Capture README screenshots from a running Mini Drive instance.
 *
 *   CI=true ./node_modules/.bin/vite dev --port 3010
 *   PLAYWRIGHT_BASE_URL=http://localhost:3010 node scripts/capture-screenshots.mjs
 *
 * Optional auth (files + share dialog):
 *   E2E_CLERK_USER_EMAIL=… E2E_CLERK_USER_PASSWORD=…
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3010'
const outDir = path.resolve('docs/screenshots')
const email = process.env.E2E_CLERK_USER_EMAIL
const password = process.env.E2E_CLERK_USER_PASSWORD

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})

async function shot(name, fullPage = false) {
  const file = path.join(outDir, name)
  await page.screenshot({
    path: file,
    type: 'jpeg',
    quality: 88,
    fullPage,
  })
  console.log('wrote', file)
}

try {
  await page.goto(baseURL + '/', { waitUntil: 'networkidle', timeout: 60_000 })
  await page.waitForSelector('h1', { timeout: 30_000 })
  // Let motion settle
  await page.waitForTimeout(900)
  await shot('landing.jpg')

  // Prefer light marketing chrome for README gallery consistency
  const themeToggle = page.getByRole('button', {
    name: /Zapnúť (tmavý|svetlý) režim/,
  })
  if (await themeToggle.count()) {
    const label = await themeToggle.getAttribute('aria-label')
    if (label?.includes('svetlý')) await themeToggle.click()
  }

  if (!email || !password) {
    console.warn(
      'No Clerk credentials — capturing live landing sections (not /files UI).',
    )
    console.warn(
      'For real Drive + share dialog: E2E_CLERK_USER_EMAIL + E2E_CLERK_USER_PASSWORD',
    )
    await page
      .getByRole('heading', { name: /Všetko na jednom mieste/i })
      .scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await shot('files.jpg')

    await page
      .getByRole('heading', { name: /Tri ťahy do safe-url/i })
      .scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await shot('share.jpg')
  } else {
    await page.goto(baseURL + '/sign-in', { waitUntil: 'networkidle' })
    await page.waitForSelector('input', { timeout: 20_000 })
    // Clerk email/password — identifiers vary by instance
    const emailInput = page
      .locator(
        'input[name="identifier"], input[type="email"], input[name="emailAddress"]',
      )
      .first()
    await emailInput.fill(email)
    await page
      .locator('button:has-text("Continue"), button:has-text("Pokračovať")')
      .first()
      .click()
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.waitFor({ timeout: 15_000 })
    await passwordInput.fill(password)
    await page
      .locator(
        'button:has-text("Continue"), button:has-text("Sign in"), button:has-text("Prihlásiť")',
      )
      .first()
      .click()
    await page.waitForURL(/\/(files|onboarding)/, { timeout: 45_000 })
    if (page.url().includes('onboarding')) {
      // Skip through if possible
      const skip = page.getByRole('button', { name: /Preskočiť|Skip/i })
      if (await skip.count()) await skip.first().click()
      await page.waitForURL(/\/files/, { timeout: 30_000 }).catch(() => {})
    }
    await page.goto(baseURL + '/files', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await shot('files.jpg')

    // Open share on first file if available
    const shareBtn = page
      .getByRole('button', { name: /Zdieľať|Share/i })
      .first()
    if (await shareBtn.count()) {
      await shareBtn.click()
      await page.waitForTimeout(600)
      await shot('share.jpg')
    } else {
      await page
        .getByRole('heading', { name: /Tri ťahy do safe-url/i })
        .catch(() => null)
      console.warn(
        'No share button found — leaving share.jpg from previous run if any',
      )
    }
  }

  await writeFile(
    path.join(outDir, 'CAPTURED_AT.txt'),
    `Captured ${new Date().toISOString()} from ${baseURL}\n`,
  )
} finally {
  await browser.close()
}
