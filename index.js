const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs')

puppeteer.use(StealthPlugin())

async function scrape() {
  let browser = await puppeteer.launch({ headless: false })
  let page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setRequestInterception(true)

  await page.on('request', (req) => {
    if (req.resourceType() == 'font' || req.resourceType() == 'image') {
      req.abort()
    }
    else {
      req.continue()
    }
  })

  await page.goto('https://www.dns-shop.ru/catalog/17a8d26216404e77/vstraivaemye-xolodilniki/', {waitUntil: 'domcontentloaded'})

  await page.waitForTimeout(1000)

  const pageCount = 5

  for (let i = 1; i < pageCount; i++) {
    await page.waitForTimeout(500)
    await page.click('.pagination-widget__show-more-btn')
  }

  const allProducts = await page.$$('div.catalog-product', el => el)

  const result = []
  for (product of allProducts) {
    result.push({
      title: await product.$eval('a.catalog-product__name > span', e => e.innerText),
      price: await product.$eval('div.product-buy__price', e => e.innerText)
    })
  }

  browser.close()
  return result
}

const writeStream = fs.createWriteStream('data.csv')

scrape().then((res) => {
  res.forEach((product) => {
    let newLine = []
    newLine.push(product.title)
    newLine.push(product.price)
    writeStream.write(newLine.join(' ') + '\n')
  })
  writeStream.end()
})