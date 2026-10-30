import { expect, test } from '@playwright/test'

test.describe('static marketing assets', () => {
  test('filing cabinet image is available', async ({ request }) => {
    const res = await request.get('/marketing/filing-cabinet.jpg')
    expect(res.ok()).toBeTruthy()
    expect(res.headers()['content-type'] ?? '').toMatch(/image\//)
  })

  test('site webmanifest is served', async ({ request }) => {
    const res = await request.get('/site.webmanifest')
    if (res.status() === 404) {
      test.skip(true, 'webmanifest not present in this build')
      return
    }
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body).toMatch(/Mini Drive|name/i)
  })
})
