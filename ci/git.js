const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const push = async function (dir, token) {
  const options = {
    cwd: path.resolve(__dirname, '..', dir)
  }
  dir = dir || 'scoresharp.github.io.git'
  await exec('git add --all', options)
  await exec(`git commit -m Push update to ${dir} at ${Date.now()}`, options)
  await exec(`git push https://${token}@github.com/scoresharp/${dir}.git`, options)
}

module.exports.push = push
