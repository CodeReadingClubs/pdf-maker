const express = require('express')
const puppeteer = require('puppeteer')
const nunjucks = require('nunjucks')
const fetch = require('node-fetch')

const app = express()
app.use(express.static('public'))

nunjucks.configure('views', {
  autoescape: true,
  express: app,
})

// extracts info from a GitHub url:
// /CodeReadingClubs/Resources/blob/6aad5aa8a6.../StarterKit/README.md
// | owner          | repo    |drop| commitSha   | path
//
// returns null if the path doesn't match the expected pattern
function parsePath(path) {
  const parts = path.slice(1).split('/')
  if (parts.length < 5) {
    return null
  }

  const [owner, repo, theWordBlob, commitSha, ...codePath] = parts
  if (theWordBlob !== 'blob') {
    return null
  } else if (!/^[0-9a-f]{5,40}$/.test(commitSha)) {
    return null
  }

  return { owner, repo, commitSha, path: codePath.join('/') }
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
async function pdfBuffer(content) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setContent(content)
  const buffer = await page.pdf({ format: 'A4' })
  await browser.close()
  return buffer
}

app.get('/', async (request, response) => {
  response.render('index.njk', { title: 'boop', template: 'layout.njk' })
})

app.get('/*', async (request, response) => {
  const codeAttributes = parsePath(request.path)
  if (!codeAttributes) {
    response.render('nope.njk', { title: 'nah', template: 'layout.njk' })
    return
  }

  const code = await fetchCode(codeAttributes)
  const codePage = nunjucks.render('code.njk', { code: code.split('\n') })
  const buffer = await pdfBuffer(codePage)

  response.set('Content-disposition', 'attachment; filename=code.pdf')
  response.set('Content-Type', 'application/pdf')

  response.send(buffer)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
