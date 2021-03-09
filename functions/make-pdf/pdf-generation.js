const chromium = require('chrome-aws-lambda')
const nunjucks = require('nunjucks')
const fetch = require('node-fetch')

// captures a github url (or just the path) of a permalink file on github:
// <optional github.com stuff>/<author>/<repo>/blob/<a commit sha>/<file path>
// the author, repo, sha, and file path are captured
const pathRegex = /^(?:(?:https?:\/\/)(?:www\.)?github\.com)?\/?([^\/]+)\/([^\/]+)\/blob\/([a-fA-F0-9]{5,40})\/(.*)\/?$/

// extracts info from a GitHub file permalink using pathRegex (defined above).
// Returns null if the path doesn't match the expected pattern
function parsePath(path) {
  const match = path.match(pathRegex)

  if (!match) {
    return null
  }

  const [_, owner, repo, commitSha, codePath] = match
  return { owner, repo, commitSha, path: codePath }
}

// fetches the raw (text) contents of a file on GitHub
async function fetchCode({ owner, repo, commitSha, path }) {
  const contentsResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${commitSha}`,
  )

  const contentsJson = await contentsResponse.json()
  const downloadUrl = contentsJson.download_url
  const codeResponse = await fetch(downloadUrl)
  return await codeResponse.text()
}

// creates a buffer containing a pdf file from the input html string (content)
// using Puppeteer
async function pdfBufferFromHtml(content) {
  const headless = !process.env.NETLIFY_DEV
  // Netlify probably greps function source code for `require(...)`
  // so this hack is here so that it doesn't complain about puppeteer.
  const puppeteer = headless ? chromium.puppeteer : require('puppet' + 'eer')

  // this loads Roboto Mono into the headless Chromium because it doesn't come
  // with any fonts other than Open Sans.
  await chromium.font(
    'https://rawcdn.githack.com/googlefonts/RobotoMono/8f651634e746da6df6c2c0be73255721d24f2372/fonts/ttf/RobotoMono-Regular.ttf',
  )
  const browser = await puppeteer.launch({
    executablePath: headless ? await chromium.executablePath : undefined,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    headless: headless || undefined,
  })
  const page = await browser.newPage()
  await page.setContent(content)
  const buffer = await page.pdf({ format: 'A4' })
  await browser.close()
  return buffer
}

async function generatePdfBuffer(path) {
  const codeAttributes = parsePath(path)
  if (!codeAttributes) {
    throw new Error(`Couldn't parse path: ${path}`)
  }

  const code = await fetchCode(codeAttributes)
  const codePage = nunjucks.render(require.resolve('./code.njk'), {
    code: code.split('\n'),
  })
  const buffer = await pdfBufferFromHtml(codePage)

  return buffer
}

module.exports = { generatePdfBuffer }
