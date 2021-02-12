const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const push = async function (dir) {
  const options = {
    cwd: path.resolve(__dirname, '..', dir || '.')
  }
  dir = dir || 'main'
  let ret = await exec('git add --all', options)
  ret = await exec(`git -c 'user.name=CI' -c 'user.email=CI@github.com' commit -m 'Push update to ${dir} at ${Date.now()}'`, options)
  ret = await exec(`git push 'https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@github.com/scoresharp/scoresharp.github.io.git' HEAD:${dir}`, options)
  console.log(ret.stdout)
  console.error(ret.stderr)
}

module.exports.push = push
