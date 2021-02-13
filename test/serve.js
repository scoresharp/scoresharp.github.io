const os = require('os')
const fs = require('fs')
const util = require('util')
const path = require('path')
const exec = util.promisify(require('child_process').exec)
const http2 = require('http2')

const tmp = require('./tmp.js')

const {
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE,
  HTTP2_HEADER_PATH
} = http2.constants

const certificates = async function () {
  const certificatesFolder = await tmp.ensure('certificates')
  const keyFileName = 'localhost-privkey.pem'
  const certFileName = 'localhost-cert.pem'

  const readFiles = async function () {
    const [key, cert] = await Promise.all([
      fs.promises.readFile(path.resolve(certificatesFolder, keyFileName)),
      fs.promises.readFile(path.resolve(certificatesFolder, certFileName))
    ])
    return {
      key: key,
      cert: cert
    }
  }

  const createFiles = async function () {
    let openssl = 'openssl'

    // Find git and packaged openssl
    if (os.platform() === 'win32') {
      const gitDir = await exec('where git')
      openssl = `"${path.resolve(gitDir.stdout, '../../usr/bin/openssl.exe')}"`
    }

    const opensslArgs = [
      openssl,
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-sha256',
      "-subj '/CN=localhost'",
      '-keyout',
      keyFileName,
      '-out',
      certFileName
    ]

    await exec(opensslArgs.join(' '), {
      cwd: certificatesFolder
    })
  }

  try {
    return await readFiles()
  } catch (err) {
    await createFiles()
    return readFiles()
  }
}

const serve = async function () {
  const options = await certificates()

  // Create a secure HTTP/2 server
  const server = http2.createSecureServer(options)

  const mime = function (url) {
    const ext = path.extname(url)

    // ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
    const mimes = {
      // html
      '.html': 'text/html',

      // css
      '.css': 'text/css',

      // javascript
      '.js': 'text/javascript',
      '.mjs': 'text/javascript',
      '.json': 'application/json',

      // MIDI
      '.mid': 'audio/midi',
      '.midi': 'audio/midi'
    }

    const ret = mimes[ext]
    if (!ret) {
      throw new Error(`Failed to resolve mime type for ${ext}`)
    }
    return ret
  }

  server.on('stream', async (stream, headers) => {
    try {
      let url = headers[HTTP2_HEADER_PATH]
      if (url === '/') {
        url = '/index.html'
      }
      const mimeType = mime(url)

      await new Promise((resolve, reject) => {
        try {
          const file = fs.createReadStream(
            path.resolve(
              __dirname,
              '..',
              '.' + url
            )
          )

          stream.respond({
            [HTTP2_HEADER_STATUS]: 200,
            [HTTP2_HEADER_CONTENT_TYPE]: mimeType
          })
          file.on('error', reject)
          file.on('close', resolve)
          file.pipe(stream)
        } catch (e) {
          reject(e)
        }
      })
    } catch (e) {
      stream.respond({
        [HTTP2_HEADER_STATUS]: 500,
        [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain'
      })
      stream.end(e.stack)
    }
  })

  return new Promise((resolve, reject) => {
    server.listen(Number.parseInt(process.env.PORT, 10) || 443, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

module.exports.serve = serve
if (module === require.main) {
  module.exports.serve()
}
