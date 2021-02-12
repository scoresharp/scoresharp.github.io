const fs = require('fs')
const path = require('path')
const http2 = require('http2')
const { URL } = require('url')

const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_AUTHORIZATION
} = http2.constants

const databasePath = path.resolve(__dirname, '../database/')

const clients = {}
/**
 * A very simple HTTP client for executing GET requests
 * @param {string} url The url to be fetched
 * @param {Object} options The options to consider when making the request
 * @returns {Promise<Object>} Resolves with the plain body when successful
 */
const fetch = async function (url, options) {
  const parsedUrl = new URL(url)

  return new Promise((resolve, reject) => {
    if (!clients[parsedUrl.origin]) {
      clients[parsedUrl.origin] = http2.connect(parsedUrl.origin)
    }
    const client = http2.connect(parsedUrl.origin) || clients[parsedUrl.origin]
    client.on('error', (err) => {
      delete clients[parsedUrl.origin]
      reject(err)
    })

    const req = client.request(Object.assign(
      {
        [HTTP2_HEADER_PATH]: parsedUrl.pathname + parsedUrl.search
      },
      (options && options.headers) || {}
    ))

    req.on('response', (headers, flags) => {
      if (headers[HTTP2_HEADER_STATUS] > 399) {
        return reject(new Error(`Failed to fetch "${url}", because it responded with error code ${headers[HTTP2_HEADER_STATUS]}.`))
      }
    })

    if (options.output) {
      req.pipe(options.output)
      req.on('end', () => {
        client.close()
        resolve()
      })
    } else {
      req.setEncoding('utf8')
      let data = ''
      req.on('data', chunk => { data += chunk })
      req.on('end', () => {
        client.close()
        resolve(data)
      })
    }

    // Finish request to be able to receive results
    req.end()
  })
}

// Token as taken from the static hosted source code
const token = '38fb9efaae51b0c83b5bb5791a698b48292129e7'
const downloadLimit = 100
let downloadCount = 0

/**
 * Fetches the MIDI file of a MuseScore score
 * @param {Object} score The score metadata
 * @returns {Promise<void>} Resolves once the score is added to the library
 */
const fetchScore = async function (score) {
  const body = await fetch(`https://musescore.com/api/jmuse?id=${score.id}&type=midi&index=0&v2=1`, {
    headers: {
      [HTTP2_HEADER_AUTHORIZATION]: token
    }
  })
  const filePath = path.resolve(databasePath, 'songs', score.id)
  await fetch(
    JSON.parse(body).info.url,
    {
      output: fs.createWriteStream(filePath + '.mid')
    }
  )
  // TODO: compute difficulty ratings
  await fs.promises.writeFile(filePath + '.json', JSON.stringify({
    title: score.title,
    duration: score.duration,
    rating: score.rating.rating
  }, null, 2))
}

// TODO: load existing songs and skip existing songs
// The index of all the downloaded songs
const index = {}
try {
  // Load exiting index
  const ids = require('../database/songIndex.json')
  ids.forEach(id => { index[id] = true })
} catch (e) { }

/**
 * Fetches all the songs related to a search result
 * @param {string} url The search query to be fetched
 * @param {number} page The current page of the search result to fetch
 * @returns {Promise<void>} Resolves once all related scores are added to the library
 */
const fetchSearch = async function (url, page = 0) {
  const searchUrl = url + (page ? '&page=' + page : '')
  const body = await fetch(searchUrl, {
    headers: {
      'x-requested-with': 'XMLHttpRequest' // Makes it send it in json format
    }
  })
  const parsedBody = JSON.parse(body)
  const scores = parsedBody.info.scores
  await Promise.all(scores.map(async score => {
    if (
      downloadCount >= downloadLimit ||
      index[score.id]
    ) {
      return
    }
    downloadCount++
    index[score.id] = true
    await fetchScore(score.id)
  }))
  if (downloadCount < downloadLimit && page < 100) {
    await fetchSearch(url, page + 1)
  }
}

// Download most popular piano based solo songs
const searchUrl = encodeURI(
  'https://musescore.com/sheetmusic' +
  '?instrumentation=114' +
  '&musicxml_instruments=1,135,180,241,53,63' +
  '&parts=1+' +
  '&sort=rating'
)

const errors = []
fetchSearch(searchUrl)
  .catch(err => {
    errors.push(err)
    console.error(err.stack)
  })
  .then(async () => {
    await fs.promises.writeFile(
      path.resolve(databasePath, 'songIndex.json'),
      JSON.stringify(Object.keys(index))
    )
  })
  .then(() => {
    const git = require('./git.js')
    return git.push('database', process.env.DATABASE_TOKEN)
  })
  .then(() => {
    Object.keys(clients).forEach(k => clients[k].close())

    // Check errors and reflect status
    if (errors.length > 0) {
      return process.exit(1)
    }
    process.exit(0)
  })
