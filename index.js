const express = require('express')
const nunjucks = require('nunjucks')
const { generatePdfBuffer } = require('./pdfGeneration')

const app = express()
app.use(express.static('public'))

nunjucks.configure('views', {
  autoescape: true,
  express: app,
})

app.get('/', async (request, response) => {
  response.render('index.njk', { title: 'boop', template: 'layout.njk' })
})

app.get('/*', async (request, response) => {
  try {
    const buffer = await generatePdfBuffer(request.path)

    response.set('Content-disposition', 'attachment; filename=code.pdf')
    response.set('Content-Type', 'application/pdf')

    response.send(buffer)
  } catch (e) {
    console.error(e)
    response.render('nope.njk', { title: 'nah', template: 'layout.njk' })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
