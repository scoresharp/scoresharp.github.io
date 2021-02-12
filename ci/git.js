const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const push = async function (dir, token) {
  const options = {
    cwd: path.resolve(__dirname, '..', dir)
  }
  dir = dir || 'scoresharp.github.io.git'
  let ret = await exec('git add --all', options)
  ret = await exec(`git -c 'user.name=CI' -c 'user.email=CI@github.com' commit -m 'Push update to ${dir} at ${Date.now()}'`, options)
  ret = await exec(`git push 'https://${token}@github.com/scoresharp/${dir}.git' HEAD:main`, options)
  console.log(ret.stdout)
  console.error(ret.stderr)
}

module.exports.push = push
