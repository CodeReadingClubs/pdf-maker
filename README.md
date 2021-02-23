# PDF Maker

A tool to create PDFs from code on github.com for
[Code Reading Clubs](https://code-reading.org/).

## How it's made

The main logic is in `functions/make-pdf/pdf-generation.js`, where the
`generatePdfBuffer` function takes a path (or a full url) of a GitHub permalink
and returns a pdf buffer containing that file's contents.

It works in three steps:

1. First it parses the path to get the author, repo, commit SHA, and file path.
2. Then it queries GitHub's API for the contents of that file.
3. Then it uses Puppeteer to render that code as HTML and export it as PDF.

This function is used in the netlify function in
`functions/make-pdf/make-pdf.js`, which is accessible at
`/.netlify/functions/make-pdf?path=ENTER_GITHUB_PATH_HERE`. It's used in
`index.html`.

## How to run it

You'll need to use the netlify-cli:

```shell
$ npm install --global netlify-cli
```

Use `netlify dev` from the root folder of the project to run a local server
which will mirror the behaviour in production.

The endpoint is accessible at
`localhost:8888/.netlify/functions/make-pdf?path=ENTER_GITHUB_PATH_HERE`
