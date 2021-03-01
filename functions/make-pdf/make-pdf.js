const { generatePdfBuffer } = require('./pdf-generation')

async function handler(event) {
  try {
    const path = event.queryStringParameters.path
    const buffer = await generatePdfBuffer(path)

    return {
      statusCode: 200,
      isBase64Encoded: true,
      body: buffer.toString('base64'),
      headers: {
        'Content-disposition': 'attachment; filename=code.pdf',
        'Content-Type': 'application/pdf',
      },
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: error.message }),
    }
  }
}

module.exports = { handler }
