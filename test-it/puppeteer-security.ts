const assert = require('assert').strict
const config = require('config')
const puppeteer = require('puppeteer')

const getCookies = async (page) => {
  const array = await page.cookies()
  const cookies = {}
  for (const cookie of array) {
    cookies[cookie.name] = cookie.value
  }
  return cookies
}

describe('puppeteer security', () => {
  let browser
  before(async() => {
    browser = await puppeteer.launch(config.puppeteerLaunchOptions)
  })
  after(async() => {
    await browser.close()
  })
  it('control cookies sharing accross incognito contexts', async () => {
    // page in incognito context
    const context1 = await browser.createIncognitoBrowserContext()
    const context1page1 = await context1.newPage()
    await context1page1.goto('https://koumoul.com', { waitUntil: 'networkidle0' })
    await context1page1.setCookie({ name: 'test', value: 'test1' })
    const cookies1 = await getCookies(context1page1)
    assert.equal(cookies1.test, 'test1')

    // another page in the same incognito context shares the cookies
    const context1page2 = await context1.newPage()
    await context1page2.goto('https://koumoul.com', { waitUntil: 'networkidle0' })
    const cookies2 = await getCookies(context1page2)
    assert.equal(cookies2.test, 'test1')

    const context2 = await browser.createIncognitoBrowserContext()
    const context2page1 = await context2.newPage()
    await context2page1.goto('https://koumoul.com', { waitUntil: 'networkidle0' })
    const cookies3 = await getCookies(context2page1)
    assert.equal(cookies3.test, undefined)
  })
})
