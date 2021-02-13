const os = require('os')
const util = require('util')
const path = require('path')
const exec = util.promisify(require('child_process').exec)

const tmp = require('./tmp.js')
const serve = require('./serve.js')

const test = async function () {
  await Promise.all([
    'chrome/user-data',
    'chrome/disk-cache'
  ].map(dir => tmp.ensure(dir)))

  const chromeArgs = [
    'chrome',
    'https://localhost/test/test.html',
    '--test-type',
    '--ignore-certificate-errors',
    '--start-maximized',
    '--silent-debugger-extension-api',
    '--no-default-browser-check',
    '--no-first-run',
    '--noerrdialogs',
    '--enable-fixed-layout',
    '--disable-popup-blocking',
    '--disable-password-generation',
    '--disable-single-click-autofill',
    '--disable-prompt-on-repos',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-renderer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-restore-session-state',
    '--disable-new-profile-management',
    '--disable-new-avatar-menu',
    '--allow-insecure-localhost',
    '--reduce-security-for-testing',
    '--enable-automation',
    '--disable-device-discovery-notifications',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-site-isolation-trials',
    '--metrics-recording-only',
    '--disable-prompt-on-repost',
    '--disable-hang-monitor',
    '--disable-sync',
    '--disable-web-resources',
    '--safebrowsing-disable-download-protection',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--disable-ipc-flooding-protection',
    '--disable-backgrounding-occluded-window',
    '--disable-breakpad',
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-dev-shm-usage',
    `--user-data-dir="${path.resolve(__dirname, '../.tmp/chrome/user-data/')}"`,
    `--disk-cache-dir="${path.resolve(__dirname, '../.tmp/chrome/disk-cache/')}"`
  ]

  if (os.platform() === 'linux') {
    chromeArgs.push('--disable-gpu')
    chromeArgs.push('--no-sandbox')
  }

  const { stdout, stderr } = await exec(chromeArgs.join(' '))
  console.log(stdout)
  console.error(stderr)
}

const errors = []
serve.serve()
  .then(() => test())
  .catch(err => {
    errors.push(err)
  })
  .then(() => {
    if (errors.length > 0) {
      errors.forEach(err => console.error(err.stack))
      return process.exit(1)
    }
    process.exit(0)
  })
